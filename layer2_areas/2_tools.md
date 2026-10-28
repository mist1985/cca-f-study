# 🧰 Layer 2 · Area 2: Tools & MCP (18%)

📍 **Map:** Whole picture → **2. Tools** = *the worker's equipment*

---

## In one sentence

> Claude picks a tool **only by reading its description**. Good tools = clear descriptions, few distinct tools, useful error messages, and only the tools each agent needs.

## Picture it

A new employee faces a wall of 40 buttons labelled "process", "handle", "analyze". They'll press the wrong one. **Clear labels fix that.**

**MCP** = a universal plug (like USB) that connects Claude to GitHub, databases, Slack…

## The 5 pieces (each one = a Layer 3 card)

| # | Piece | One line |
|---|---|---|
| 2.1 | Descriptions | 3–4+ sentences: what, when, when not, limits. |
| 2.2 | Errors | Say what broke and whether a retry helps. Empty ≠ error. |
| 2.3 | Who gets which tools | 4–5 tools per agent, not 18. `auto` / `any` / forced. |
| 2.4 | MCP for a team | Shared file `.mcp.json`, passwords as `${VARS}`. |
| 2.5 | Built-in tools | Grep = inside files. Glob = file names. Edit fails → Read + Write. |

## The trap in this area

❌ "Claude keeps picking the wrong tool, so force it."
✅ "Fix the tool's description (or merge overlapping tools)."

---

➡️ Details: `layer3_details/D2_tools/`  ·  Next area: `3_claude_code.md`
