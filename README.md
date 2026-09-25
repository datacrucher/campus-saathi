# Campus Saathi

Student support portal prototype for Northbridge University. Students describe a problem in their own words, Campus Saathi suggests the right service, and staff work the resulting case .

## Project layout

```
campus-saathi/
├── frontend/   React + TypeScript web app (student, staff and admin portals)
│   └── src/data/   shared sample data: departments, students, staff, procedures (NOC)
├── backend/    Node + Express API: login sessions, role checks, cases, SQLite database
├── ml/         request classification: keyword model, AI model, dataset, evaluation
└── package.json  one install and one set of commands for all three
```

## Run it

```
npm install
npm run dev        # API on :3001 + web app on http://localhost:5173
npm run build      # type-check frontend and server, build into dist/
npm start          # API also serves the built app on http://localhost:3001
```

Requires Node 22.5+ (uses the built-in `node:sqlite`). The database is created and seeded at `data/campuscare.db` on first start.

## Demo access

Use the **Demo access** buttons on `/login`, or sign in with one of these addresses and the password `CampusSaathi2026`:

| Role    | Account                              | Lands on   |
|---------|--------------------------------------|------------|
| Student | a.reddy@student.northbridge.ac.uk    | `/student` |
| Staff   | sarah.mitchell@northbridge.ac.uk     | `/staff`   |
| Admin   | james.okafor@northbridge.ac.uk       | `/admin`   |

Routes are protected by role. Signed-out visitors go to `/login`; a signed-in user who opens another role's URL is sent to their own home.

## Notes

- **Backend** (`backend/`): Express + SQLite. Sessions are httpOnly cookies; passwords are scrypt-hashed. Access is enforced server-side: students see only their own cases (without internal notes), staff only their department's, admins everything. Cross-site writes are rejected.
- Admins can restore the sample data from the user menu (**Reset demo data**).
- Environment: `PORT`, `DB_PATH`, `DEMO_PASSWORD`, `DEMO_LOGIN=off` (hides the demo shortcut), `NODE_ENV=production` (secure cookies).
- **AI triage** (`ml/ai-triage.ts`): Claude reads the student's full description and returns the service, category, urgency, a plain-English reason and 3–5 self-help steps tailored to the problem, as schema-validated JSON. To turn it on, copy `.env.example` to `.env`, set `ANTHROPIC_API_KEY`, and restart. Without a key — or if the API errors, rate-limits or declines — the keyword rules in `ml/triage.ts` are used instead. Crisis and personal-safety language is always escalated to High and shows emergency contacts first, whichever path runs. Set `AI_TRIAGE=off` to force the keyword rules, or `TRIAGE_MODEL` to change the model (default `claude-opus-5`).
- Styles: design tokens and components in `frontend/src/styles.css`, page layouts in `frontend/src/pages.css`.
- Dataset and evaluation: `npm run ml:evaluate`, `npm run ml:export` (see `ml/README.md`).
