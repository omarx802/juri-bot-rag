import re

# ___process data
def process_data(path):
    with open(path,'r',encoding='utf-8') as f:
        return f.read()


#  ___chunking
def chunk(data):

    title_pattern = re.compile(r'(?m)^\s*(Title [A-Za-z]+\.?[^\n]*)')
    article_pattern = re.compile(r'(?m)^\s*(Article \d+\.?)(?=\s|$)')

    titles = [(m.start(), m.group(1).strip()) for m in title_pattern.finditer(data)]
    articles = [(m.start(), m.group(1).strip()) for m in article_pattern.finditer(data)]

    articles.append((len(data), None))

    chunks = []
    curr_title = "Preamble"
    title_idx = 0
    for i in range(len(articles)-1):
        art_start, art_marker = articles[i]
        art_end, _ = articles[i+1]
        while (title_idx < len(titles)) and (titles[title_idx][0] < art_start):
            curr_title = titles[title_idx][1]
            title_idx += 1

        art_text = data[art_start:art_end].strip()
        art_text = re.sub(rf'^{re.escape(art_marker)}', '', art_text).strip()
        chunks.append({
            "title": curr_title,
            "article": art_marker,
            "text": art_text
        })
    return chunks


