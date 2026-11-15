# Multi-Document Banking Intelligence Workbench

A React and TypeScript application for comparing banking documents, checking KYC and income details, and reporting discrepancies with source evidence. The backend uses Express, Multer, Knex, and PostgreSQL.

## Setup

Requires Node.js 22.13+ and Docker with Compose.

1. Run `npm install` from the project root.
2. If `.env` is missing, copy `.env.example` to `.env`.
3. Keep `API_KEY` empty to enable mock analysis. Keep `DATABASE_URL` consistent with the PostgreSQL settings.
4. Start PostgreSQL and create the tables:

```bash
npm run db:up
npm run db:migrate
```

Start the backend and frontend in separate terminals:

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

Open the frontend URL printed by Vite (usually `http://localhost:5173`). The backend runs on port 4000 by default.

## Usage

Upload up to **5 files, 5 MB each**, using PDF, DOCX, or UTF-8 TXT. Each file is validated and processed independently. Enter an instruction, then analyze the successfully uploaded documents.

Example instruction: “Verify PAN and Aadhaar details, compare declared income against salary, and highlight missing documents.”

The report includes document comparisons, financial figures, discrepancies, missing information, extracted facts, and KYC checks. Findings include document IDs, filenames, and supporting evidence. Differences are calculated in TypeScript.

Mock analysis extracts common labeled fields and PAN/Aadhaar patterns. It keeps extracted facts separate from rule-based findings. AI integration, OCR, CSV uploads, and document authenticity verification are not implemented.

Fictional test files are in `sample-documents/`. The CSV sample tests unsupported-file rejection.

## API and project layout

- `POST /api/documents`: multipart upload using the `documents` file field.
- `POST /api/analysis`: JSON body containing `documentIds` and `instruction`.
- `backend/src/`: routes, controllers, services, database repositories, migrations, and tests.
- `frontend/src/`: React components, API calls, and CSS.
- `build/` inside each application: compiled output.

Migrations create `documents`, `analysis`, and `findings` tables.

## Commands

- `npm test`: runs four backend tests with database operations mocked.
- `npm run build`: builds both applications.
- `npm run db:down`: stops PostgreSQL; the named volume preserves data.
