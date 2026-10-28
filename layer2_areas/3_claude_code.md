# 💻 Layer 2 · Area 3: Claude Code (20%)

📍 **Map:** Whole picture → **3. Claude Code** = *the workshop where programmers use the worker*

---

## In one sentence

> Set up Claude Code so a **whole team** gets the same behavior, and so it can run **on a server with nobody watching**.

## The key sorting skill: NOTE or LOCK?

```
 NOTES (Claude reads, usually obeys)     LOCKS (impossible to break)
 ─────────────────────────────────       ───────────────────────────
 CLAUDE.md                                hooks
 .claude/rules/                           permissions.deny
 skills                                   managed settings
```

Most questions in this area ask: *is this a note or a lock?*

## The 6 pieces (each one = a Layer 3 card)

| # | Piece | One line |
|---|---|---|
| 3.1 | CLAUDE.md | Team rules go in the project file. Files add up; none overrides. |
| 3.2 | Commands & skills | Team commands in `.claude/commands/`. Skills load when used. |
| 3.3 | Path rules | Instructions that load only for matching files. |
| 3.4 | Plan mode | Big or unclear change → plan first. Typo → just do it. |
| 3.5 | Refining | Give Claude a test it can run. |
| 3.6 | CI/CD | `-p` + JSON output + explicit permissions. |

## The trap in this area

❌ "Write 'never read the secrets file' in CLAUDE.md."
✅ "Use a permission deny rule or a hook."

---

➡️ Details: `layer3_details/D3_claude_code/`  ·  Next area: `4_reliable_answers.md`
