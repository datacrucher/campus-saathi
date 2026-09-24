# Campus Saathi dataset

All data here is **synthetic** — written for this prototype. No real students, staff or messages.

## 1. Labelled student queries — `student_queries.csv`

134 student problem descriptions, each labelled with the correct service, category and urgency. Used to measure how well triage routes requests.

| Column | Meaning |
|---|---|
| `id` | Q001 … Q134 |
| `text` | What the student typed, in their own words (some informal, lower-case or abbreviated) |
| `department_id` / `department` | The service that should handle it (one of the 12) |
| `category` | Triage category (matches the categories in `ml/triage.ts`) |
| `urgency` | High / Medium / Low |
| `difficulty` | `standard` = uses common words for the problem; `hard` = indirect or informal wording with few obvious keywords |

Coverage: 17 categories across all 12 departments, including NOC requests and crisis/safety cases. 114 standard, 20 hard.

## 2. Evaluation — `evaluation_results.csv`

Row-by-row output of the keyword classifier against the labels (predicted vs expected department, category, urgency, and the words it matched). Regenerate with:

```
npm run ml:evaluate
```

Latest results (keyword rules):

| Measure | Result |
|---|---|
| Department accuracy | 116 / 134 (86.6%) |
| — standard queries | 110 / 114 (96.5%) |
| — hard queries | 6 / 20 (30.0%) |
| Category accuracy | 113 / 134 (84.3%) |
| Urgency accuracy | 84 / 134 (62.7%) |
| No match at all | 12 |

What this shows: keyword rules work well when students use the expected words, but miss indirect phrasing (e.g. *"My mind goes blank every time I think about the end sems"*). That gap is what the Claude AI triage (`ml/ai-triage.ts`) is for. Urgency is the weakest measure because the rules mostly use a fixed urgency per category.

Note: the crisis-detection phrases were widened after this evaluation first ran, because Q025 (*"ending my life"*) and Q027 (*"better off without me"*) were missed. Those two rows are therefore no longer an independent test. No other rules were tuned to this dataset.

## 3. App data export

A snapshot of the live database (`data/campuscare.db`). Regenerate with `npm run ml:export`.

| File | Rows | Contents |
|---|---|---|
| `departments.csv` | 12 | Services, teams, contact details, response targets |
| `students.csv` | 24 | Sample student records |
| `staff.csv` | 24 | Staff and their departments |
| `cases.csv` | 102 | Support requests with status, priority, assignee, triage reason and resolution |
| `case_activity.csv` | 751 | Timeline entries for every case (includes staff-only internal notes, `internal = 1`) |

Passwords and login sessions are never exported. `case_activity.csv` contains internal staff notes — treat it as staff-only.
