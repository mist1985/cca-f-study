# 🧪 Practice questions (exam style)

📍 **Map:** Layer 4 · Practice  ·  ⏱ ~2 min per question, like the real exam

Written in the style of the official guide, not copied from it. Each answer points back to its card, so you can see where it fits on the map.
**Method:** answer out loud → open → if wrong, re-read that card (3 min) → move on.

---

**Q1 · Customer support.** The agent sometimes refunds over $500 without approval. The system prompt already forbids it. Best fix?
A) Repeat the rule in capital letters at the top of the prompt
B) A hook that blocks refunds above $500 and sends the case to human escalation
C) Few-shot examples of refusing large refunds
D) Lower the temperature

<details><summary>Answer</summary>B. A rule that must hold every time goes in code. → card 1.5</details>

---

**Q2 · Customer support.** A customer writes: "I want to talk to a real person." The issue looks easy to solve. What should the agent do?
A) Solve it quickly first, then offer a human
B) Escalate to a human immediately
C) Ask why they want a human
D) Check sentiment, and escalate only if it's negative

<details><summary>Answer</summary>B. An explicit request means escalate immediately, with no investigating first. → card 5.2</details>

---

**Q3 · Customer support.** `get_customer` returns 3 customers named "Ana Petrova". What next?
A) Pick the one with the most recent order
B) Pick the one with the most activity
C) Ask the customer for another identifier, like email or order number
D) Escalate to a human

<details><summary>Answer</summary>C. Never guess. Ask for more identifiers. → card 5.2</details>

---

**Q4 · Multi-agent research.** The synthesis subagent writes reports without key facts that the web-search subagent found. What's most likely wrong?
A) The synthesis agent needs a bigger context window
B) The coordinator isn't putting the search results into the synthesis agent's prompt
C) Subagents should share memory
D) The search agent should send results to synthesis directly

<details><summary>Answer</summary>B. Subagents only know what's in their prompt. → card 1.3</details>

---

**Q5 · Multi-agent research.** Three subagents run one after another, and it's slow. They don't depend on each other. Fix?
A) Have the coordinator emit 3 Task calls in one response
B) Use a faster model
C) Merge all three into one subagent
D) Use the Batch API

<details><summary>Answer</summary>A. Several Task calls in one reply run in parallel. → card 1.3</details>

---

**Q6 · Multi-agent research.** Source A says the market is $2.1B (2023). Source B says $2.8B (2025). How should the report handle this?
A) Use B, because it's newer
B) Average them
C) Include both with source and date, noted as different
D) Leave the number out

<details><summary>Answer</summary>C. Attribute both and keep the dates. The years may explain the gap. → card 5.6</details>

---

**Q7 · Claude Code.** A developer wants their own version of the team's `/review` skill without affecting teammates. Where?
A) Edit `.claude/skills/review/` in the repo
B) `~/.claude/skills/` with a **different name**
C) In their CLAUDE.md
D) In `.mcp.json`

<details><summary>Answer</summary>B. Personal variant: user scope, different name. → card 3.2</details>

---

**Q8 · Claude Code.** Terraform files need special conventions, and they only live under `terraform/`. Most maintainable?
A) A `.claude/rules/` file with `paths: ["terraform/**/*"]`
B) A section in root CLAUDE.md
C) A skill the developer runs each time
D) Paste the conventions into every prompt

<details><summary>Answer</summary>A. A path-scoped rule loads automatically when matching files are edited. → card 3.3</details>

---

**Q9 · CI/CD.** After a developer pushes fixes, the re-review posts the same 12 comments again. Fix?
A) Turn off re-reviews
B) Include the earlier findings and ask Claude to report only new or still-unresolved issues
C) Use a larger model
D) Delete the old comments before every run

<details><summary>Answer</summary>B. → card 3.6</details>

---

**Q10 · CI/CD.** The test generator keeps suggesting tests that already exist. Best two fixes? *(choose 2)*
A) Give it the existing test files in context
B) Document testing standards and the available fixtures in CLAUDE.md
C) Raise the temperature
D) Run it through the Batch API
E) Tell it "don't duplicate tests"

<details><summary>Answer</summary>A and B. E is vague, and Claude can't avoid duplicates it can't see. → card 3.6</details>

---

**Q11 · Data extraction.** Some invoices have no PO number, and the model invents one. Best schema fix?
A) Make `po_number` required
B) Make `po_number` nullable / optional
C) Retry until it's found
D) Add "do not invent" to the prompt

<details><summary>Answer</summary>B. Required fields push Claude to make values up. → card 4.3</details>

---

**Q12 · Data extraction.** Extracted line items don't add up to the stated total. The JSON is valid. Best design?
A) Trust it, because the schema passed
B) Extract `calculated_total` and `stated_total`, flag `conflict_detected`, and retry with the specific error when it's an extraction mistake
C) Switch to few-shot instead of a schema
D) Drop the total field

<details><summary>Answer</summary>B. A schema means shape, not truth. Validate the meaning yourself. → cards 4.3 + 4.4</details>

---

**Q13 · Data extraction.** You must return results within 30 hours, and batch processing can take up to 24 hours. How often do you submit batches?
A) Once a day
B) Every 4 hours
C) Every 12 hours
D) Batching can't meet any SLA

<details><summary>Answer</summary>B. Up to 4 h waiting + 24 h processing = 28 h ≤ 30 h. → card 4.5</details>

---

**Q14 · Data extraction.** Accuracy is 97% overall. Leadership wants to remove human review. First step?
A) Remove it, since 97% is great
B) Measure accuracy by document type and field on a labeled set
C) Keep review only for low-confidence items
D) Ask the model how confident it is overall

<details><summary>Answer</summary>B. → card 5.5</details>

---

**Q15 · Developer productivity.** The agent uses built-in Grep instead of your more capable MCP code-search tool. Fix?
A) Remove Grep
B) Improve the MCP tool's description: its capabilities and outputs
C) Force the MCP tool with `tool_choice`
D) Add "prefer MCP" to CLAUDE.md

<details><summary>Answer</summary>B. Fix the cause: the description. → card 2.4</details>

---

**Q16 · Developer productivity.** A long codebase exploration starts giving vague "typical pattern" answers. Best two? *(choose 2)*
A) Keep a scratchpad file of key findings and refer back to it
B) Give specific questions to subagents (e.g. "trace the refund flow")
C) Start over and re-read every file
D) Switch to a model with a bigger window

<details><summary>Answer</summary>A and B. → card 5.4</details>

---

### Score yourself
14–16 ✅ ready for this layer · 11–13 re-read the cards you missed · ≤10 go back to Layer 2 first.
