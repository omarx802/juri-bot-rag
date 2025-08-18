# process data
def process_data(path):
    with open(path,'r',encoding='utf-8') as f:
        return f.read()

# chunking
def chunk(data,chunk_size=750,overlap=200):
    chunks=[]
    start=0
    while start<len(data):
        end =start+chunk_size
        chunks.append(data[start:end])
        start+=chunk_size-overlap
    return chunks


