# 🤖 Layer 2 · Area 1: Agents (27%, the biggest)

📍 **Map:** Whole picture → **1. Agents** = *the worker, and how workers form a team*

---

## In one sentence

> An agent is Claude working **in a loop**. A team is a **lead** passing work to **helpers**. Rules that must hold live in **guards (hooks)**.

## The 3 things to understand

```
 THE LOOP          THE HUB              THE GATE
 Claude asks  →    Lead Claude          Hook = code that
 for a tool,       splits the job,      runs before/after
 your code runs    helpers do pieces,   every tool and can
 it, repeat        lead combines        BLOCK it
```

## The 7 pieces (each one = a Layer 3 card)

| # | Piece | One line |
|---|---|---|
| 1.1 | The loop | Keep going while Claude says "tool_use". Stop on "end_turn". |
| 1.2 | Lead + helpers | Hub and spoke. Everything goes through the lead. |
| 1.3 | Briefing helpers | Started with the **Task** tool. Blank memory, so tell them everything. |
| 1.4 | Unbreakable rules + handover | Locks in code. Humans get a short summary. |
| 1.5 | Hooks | Before = block. After = clean up. |
| 1.6 | Splitting a job | Known steps → fixed chain. Unknown → adaptive agent. |
| 1.7 | Sessions | `--resume` a named session, `fork_session` to compare. Stale → start fresh. |

## The trap in this area

❌ "Write the rule in Claude's instructions."
✅ "Add a hook that blocks the action."

---

➡️ Details: `layer3_details/D1_agents/`  ·  Next area: `2_tools.md`
