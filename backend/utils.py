from markitdown import MarkItDown

# process data
def process_d(path):
    md = MarkItDown(enable_plugins=False)
    result = md.convert(path)
    return result.text_content

# chunking
def chunk(data, chunk_size=750, overlap=200):
    chunks = []
    start = 0
    while start < len(data):
        end = start + chunk_size
        chunks.append(data[start:end])
        start += chunk_size - overlap
    return chunks


