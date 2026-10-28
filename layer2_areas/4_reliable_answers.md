# 🎯 Layer 2 · Area 4: Reliable Answers (20%)

📍 **Map:** Whole picture → **4. Answers** = *the quality of the worker's output*

---

## In one sentence

> Precision comes from **structure**: exact rules, examples, forced formats, separate reviewers. Never from "be careful".

## The golden line of this area

> **A forced format guarantees the SHAPE, never the TRUTH.**
> The form can be filled in perfectly and the numbers can still be wrong.

## The 6 pieces (each one = a Layer 3 card)

| # | Piece | One line |
|---|---|---|
| 4.1 | Exact rules | List what to report and what to ignore. |
| 4.2 | Examples (few-shot) | A few varied examples, including one "missing → null". |
| 4.3 | Forced format | `strict: true` or `output_config.format`, not "reply in JSON". |
| 4.4 | Check + retry | Your code checks the content. Retry with the exact error. |
| 4.5 | Batch API | Half price, up to 24 h. Only when nobody is waiting. |
| 4.6 | Fresh reviewer | The writer can't check its own work well. |

## The trap in this area

❌ "Keep asking until Claude fills in the missing field."
✅ "If it isn't in the document, leave it empty (null) and flag it."

---

➡️ Details: `layer3_details/D4_reliable_answers/`  ·  Next area: `5_over_time.md`
