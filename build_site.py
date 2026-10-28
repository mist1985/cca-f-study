#!/usr/bin/env python3
"""Build docs/ (a GitHub Pages site) from the Markdown study files.

Run from anywhere:  python3 build_site.py
Re-run after editing any .md file, site_assets/site.css or site_assets/site.js.
"""
import html
import json
import os
import re
import shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "docs")
ASSETS = os.path.join(ROOT, "site_assets")
SITE_TITLE = "CCAF guide by Mihajlo Stojanovski"
OFFICIAL_URL = "https://anthropic.skilljar.com/claude-certified-architect-foundations-access-request"

# id, name, emoji, colour, exam weight
AREAS = [
    ("L1", "The whole picture", "🗺️", "#fb923c", None),
    ("D1", "Agents", "🤖", "#a78bfa", 27),
    ("D2", "Tools & MCP", "🧰", "#22d3ee", 18),
    ("D3", "Claude Code", "💻", "#4ade80", 20),
    ("D4", "Reliable answers", "🎯", "#fbbf24", 20),
    ("D5", "Over time", "⏳", "#f472b6", 15),
    ("L4", "Practice", "🧪", "#fb7185", None),
]
AREA = {a[0]: a for a in AREAS}

# Reading order = prev/next order.
ORDER = ["layer1_THE_WHOLE_PICTURE.md"]
ORDER += sorted("layer2_areas/" + f for f in os.listdir(os.path.join(ROOT, "layer2_areas")) if f.endswith(".md"))
for d in sorted(os.listdir(os.path.join(ROOT, "layer3_details"))):
    p = os.path.join(ROOT, "layer3_details", d)
    if os.path.isdir(p):
        ORDER += sorted(f"layer3_details/{d}/{f}" for f in os.listdir(p) if f.endswith(".md"))
ORDER += sorted("layer4_practice/" + f for f in os.listdir(os.path.join(ROOT, "layer4_practice")) if f.endswith(".md"))


def area_of(rel):
    if rel.startswith("layer1"):
        return "L1"
    if rel.startswith("layer4"):
        return "L4"
    m = re.match(r"layer2_areas/(\d)_", rel) or re.match(r"layer3_details/D(\d)_", rel)
    return f"D{m.group(1)}"


def kind_of(rel):
    return {"layer1": "big picture", "layer2": "overview", "layer3": "card", "layer4": "practice"}[rel[:6]]


def to_html_path(md_rel):
    return md_rel[:-3] + ".html"


def rel_link(from_rel, to_rel):
    return os.path.relpath(to_rel, os.path.dirname(from_rel) or ".")


def read(rel):
    return open(os.path.join(ROOT, rel), encoding="utf-8").read()


# ---------- inline ----------

def inline(text, cur):
    codes = []

    def stash_code(m):
        raw = m.group(1)
        link = resolve_ref(raw, cur)
        codes.append(f'<a href="{link}"><code>{html.escape(raw)}</code></a>' if link
                     else f"<code>{html.escape(raw)}</code>")
        return f"\x00{len(codes) - 1}\x00"

    text = re.sub(r"`([^`]+)`", stash_code, text)
    text = html.escape(text, quote=False)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", text)
    return re.sub(r"\x00(\d+)\x00", lambda m: codes[int(m.group(1))], text)


def resolve_ref(raw, cur):
    """Turn `file.md` / `folder/` references into links when they point at a real page."""
    if not (raw.endswith(".md") or raw.endswith("/")):
        return None
    base = os.path.dirname(cur)
    for c in [os.path.normpath(os.path.join(base, raw)), os.path.normpath(raw)]:
        if c.endswith(".md") and c in ORDER:
            return rel_link(cur, to_html_path(c))
        if c.endswith("/") or os.path.isdir(os.path.join(ROOT, c)):
            first = next((o for o in ORDER if o.startswith(c.rstrip("/") + "/")), None)
            if first:
                return rel_link(cur, to_html_path(first))
    return None


# ---------- blocks ----------

def render(md, cur):
    lines = md.split("\n")
    out, i = [], 0
    while i < len(lines):
        line = lines[i]
        s = line.strip()

        if not s:
            i += 1
            continue

        if s.startswith("```"):
            i += 1
            buf = []
            while i < len(lines) and not lines[i].strip().startswith("```"):
                buf.append(lines[i])
                i += 1
            i += 1
            out.append("<pre><code>" + html.escape("\n".join(buf)) + "</code></pre>")
            continue

        m = re.match(r"<details><summary>(.*?)</summary>(.*)</details>$", s)
        if m:
            out.append(f"<details class=\"{details_class(m.group(1))}\"><summary>{inline(m.group(1), cur)}</summary>"
                       f"<div class=\"ans\">{inline(m.group(2), cur)}</div></details>")
            i += 1
            continue
        m = re.match(r"<details><summary>(.*?)</summary>$", s)
        if m:
            out.append(f"<details class=\"{details_class(m.group(1))}\"><summary>{inline(m.group(1), cur)}</summary>"
                       "<div class=\"ans\">")
            i += 1
            continue
        if s == "</details>":
            out.append("</div></details>")
            i += 1
            continue

        m = re.match(r"(#{1,4}) (.*)", s)
        if m:
            n = len(m.group(1))
            h = m.group(2)
            num = re.match(r"(\d\.\d) · (.*)", h)
            if n == 1 and num:
                out.append(f'<h1><span class="num">{num.group(1)}</span> {inline(num.group(2), cur)}</h1>')
            else:
                out.append(f"<h{n}>{inline(h, cur)}</h{n}>")
            i += 1
            continue

        if re.fullmatch(r"-{3,}", s):
            out.append("<hr>")
            i += 1
            continue

        if s.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append(lines[i].strip())
                i += 1
            out.append(table(rows, cur))
            continue

        if s.startswith(">"):
            buf = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                buf.append(lines[i].strip()[1:].strip())
                i += 1
            out.append('<blockquote class="rule">' + "<br>".join(inline(b, cur) for b in buf) + "</blockquote>")
            continue

        if re.match(r"\s*(- |\d+\. )", line):
            buf = []
            while i < len(lines) and re.match(r"\s*(- |\d+\. )|\s{2,}\S", lines[i]):
                buf.append(lines[i])
                i += 1
            out.append(listing(buf, cur))
            continue

        buf = []
        while i < len(lines) and lines[i].strip() and not re.match(
                r"\s*(```|#{1,4} |\||>|- |\d+\. |<details>|</details>|-{3,}$)", lines[i]):
            buf.append(lines[i].strip())
            i += 1
        if not buf:
            buf.append(s)
            i += 1
        cls = ""
        if buf[0].startswith("📍"):
            cls = ' class="crumb"'
        elif buf[0].startswith(("➡️", "🎉")):
            cls = ' class="nextline"'
        elif buf[0].startswith("❌") and len(buf) > 1 and buf[1].startswith("✅"):
            cls = ' class="vs"'
        out.append(f"<p{cls}>" + "<br>".join(inline(b, cur) for b in buf) + "</p>")
    return "\n".join(out)


def details_class(summary):
    if summary.startswith("🧠"):
        return "quiz"
    if summary.startswith(("🔬", "⚠️ Real", "🔬 Real")) or "Real-world" in summary:
        return "bonus"
    if summary.startswith("Answer"):
        return "answer"
    return ""


def split_row(r):
    return [c.strip() for c in re.split(r"(?<!\\)\|", r.strip().strip("|"))]


def table(rows, cur):
    head = split_row(rows[0])
    body = [split_row(r) for r in rows[1:] if not re.fullmatch(r"\|[\s:|-]+\|", r)]
    cls = ' class="traps"' if head and head[0].startswith("❌") else ""
    h = "".join(f"<th>{inline(c, cur)}</th>" for c in head)
    b = "".join("<tr>" + "".join(f"<td>{inline(c, cur)}</td>" for c in r) + "</tr>" for r in body)
    return f'<div class="tw"><table{cls}><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table></div>'


def listing(buf, cur):
    items = []
    for l in buf:
        m = re.match(r"(\s*)(- |\d+\. )(.*)", l)
        if m:
            items.append([len(m.group(1)) // 2, m.group(2).strip() != "-", m.group(3)])
        elif items:
            items[-1][2] += "\x01" + l.strip()
    out, stack = [], []
    for lvl, ordered, text in items:
        tag = "ol" if ordered else "ul"
        while len(stack) > lvl + 1:
            out.append(f"</li></{stack.pop()}>")
        if len(stack) == lvl + 1:
            out.append("</li>")
        while len(stack) < lvl + 1:
            stack.append(tag)
            out.append(f"<{tag}>")
        out.append("<li>" + inline(text, cur).replace("\x01", "<br>"))
    while stack:
        out.append(f"</li></{stack.pop()}>")
    return "".join(out)


# ---------- page data ----------

def title_of(md):
    m = re.search(r"^# (.*)", md, re.M)
    return re.sub(r"[*`]", "", m.group(1) if m else "Study").strip()


def short_of(title):
    m = re.match(r"(\d\.\d) · (.*)", title)
    if m:
        return m.group(1), m.group(2)
    t = re.sub(r"^\W+\s*", "", title)  # drop leading emoji
    t = re.sub(r"^Layer \d · (Area \d: )?", "", t)
    return "", t


def minutes_of(md):
    m = re.search(r"⏱\s*~?(\d+)", md)
    return int(m.group(1)) if m else 5


PAGES = []
for rel in ORDER:
    md = read(rel)
    t = title_of(md)
    num, short = short_of(t)
    PAGES.append({"id": rel, "href": to_html_path(rel), "title": t, "num": num, "short": short,
                  "area": area_of(rel), "kind": kind_of(rel)})


def flashcards():
    cards = []
    for p in PAGES:
        md = read(p["id"])
        for q, a in re.findall(r"<details><summary>🧠 Say it out loud: (.*?)</summary>\s*\n(.*?)\n</details>", md, re.S):
            cards.append({"q": inline(q, "x.md"), "a": render(a.strip(), "x.md"),
                          "area": p["area"], "from": p["title"], "href": p["href"], "type": "recall"})
    prac = next((p for p in PAGES if "practice_questions" in p["id"]), None)
    if prac:
        for block in read(prac["id"]).split("\n---\n"):
            m = re.search(r"<details><summary>Answer</summary>(.*?)</details>", block, re.S)
            if not m or "**Q" not in block:
                continue
            front = block[block.index("**Q"):m.start()].strip()
            ref = re.search(r"card (\d)\.\d", m.group(1))
            cards.append({"q": render(front, "x.md"), "a": "<p>" + inline(m.group(1).strip(), "x.md") + "</p>",
                          "area": f"D{ref.group(1)}" if ref else "L4", "from": "Practice question",
                          "href": prac["href"], "type": "exam"})
    return cards


# ---------- html shells ----------

FONT = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
        '<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap" rel="stylesheet">')


def shell(out_rel, title, page_id, area, body, extra_body_attrs="", scripts=""):
    root = rel_link(out_rel, ".") if os.path.dirname(out_rel) else "."
    color = AREA[area][3] if area in AREA else "#fb923c"
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0e1014">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🧠</text></svg>">
<title>{html.escape(title)} · {SITE_TITLE}</title>
<meta name="description" content="{SITE_TITLE}: a layered, ADHD-friendly study map for the Claude Certified Architect – Foundations exam.">
{FONT}
<link rel="stylesheet" href="{root}/assets/site.css">
</head>
<body data-id="{html.escape(page_id)}" data-area="{area}" style="--a:{color}" {extra_body_attrs}>
<div class="scrollbar"><i></i></div>
{body}
<div class="toast" role="status" aria-live="polite"></div>
<script>window.ROOT={json.dumps(root)};</script>
<script src="{root}/assets/data.js"></script>
{scripts}
<script src="{root}/assets/site.js"></script>
</body></html>"""


def topbar(out_rel, area, timer_min=None, label=None):
    root = rel_link(out_rel, ".") if os.path.dirname(out_rel) else "."
    a = AREA.get(area)
    pill = (f'<a class="pill" href="{root}/index.html#area-{area}">{a[2]} <span>{html.escape(label or a[1])}</span></a>'
            if a else "")
    timer = f'<button class="timer" data-min="{timer_min}" title="Focus timer (t)">⏱ <span>{timer_min}:00</span></button>' \
        if timer_min else ""
    return (f'<header class="top"><a class="homebtn" href="{root}/index.html" title="Map (m)">🗺️</a>{pill}'
            f'<div class="dots" aria-label="Pages in this area"></div>{timer}</header>')


def content_page(idx, p):
    out_rel = p["href"]
    md = read(p["id"])
    prev_l = rel_link(out_rel, PAGES[idx - 1]["href"]) if idx > 0 else ""
    next_l = rel_link(out_rel, PAGES[idx + 1]["href"]) if idx + 1 < len(PAGES) else ""
    root = rel_link(out_rel, ".")
    nav = (f'<nav class="bottom">'
           f'<a class="nb prev{" off" if not prev_l else ""}" href="{prev_l or "#"}" title="Previous (←)"><b>←</b><small>Prev</small></a>'
           f'<a class="nb" href="{root}/index.html" title="Map (m)"><b>🗺️</b><small>Map</small></a>'
           f'<button class="nb done-btn" title="Mark done (d)"><b>⬜</b><small>Done?</small></button>'
           f'<a class="nb next{" off" if not next_l else ""}" href="{next_l or "#"}" title="Next (→)"><b>→</b><small>Next</small></a>'
           f'</nav>')
    kind = f'<div class="kind">{html.escape(p["kind"])}</div>'
    body = (topbar(out_rel, p["area"], minutes_of(md)) +
            f'<main class="page kind-{p["kind"].replace(" ", "-")}">{kind}{render(md, p["id"])}</main>' + nav)
    attrs = f'data-prev="{prev_l}" data-next="{next_l}"'
    return shell(out_rel, p["title"], p["id"], p["area"], body, attrs)


def ring(cls, area, size=""):
    return (f'<svg class="ring {cls}" data-area="{area}" viewBox="0 0 36 36" aria-hidden="true">'
            '<circle class="rb" cx="18" cy="18" r="15.915"/>'
            '<circle class="rf" cx="18" cy="18" r="15.915" stroke-dasharray="0 100"/></svg>')


def chip(p):
    num = f"<b>{p['num']}</b>" if p["num"] else ""
    return (f'<a class="chip" data-id="{html.escape(p["id"])}" href="{p["href"]}">'
            f'<span class="ck"></span>{num}<span>{html.escape(p["short"])}</span></a>')


def index_page(n_cards):
    by = lambda a, k=None: [p for p in PAGES if p["area"] == a and (k is None or p["kind"] == k)]
    l1 = by("L1")[0]
    tiles = []
    for aid, name, emo, col, w in AREAS[1:6]:
        ov = by(aid, "overview")
        cards = by(aid, "card")
        tiles.append(f"""
<section class="tile" id="area-{aid}" style="--a:{col}" data-area="{aid}">
  <div class="tile-head">
    <span class="emo">{emo}</span>
    <div class="tt"><h3>{html.escape(name)}</h3><small>Area {aid[1]} · <b>{w}%</b> of the exam</small></div>
    {ring("small", aid)}
  </div>
  <div class="weight" title="{w}% of the exam"><i style="width:{w / 27 * 100:.0f}%"></i></div>
  {f'<a class="overview chip" data-id="{ov[0]["id"]}" href="{ov[0]["href"]}"><span class="ck"></span><span>👀 Overview first</span><small>5 min</small></a>' if ov else ""}
  <div class="chips">{"".join(chip(p) for p in cards)}</div>
</section>""")
    l4 = by("L4")
    how = render(read("00_HOW_TO_USE.md"), "00_HOW_TO_USE.md")
    body = f"""
<header class="top home-top"><span class="brand">🧠 CCAF guide <small>by Mihajlo Stojanovski</small></span><div class="sp"></div>
<a class="pill" href="flashcards.html">🃏 <span>Flashcards</span></a></header>
<main class="home">
  <section class="hero">
    <div class="hero-txt">
      <p class="eyebrow">CCAF guide · by Mihajlo Stojanovski</p>
      <p class="sub-eyebrow">Claude Certified Architect – Foundations</p>
      <h1>See the whole picture.<br><span>Then zoom in, one small card at a time.</span></h1>
      <div class="ctas">
        <a class="cta" id="continue" href="{l1['href']}">▶ Start with the big picture</a>
        <a class="cta ghost" href="flashcards.html">🃏 Flashcards <small>{n_cards}</small></a>
      </div>
    </div>
    <div class="hero-ring">{ring("big", "all")}<div class="hr-txt"><b id="totalTxt">0</b><small>of {len(PAGES)} done</small></div></div>
  </section>

  <ol class="journey">
    <li class="step">
      <div class="step-n">1</div>
      <div class="step-body">
        <h2>The whole picture <small>5 min</small></h2>
        <a class="tile wide" style="--a:{AREA['L1'][3]}" href="{l1['href']}" data-id="{l1['id']}">
          <span class="emo">🗺️</span><div class="tt"><h3>One page. The whole exam.</h3>
          <small>The one idea · 5 areas · 5 rules · 6 scenarios</small></div><span class="ck big"></span></a>
      </div>
    </li>
    <li class="step">
      <div class="step-n">2–3</div>
      <div class="step-body">
        <h2>The 5 areas <small>overview, then 3-min cards</small></h2>
        <p class="hint">Coloured bar = share of the exam. Ring = your progress.</p>
        <div class="tiles">{"".join(tiles)}</div>
      </div>
    </li>
    <li class="step">
      <div class="step-n">4</div>
      <div class="step-body">
        <h2>Practice <small>prove it</small></h2>
        <section class="tile" id="area-L4" style="--a:{AREA['L4'][3]}" data-area="L4">
          <div class="tile-head"><span class="emo">🧪</span><div class="tt"><h3>Practice & the plan to 90%</h3>
          <small>Exam traps · 16 questions · readiness plan</small></div>{ring("small", "L4")}</div>
          <div class="chips">{"".join(chip(p) for p in l4)}</div>
        </section>
      </div>
    </li>
  </ol>

  <section class="keys">
    <h2>Shortcuts</h2>
    <div class="keygrid">
      <span><kbd>←</kbd><kbd>→</kbd> prev / next</span><span><kbd>d</kbd> mark done</span>
      <span><kbd>m</kbd> map</span><span><kbd>t</kbd> focus timer</span>
      <span>📱 swipe left / right</span><span>🃏 <kbd>space</kbd> flip card</span>
    </div>
  </section>

  <details class="how"><summary>📖 How to use this (and the rules)</summary><div class="ans">{how}</div></details>
  <p class="foot-note"><a href="{OFFICIAL_URL}" target="_blank" rel="noopener">📄 Official exam page &amp; guide</a>
  · Made by Mihajlo Stojanovski
  · <button class="linkbtn reset">Reset progress</button></p>
</main>"""
    return shell("index.html", "Study map", "index", "L1", body, 'class="is-home"')


def flash_page(cards):
    filters = "".join(
        f'<button class="fchip" data-area="{a[0]}" style="--a:{a[3]}">{a[2]} {html.escape(a[1])}</button>'
        for a in AREAS[1:6])
    body = f"""
{topbar("flashcards.html", "", None)}
<main class="flash">
  <h1>🃏 Flashcards</h1>
  <p class="hint">Tap the card to flip it. Got it → it's gone. Again → it comes back later.</p>
  <div class="filters"><button class="fchip on" data-area="all" style="--a:#e9e7e2">All</button>{filters}</div>
  <div class="modes"><button class="mchip on" data-type="all">Everything</button>
  <button class="mchip" data-type="recall">🧠 Quick recall</button><button class="mchip" data-type="exam">📝 Exam questions</button></div>
  <div class="deckbar"><div class="deckprog"><i></i></div><span class="left"></span></div>
  <div class="stage">
    <div class="fcard" tabindex="0" aria-live="polite">
      <div class="face front"><div class="from"></div><div class="q"></div><div class="tap">tap to flip ↻</div></div>
      <div class="face back"><div class="from"></div><div class="a"></div><a class="src" href="#">Open the card →</a></div>
    </div>
    <div class="empty" hidden><div class="big">🎉</div><h2>Deck cleared!</h2><p>Every card in this set is a "got it".</p>
    <button class="cta" id="restart">🔀 Shuffle again</button></div>
  </div>
  <div class="fbtns"><button class="again">🔁 Again <kbd>←</kbd></button><button class="got">✅ Got it <kbd>→</kbd></button></div>
</main>"""
    script = f"<script>window.CARDS={json.dumps(cards, ensure_ascii=False)};</script>"
    return shell("flashcards.html", "Flashcards", "flashcards", "L4", body, 'class="is-flash"', script)


def build():
    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(os.path.join(OUT, "assets"))
    open(os.path.join(OUT, ".nojekyll"), "w").close()
    for f in ("site.css", "site.js"):
        shutil.copy(os.path.join(ASSETS, f), os.path.join(OUT, "assets", f))
    data = {"pages": PAGES, "areas": {a[0]: {"name": a[1], "emoji": a[2], "color": a[3], "weight": a[4]} for a in AREAS}}
    with open(os.path.join(OUT, "assets", "data.js"), "w", encoding="utf-8") as f:
        f.write("window.SITE=" + json.dumps(data, ensure_ascii=False) + ";")

    for idx, p in enumerate(PAGES):
        dst = os.path.join(OUT, p["href"])
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        with open(dst, "w", encoding="utf-8") as f:
            f.write(content_page(idx, p))

    cards = flashcards()
    with open(os.path.join(OUT, "flashcards.html"), "w", encoding="utf-8") as f:
        f.write(flash_page(cards))
    with open(os.path.join(OUT, "index.html"), "w", encoding="utf-8") as f:
        f.write(index_page(len(cards)))
    print(f"Built {len(PAGES)} pages + map + {len(cards)} flashcards into {OUT}")


if __name__ == "__main__":
    build()
