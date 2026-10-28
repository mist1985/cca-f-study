# CCAF guide by Mihajlo Stojanovski

A layered, ADHD-friendly study guide for the **Claude Certified Architect – Foundations** exam.

**Read it online:** https://mist1985.github.io/cca-f-study/

## How it's built
Whole picture first, then zoom in:

| Layer | What | Time |
|---|---|---|
| 1 | One page: the whole exam | 5 min |
| 2 | 5 areas, one overview each | ~5 min each |
| 3 | 30 cards, one per official task statement (1.1 – 5.6) | ~3 min each |
| 4 | Exam vs current docs, 16 practice questions, road to 90% | — |

Plus 46 flashcards, progress tracking, a focus timer, and swipe / arrow-key navigation.

Content is checked against Anthropic's official exam guide (v1.0, July 2026). Get the guide from the
[official exam page](https://anthropic.skilljar.com/claude-certified-architect-foundations-access-request).

## Edit & rebuild
The Markdown files are the source. After editing any of them:

```sh
python3 build_site.py   # regenerates docs/
```

GitHub Pages serves the `docs/` folder.
