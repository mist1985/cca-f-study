# 📖 Glossary

📍 **Reference page.** Look a word up, then go back. No need to learn this page.

## Core
- **Claude API**: how a program sends messages to Claude and gets replies.
- **Message**: one turn. `role: "user"` = your side, `role: "assistant"` = Claude.
- **System prompt**: standing instructions sent before the conversation.
- **Prompt**: any instruction text you give Claude.
- **Token**: a small piece of text, about ¾ of a word. Size and cost are measured in tokens.
- **Context window**: everything Claude can see at once. Large but limited.
- **JSON**: a text format for structured data: `{"field": "value"}`.
- **JSON schema**: an exact description of a JSON shape: fields, types, which are required.
- **Deterministic**: always gives the same result (code). **Probabilistic**: usually does (instructions to Claude).

## Agents (Area 1)
- **Agent**: Claude working in a loop. Ask for a tool → get result → decide next step → repeat.
- **Agentic loop**: the code that repeats that cycle until `stop_reason` is `"end_turn"`.
- **stop_reason**: why Claude stopped. `"tool_use"` = wants a tool. `"end_turn"` = finished. `"max_tokens"` = ran out of space.
- **tool_use / tool_result**: Claude's tool request / your answer to it, linked by an id.
- **Claude Agent SDK**: Anthropic's toolkit for building agents. Runs the loop for you.
- **Coordinator (orchestrator)**: the lead agent that splits work and combines results.
- **Subagent**: a helper agent with its own fresh, isolated context.
- **Hub-and-spoke**: all communication goes through the coordinator.
- **Task tool**: the tool a coordinator uses to start a subagent (renamed "Agent" in newer products).
- **allowedTools**: which tools an agent may use. A coordinator needs `"Task"` in it.
- **AgentDefinition**: the setup of one subagent type: description, system prompt, tool restrictions.
- **Hook**: your code that runs automatically at a fixed point (e.g. before or after a tool). Can block or change things.
- **PostToolUse**: the hook that runs after a tool, before Claude sees the result.
- **Prerequisite gate**: code that blocks a step until an earlier step succeeded.
- **Prompt chaining**: fixed sequence of steps, each using the previous output.
- **Attention dilution**: too much in one pass → later items get shallow attention.
- **Session**: a saved conversation. **Resume** = continue it. **fork_session** = branch a copy.
- **Handoff / escalation**: passing a case to a human (or another agent).

## Tools & MCP (Area 2)
- **Tool description**: the text Claude reads to choose a tool. The #1 factor in tool choice.
- **MCP (Model Context Protocol)**: a standard way to plug tools and data into Claude.
- **MCP server**: a program that offers tools/resources. **MCP client**: Claude Code or your app.
- **MCP tool**: an action (look up, create, send). **MCP resource**: read-only content (docs, schemas, issue lists).
- **isError**: MCP flag on a tool result meaning "this is a failure".
- **Transient error**: temporary (timeout); retry may work. **Validation error**: bad input. **Business error**: policy says no. **Permission error**: not allowed.
- **isRetryable**: your flag telling Claude whether retrying makes sense.
- **tool_choice**: `auto` (Claude decides), `any` (must call some tool), `{"type":"tool","name":"x"}` (must call x).
- **Least privilege**: give each agent only the tools it needs.
- **.mcp.json**: project file (in git) listing team MCP servers. **~/.claude.json**: your personal servers.
- **Environment variable**: a value set on each computer (e.g. `GITHUB_TOKEN`). `${GITHUB_TOKEN}` in a file gets filled in from it.
- **Grep**: search inside files. **Glob**: find files by name pattern. **Read / Write / Edit / Bash**: read a file, write a whole file, change one unique piece of text, run a command.

## Claude Code (Area 3)
- **Claude Code**: Claude working in your terminal/editor inside a code project.
- **CLAUDE.md**: instructions file Claude Code always loads. User / project / directory levels.
- **@import**: pull another file into CLAUDE.md (`@docs/testing.md`).
- **/memory**: shows and edits the loaded memory (CLAUDE.md) files.
- **.claude/rules/**: topic rule files. With `paths:` they load only for matching files.
- **Glob pattern**: `*` = anything in one folder, `**` = any depth. `**/*.test.tsx` = all test files anywhere.
- **Frontmatter**: settings at the top of a file between `---` lines.
- **Slash command**: `/name`, stored in `.claude/commands/`.
- **Skill**: on-demand instructions in `.claude/skills/<name>/SKILL.md`.
- **context: fork**: run a skill in an isolated subagent, so its output doesn't fill your main chat.
- **allowed-tools**: skill setting limiting which tools it uses (exam view).
- **argument-hint**: tells the user what argument a skill expects.
- **Plan mode**: Claude explores and proposes a plan before changing anything.
- **Direct execution**: just make the change.
- **Explore subagent**: a helper that does noisy searching and returns a summary.
- **/compact**: summarize the conversation to free space and continue.
- **CI/CD**: automatic checks/deploys on a server after each code change.
- **-p / --print**: run Claude Code once without interaction (for CI).
- **--output-format json / --json-schema**: machine-readable, schema-shaped output.
- **PR (pull request)**: a proposed code change that gets reviewed before merging.

## Reliable answers (Area 4)
- **False positive**: a flagged problem that isn't real.
- **Precision**: of everything flagged, how much was real.
- **Few-shot**: putting a few worked examples in the prompt.
- **Structured output**: forcing the answer into a fixed JSON shape.
- **Nullable field**: may be `null` ("not in the document").
- **Enum**: a fixed list of allowed values. Add `"other"` + detail and `"unclear"`.
- **Syntax error**: broken JSON. **Semantic error**: valid JSON, wrong meaning (totals don't add up).
- **Pydantic**: a Python library for validating data against rules.
- **Retry with error feedback**: retry, sending the document + failed output + exact errors.
- **detected_pattern**: your field tagging which code pattern triggered a finding.
- **Message Batches API**: many requests at once. 50% cheaper, up to 24 h, no guaranteed time.
- **custom_id**: your label linking each batch result to its request.
- **SLA**: a promised maximum time.
- **Independent review instance**: a separate Claude without the writer's reasoning.
- **Extended thinking**: Claude reasoning longer before answering. Doesn't remove self-review bias.

## Over time (Area 5)
- **Progressive summarization**: repeatedly summarizing old conversation. Loses exact details.
- **Case facts block**: exact facts kept outside the summary, sent every time.
- **Lost in the middle**: long inputs: start and end are used best, the middle worst.
- **Escalation triggers**: customer asks for a human · policy gap · no progress.
- **Sentiment**: the customer's mood. Not a reliable escalation trigger.
- **Self-reported confidence**: Claude's own guess of how sure it is. Poorly calibrated.
- **Calibration**: checking confidence scores against labeled data so 90% really means 90%.
- **Labeled validation set**: examples with known correct answers, used to measure accuracy.
- **Stratified sampling**: checking random samples from every group (including high-confidence ones).
- **Access failure vs valid empty result**: "couldn't look" vs "looked, found nothing".
- **Coverage annotation**: a note in a report saying which parts are well supported and where the gaps are.
- **Scratchpad file**: a file where an agent writes findings to keep them across long sessions.
- **Manifest**: a saved state file used to resume after a crash.
- **Provenance**: where each fact came from. **Claim-source mapping**: claim + URL/document + excerpt + date.
