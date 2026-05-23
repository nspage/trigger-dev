import requests
import json
import re

urls = [
    "https://twitter.com/iamsupersocks/status/2039962768783053311",
    "https://twitter.com/brendanboyle87/status/2040726475049926680",
    "https://twitter.com/agenticgirl/status/2041847750946607241",
    "https://twitter.com/Sandymac1000/status/2041944680716275813",
    "https://twitter.com/BedRockDocs/status/2056709460865716272"
]

results = []
for i, url in enumerate(urls):
    resp = requests.get(f"https://publish.twitter.com/oembed?url={url}").json()
    html = resp['html']
    # extract the paragraph text
    match = re.search(r'<p[^>]*>(.*?)</p>', html, flags=re.DOTALL)
    text = match.group(1) if match else "Text not found"
    
    # basic cleanup
    text = re.sub(r'<a href="https://t\.co/.*?</a>', '', text) # remove trailing t.co links
    text = text.replace('<br>', ' ').replace('\n', ' ').strip()
    
    handle = "@" + resp['author_url'].split('/')[-1]
    
    results.append({
        "id": f"xp{i+1}",
        "name": resp['author_name'],
        "handle": handle,
        "content": text
    })

print(json.dumps(results, indent=2))
