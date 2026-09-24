# ml/ — request classification

How Campus Saathi works out which service should handle a student's problem.

| File | What it does |
|---|---|
| `triage.ts` | **Keyword classifier** (runs now). 16 categories, each a list of terms; scores each category by matched terms (crisis ×10, safety ×3), picks the highest, sets urgency, offers the next two as alternatives. Also detects known office procedures (e.g. NOC) and crisis/safety language. Used by both the web app and the server. |
| `ai-triage.ts` | **AI classifier** (optional). Sends the description to an AI model and gets back service, category, urgency, reason and tailored self-help steps as schema-checked JSON. Switches on when `ANTHROPIC_API_KEY` is set in `.env`; otherwise, or on any error, falls back to `triage.ts`. Crisis and safety rules are always enforced. |
| `dataset/` | Labelled sample queries plus a CSV export of the app's data. See `dataset/README.md`. |
| `evaluate-triage.ts` | Scores the keyword classifier against `dataset/student_queries.csv`. Run `npm run ml:evaluate`. |
| `export-dataset.ts` | Exports the live database to CSV. Run `npm run ml:export`. |
| `csv.ts` | Small CSV reader/writer used by the scripts. |

Latest keyword-classifier results on 134 labelled sample queries: department accuracy 86.6% (96.5% on everyday wording, 30% on informal wording), category 84.3%, urgency 62.7%.
