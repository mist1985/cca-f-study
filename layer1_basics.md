# 🔧 Layer 1 · How it works (the basics)

📍 **Map:** Whole picture → **How the parts talk to each other**  ·  ⏱ 7 min

You don't need to be a programmer for this exam. You need to **recognize** a few shapes. This page shows each one once.

---

## 1. Your program talks to Claude by sending messages

> Claude **remembers nothing** between calls. Your program sends the **whole conversation** every time.

```json
{
  "model": "claude-...",
  "system": "You are Brewly's support agent.",
  "messages": [
    {"role": "user", "content": "Where is my order 4821?"}
  ]
}
```
- `system` = standing instructions (the **system prompt**).
- `messages` = the conversation, oldest first.
- `"role": "user"` = your side. `"role": "assistant"` = Claude.

---

## 2. You give Claude tools (Claude can only *ask* to use them)

```json
{
  "name": "lookup_order",
  "description": "Looks up one order by its ID (format ORD-12345). Use for status, items, delivery date. Does NOT return payment info; use get_payments for that.",
  "input_schema": {
    "type": "object",
    "properties": { "order_id": {"type": "string"} },
    "required": ["order_id"]
  }
}
```
- `description` = what Claude reads to decide **whether** to use it (→ card 2.1).
- `input_schema` = a **JSON schema**: which inputs, what type, which are required.

---

## 3. Claude asks for a tool → your code runs it → you send the result back

Claude replies:
```json
{"stop_reason": "tool_use",
 "content": [{"type": "tool_use", "id": "toolu_01", "name": "lookup_order",
              "input": {"order_id": "ORD-4821"}}]}
```
Your program runs the real lookup and answers:
```json
{"role": "user",
 "content": [{"type": "tool_result", "tool_use_id": "toolu_01",
              "content": "Shipped yesterday, arrives Friday."}]}
```
- `stop_reason: "tool_use"` = "I'm waiting for a tool answer".
- `tool_use_id` = matches the request's `id`.
- When Claude is finished: `stop_reason: "end_turn"`.

**That back-and-forth, repeated, is the agent loop** (→ card 1.1).

---

## 4. The 4 products the exam is about

| Product | What it is | Where you meet it |
|---|---|---|
| **Claude API** | Send messages, get replies (above) | Areas 1, 4 |
| **Claude Agent SDK** | A toolkit that runs the loop for you, plus helpers (subagents) and hooks | Area 1 |
| **MCP** | A standard "plug" that gives Claude tools from other systems | Area 2 |
| **Claude Code** | Claude working inside a code project: reads/edits files, runs commands | Area 3 |

---

## 5. Where things live in a Claude Code project

```
my-project/
├── CLAUDE.md                ← team instructions (always loaded)
├── .mcp.json                ← team MCP servers
└── .claude/
    ├── rules/testing.md     ← loads only for matching files
    ├── commands/review.md   ← team slash command /review
    └── skills/deploy/SKILL.md ← on-demand skill /deploy

~/.claude/CLAUDE.md          ← only YOU (never shared)
~/.claude.json               ← your personal MCP servers
```
**Rule of thumb:** inside the project folder = shared with the team via git. `~/` = only you.

---

## 6. The one idea again
| 🧠 Claude | 🔒 Code | 🙋 Humans |
|---|---|---|
| thinks, chooses, writes | enforces rules that must never break | handles exceptions |

✅ **Done when** you can explain sections 1–3 to an imaginary friend.

➡️ Next: `layer2_areas/1_agents.md`
