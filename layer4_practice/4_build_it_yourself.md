# 🛠️ Build it yourself (the 4 official exercises)

📍 **Map:** Layer 4 · Practice → **Hands-on**  ·  ⏱ ~1 hour each

The exam assumes you've **built** these things. You don't need to code: open **Claude Code** in an empty folder, paste the prompt, then ask it to explain each part. One exercise per sitting.

What you need: Claude Code, plus an Anthropic API key from console.anthropic.com for exercises 1, 3 and 4 (costs a few cents).

---

## Exercise 1 · Support agent with escalation
**Covers:** 1.1 · 1.4 · 1.5 · 2.1 · 2.2 · 5.2

```
Build a small Python support agent (Claude Agent SDK or the plain API) for a beginner.
- 4 fake tools: get_customer, lookup_order, process_refund, escalate_to_human.
  Write detailed descriptions; make get_customer and lookup_order easy to confuse
  unless the descriptions are good.
- An agentic loop that continues on stop_reason "tool_use" and stops on "end_turn".
- Structured errors: errorCategory (transient/validation/business/permission),
  isRetryable, a readable message. Make lookup_order time out 1 in 3 times.
- A hook/gate: block lookup_order and process_refund until get_customer verified the ID.
- A hook that blocks refunds over $500 and redirects to escalate_to_human.
- Test message: "Hi, I'm ana@x.com. Order 4821 never arrived AND I was charged twice."
Print every step in plain English, then explain the code piece by piece.
```
**Watch for:** the loop stops only on `end_turn` · the gate blocks no matter what Claude "wants" · the timeout is retried, the $500 refund is escalated · both concerns get handled in one combined answer.

---

## Exercise 2 · Claude Code for a team
**Covers:** 2.4 · 3.1 · 3.2 · 3.3 · 3.4

```
Set up this empty folder like a team project and explain each file to me as a beginner:
1. CLAUDE.md with 3 coding standards and how to run tests.
2. .claude/rules/api.md with paths: ["src/api/**/*"] and .claude/rules/tests.md
   with paths: ["**/*.test.*"].
3. .claude/commands/review.md: a team /review command.
4. .claude/skills/map/SKILL.md with context: fork, allowed-tools: Read, Grep, Glob,
   argument-hint: [folder].
5. .mcp.json with one server using ${GITHUB_TOKEN}, and show where a personal server
   would go (~/.claude.json).
Then show me /memory, and create a test file so I can see the test rule load.
```
**Watch for:** which files are shared (in the folder) vs personal (`~`) · the test rule only appears when a test file is touched · the forked skill returns only a summary.
**Then try:** a one-line fix (direct) vs "restructure this into 3 modules" (plan mode). Notice when the plan helps.

---

## Exercise 3 · Data extraction pipeline
**Covers:** 4.2 · 4.3 · 4.4 · 4.5 · 5.5

```
Build a Python script for a beginner that extracts invoice data:
- An extraction tool with a JSON schema: vendor (required), stated_total (required),
  po_number (nullable), category enum with "other" + category_detail and "unclear",
  line_items, calculated_total, conflict_detected.
- Force that tool with tool_choice.
- 5 fake invoices as text: one without a PO number, one whose lines don't add up,
  one with an odd layout.
- Validate in code (lines sum to total). On failure retry max 2x, sending the document,
  the failed extraction and the exact error. Never retry for a missing PO number: keep null.
- Add field-level confidence and send low-confidence fields to a "human review" list.
- Show how the same 5 requests would be sent with the Message Batches API using custom_id.
Explain each part piece by piece.
```
**Watch for:** the JSON is always valid but the totals can still be wrong · retry fixes format slips, not missing data · `custom_id` matches results.

---

## Exercise 4 · Multi-agent research
**Covers:** 1.2 · 1.3 · 5.3 · 5.6

```
Build a beginner-friendly multi-agent research demo with the Claude Agent SDK:
- A coordinator with allowedTools including "Task", and 2 subagents: web_search, synthesis.
- The coordinator passes search findings INTO the synthesis prompt
  (claim, excerpt, source, date for each finding).
- Run 2 searches in parallel (several Task calls in one coordinator response).
- Simulate a timeout in one search: return structured error context
  (failure_type, attempted, partial_results, alternatives).
- Feed two sources with different numbers and dates; the report must show both,
  attributed, and a coverage section listing gaps.
Explain the flow step by step.
```
**Watch for:** synthesis knows only what the coordinator gave it · the failure becomes a noted gap, not a crash or a fake "nothing found" · the conflicting numbers stay visible with dates.

---

✅ **Done when** you've run all 4 and can explain each "Watch for" line in your own words.
