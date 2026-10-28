"""One-off: insert '👀 What it looks like' + '🧩 Connects to' sections into Layer 3 cards.
Safe to re-run: skips cards that already have the section."""
import os, sys, json
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data = json.load(open(sys.argv[1], encoding="utf-8"))
for rel, block in data.items():
    p = os.path.join(ROOT, "layer3_details", rel)
    t = open(p, encoding="utf-8").read()
    if "## 👀 What it looks like" in t:
        print("skip", rel); continue
    i = t.find("\n## ⚠️")
    assert i >= 0, rel
    t = t[:i + 1] + block.strip() + "\n\n" + t[i + 1:]
    open(p, "w", encoding="utf-8").write(t)
    print("ok", rel)
