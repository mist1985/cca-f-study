# ⚠️ Exam answer vs current product docs

📍 **Map:** Layer 4 · Practice → **Where the exam and today's docs disagree**  ·  ⏱ 3 min

The exam is written against the **official exam guide (v1.0, July 2026)**. Products change faster than exams.
**On exam day, always answer the way the guide does.**

| Topic | ✅ Exam answer | Today's product (don't use on the exam) |
|---|---|---|
| Tool that starts helpers | **Task** tool; `allowedTools` must include `"Task"` | Renamed **Agent** |
| Skill `allowed-tools` | **Restricts** tools during the skill | Only pre-approves; others still ask |
| `tool_choice: "any"` / forced | Valid way to guarantee a tool call | Newest models return error 400 |
| Edit fails (text not unique) | **Read + Write** | Add context or `replace_all` |
| Few-shot count | **2–4** | Docs say 3–5 |
| Team slash commands | `.claude/commands/` | Also `.claude/skills/` (both work) |
| Resume | `--resume <session-name>`, `fork_session` | Same idea, more flags |
| Check loaded memory files | `/memory` | `/context` also shows them |

## Out of scope (the guide says these WON'T be tested)
Fine-tuning · API keys/billing/auth · hosting MCP servers · model internals · embeddings/vector DBs · computer use · vision · streaming · rate limits & pricing maths · prompt caching details · tokenization.

👉 If your older HTML files go deep on these, **skip them**. Save the attention for what's tested.
