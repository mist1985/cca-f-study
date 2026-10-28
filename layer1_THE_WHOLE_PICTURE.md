# 🗺️ Layer 1 · The Whole Picture

📍 **You are here:** the top of the map. Everything else fits inside this page.

---

## The exam in one sentence

> Can you **design** a system that uses Claude so it works **safely and reliably**?

You're the architect, not the programmer. You choose how the parts fit together.

---

## The one idea behind everything

| Who | Does what |
|---|---|
| 🧠 **Claude** | the **thinking**: understanding, writing, deciding the next step |
| 🔒 **Code** | the **enforcing**: rules that must *never* break |
| 🙋 **Humans** | the **exceptions**: unusual, risky, not covered by rules |

Claude follows instructions *almost* always. "Almost" isn't enough for money, security or private data. Rules like that go in code.

---

## The 5 areas (the whole exam)

Picture **one worker** doing a job:

```
1. AGENTS        27%   the worker, and how workers form a team
2. TOOLS         18%   the worker's equipment
3. CLAUDE CODE   20%   the workshop where programmers use the worker
4. ANSWERS       20%   the quality of the worker's output
5. OVER TIME     15%   keeping it all safe as it runs for hours
```

---

## 5 rules that answer most questions

1. **Must never break → put it in code.** Not in instructions.
2. **Exact beats vague.** "Report these 3 things" beats "be careful".
3. **Fresh eyes check the work.** Not the Claude that wrote it.
4. **Fix the cause.** Bad tool choice? Fix the tool's description.
5. **Never hide problems.** A failure must look like a failure.

---

## The exam (from the official guide, v1.0 July 2026)

60 questions · 120 min · multiple choice **and** multiple response (the question says how many to pick) · pass = **720 / 1000** (scaled) · closed book · $125

**4 scenarios**, picked at random from these 6. Every question sits inside one:

```
1. Customer support agent      → Areas 1, 2, 5
2. Code generation (Claude Code)→ Areas 3, 5
3. Multi-agent research        → Areas 1, 2, 5
4. Developer productivity      → Areas 2, 3, 1
5. Claude Code in CI/CD        → Areas 3, 4
6. Structured data extraction  → Areas 4, 5
```

Most questions offer a **soft fix** ("ask Claude nicely") and a **structural fix** ("build it so it can't go wrong"). Usually pick the structural fix.
But watch the word **"first step"**: then the *simplest fix at the root cause* wins over a big new system.

---

✅ **Done when** you can say the one idea and the 5 areas out loud without looking.

➡️ Next: `layer2_areas/1_agents.md`
