import os
from pathlib import Path
from dotenv import load_dotenv
import chromadb
import gradio as gr
from openai import AzureOpenAI
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from utils import process_d, chunk

load_dotenv()
deployment = "gpt-4o-mini"
api_version = "2024-12-01-preview"

BASE_DIR = Path(__file__).resolve().parent
path= BASE_DIR / "data" / "cuisine.pdf"

# loading data 
data = process_d(path)

# chunking data
chuncked = chunk(data)

# azure openai client
client = AzureOpenAI(
    api_version = api_version,
    azure_endpoint = os.getenv("azure_endpoint"),
    api_key = os.getenv("api_key_azure"),
)

# embedding
chroma_client = chromadb.Client()
embedding_function = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")
chroma_collection = chroma_client.create_collection("my_col", embedding_function=embedding_function)
ids = [str(i) for i in range(len(chuncked))]
BATCH_SIZE = 350
for i in range(0, len(chuncked), BATCH_SIZE):
    batch_ids = ids[i:i+BATCH_SIZE]
    batch_docs = chuncked[i:i+BATCH_SIZE]
    chroma_collection.add(ids=batch_ids, documents=batch_docs)

# retrieval
def response_(query, deployment=deployment):
    results = chroma_collection.query(query_texts=[query], n_results=5)
    retrieved_documents = results['documents'][0]

    information = "\n\n".join(retrieved_documents)

    messages = [
            {
                "role": "system",
                "content": "You are a helpful assistant. Your users are asking questions about information contained in an document. You will be shown the user's question, and the relevant information from this document. Answer the user's question using only this information. Be precise as you can briefly. If the information is not present in the resume, say 'I don't know'."
            },
            {
                "role": "user",
                "content": f"Question: {query}. \n Information: {information}"
            }
        ]
        
    response = client.chat.completions.create(
            messages=messages,
            model=deployment,
        )
    return response.choices[0].message.content



#interface
with gr.Blocks(title="RAG Demo") as demo:
        gr.Markdown("# RAG Demo")
        with gr.Column(elem_id="app-container"):
            query = gr.Textbox(
                placeholder="Ask a question...",
                label="Ask a question",
                elem_id="big-textbox"
            )
            sub_button = gr.Button("Submit", scale=1, variant="primary")
            output = gr.Textbox()

            sub_button.click(fn=response_, inputs=query, outputs=output)

if __name__ == "__main__":
    demo.launch()
