import os
from pathlib import Path
from dotenv import load_dotenv
import chromadb
from openai import AzureOpenAI
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from flask import Flask
from flask_socketio import SocketIO, emit
from utils import process_data, chunk

load_dotenv()
deployment = "gpt-4o-mini"
api_version = "2024-12-01-preview"

BASE_DIR = Path(__file__).resolve().parent

# load n chunk
path_1959 = BASE_DIR / "data" / "tunisia1959.txt"
path_2014 = BASE_DIR / "data" / "tunisia2014.txt"
data_1959 = process_data(path_1959)
data_2014 = process_data(path_2014)
chunks_1959 = chunk(data_1959)
chunks_2014 = chunk(data_2014)

# Azure OpenAI client
client = AzureOpenAI(
    api_version=api_version,
    azure_endpoint=os.getenv("azure_endpoint"),
    api_key=os.getenv("api_key_azure"),
)

# embedding
chroma_client = chromadb.Client()
embedding_function = SentenceTransformerEmbeddingFunction(model_name="all-MiniLM-L6-v2")

# 2 collections
collection_1959 = chroma_client.create_collection("tunisia_1959", embedding_function=embedding_function)
collection_2014 = chroma_client.create_collection("tunisia_2014", embedding_function=embedding_function)

# 1959_collection
ids_1959 = [f"1959_{i}" for i in range(len(chunks_1959))]
BATCH_SIZE = 350
for i in range(0, len(chunks_1959), BATCH_SIZE):
    batch_ids = ids_1959[i:i+BATCH_SIZE]
    batch_docs = chunks_1959[i:i+BATCH_SIZE]
    collection_1959.add(ids=batch_ids, documents=batch_docs)

# 2014_collection
ids_2014 = [f"2014_{i}" for i in range(len(chunks_2014))]
for i in range(0, len(chunks_2014), BATCH_SIZE):
    batch_ids = ids_2014[i:i+BATCH_SIZE]
    batch_docs = chunks_2014[i:i+BATCH_SIZE]
    collection_2014.add(ids=batch_ids, documents=batch_docs)

# retrieval ___ index selection
def response_(query, constitution, deployment=deployment):
    if constitution == "1959":
        collection = collection_1959
    else:
        collection = collection_2014

    results = collection.query(query_texts=[query], n_results=5)
    retrieved_documents = results['documents'][0]
    information = "\n\n".join(retrieved_documents)

    messages = [
        {
            "role": "system",
            "content": "You are a helpful assistant. Your users are asking questions about information contained in an document. You will be shown the user's question, and the relevant information from this document. Answer the user's question using only this information. Be precise as you can. If the information is not present in the document, say 'I don't know'."
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

# Flask part
app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

@app.route("/")
def index():
    return "Flask-SocketIO running"

@socketio.on('query')
def handle_query(query, constitution):
    response = response_(query, constitution)
    emit('response', response)

if __name__ == "__main__":
    import eventlet
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)