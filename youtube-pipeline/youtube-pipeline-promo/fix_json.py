import json

data = [
  {
    "id": "xp1",
    "name": "Supersocks",
    "handle": "@iamsupersocks",
    "content": "Karpathy vient de mass-drop un workflow complet pour construire des wikis personnels pilotés par LLM : ingestion de données brutes → compilation en wiki .md → Q&A sur ~400K mots sans RAG fancy → outputs visuels (slides, graphes) re-filés dans la base. Le tout dans Obsidian.…"
  },
  {
    "id": "xp2",
    "name": "Brendan Boyle",
    "handle": "@brendanboyle87",
    "content": "So this is a wiki per topic right? How do you handle source quality? Are you reading the full source before adding to the knowledge base or if not is there any quality bar post llm ingestion?"
  },
  {
    "id": "xp3",
    "name": "Sandhya",
    "handle": "@agenticgirl",
    "content": "Someone built Karpathy's LLM Wiki idea with 100 Korean stocks. 499 articles. One knowledge base. Claude handles ingestion, cross-linking, and synthesis. He asked one question: \"What are the hot topics right now?\" It didn't summarize articles. It found six macro themes nobody…"
  },
  {
    "id": "xp4",
    "name": "Sandy Mckinnon",
    "handle": "@Sandymac1000",
    "content": "I built one too :-) Wiki Forge is directly inspired by Andrej Karpathy's personal LLM wiki pattern -> A local-first personal knowledge base built on Obsidian, with AI-doc ingestion, classification, summarisation, and synthesis. Drop doc— PDF, PPTX, DOCX"
  },
  {
    "id": "xp5",
    "name": "Fred Creason",
    "handle": "@BedRockDocs",
    "content": "Strange things about which I wonder. Me: If I were building a personal knowledge base upon which to run a local llm, which of the two files above would be most valuable in that context? [BoatSinker_Pie.json & BoatSinker_Pie_AST.txt] Follow-up: Yes, design a 'ingestion pipeline'…"
  }
]

for d in data:
    j = json.dumps({"name": d["name"], "handle": d["handle"], "content": d["content"]})
    # Since we enclose the attribute in single quotes (data-variable-values='...'), 
    # we need to escape single quotes so they don't break the HTML attribute.
    # Wait, actually, standard HTML allows single quotes inside single quotes if escaped as &#39;
    j = j.replace("'", "&#39;")
    print(f"<div class=\"x-post-wrapper\" id=\"{d['id']}\">")
    print(f"  <div data-composition-id=\"x-post\" data-composition-src=\"compositions/x-post.html\" data-start=\"4.5\" data-duration=\"6\" data-track-index=\"1\" data-width=\"1920\" data-height=\"1080\"")
    print(f"       data-variable-values='{j}'></div>")
    print("</div>")
