# Wedding RSVP — Jansen & Danniele

> A small React + Vite app for the Jansen / Danniele wedding RSVP.

This repository contains the client-side application used to collect RSVPs for the wedding. It's built with Vite, React (TypeScript), and TailwindCSS.

## Quick info

- Project: wedding-rsvp-jansen-danniele
- Stack: Vite, React, TypeScript, TailwindCSS
- Tested Node: Node 18+ (assumption)

## Features

- Fast development with Vite
- TypeScript support
- TailwindCSS for styling
- Google Apps Script integration for RSVP submission and invitation lookup ("Find my Invitation")

## Setup

1. Install Node.js (18 or newer recommended).
2. From the repository root install dependencies:

```powershell
npm install
```

If you prefer yarn or pnpm, use `yarn` or `pnpm install`.

## Development

Start the dev server:

```powershell
npm run dev
```

Open http://localhost:5173 in your browser (Vite's default).

## Build

Create a production build:

```powershell
npm run build
```

Preview the production build locally:

```powershell
npm run preview
```

## Linting

Run ESLint across the project:

```powershell
npm run lint
```

## Project structure

- `index.html` — app entry
- `src/` — React source files (`main.tsx`, `App.tsx`, styles)
- `public/` — static assets
- `vite.config.ts`, `tsconfig.json` — build configuration

## Assumptions & notes

- Assumed Node 18+ and npm available. If you use a different package manager, adjust commands accordingly.
- The repository is private and intended for the couple's use.

## Contributing

This project is small and maintained by the owners; if you need to make changes locally:

1. Create a feature branch
2. Make changes and run `npm run dev` to verify
3. Commit and open a PR

## License

This codebase is private; include license details here if you intend to open-source it.

---

If you'd like a more detailed README (screenshots, deploy steps, CI, backend integration notes for storing RSVPs), tell me what you'd like to include and I will expand it.

## Find my Invitation Feature

The welcome overlay includes a "Find my Invitation" search that lets a guest confirm they are on the list and see whether their RSVP was already recorded.

### How it works

1. Guest enters First Name + Last Name.
2. Client sends a `mode=lookup` request to the deployed Apps Script web app.
3. Script performs a fuzzy match on Sheet2 rows (Last Name exact, First Name exact / starts-with / initial match).
4. Response returns JSON: `{ success: true, lookup: true, matches: [{ firstName, lastName, rowIndex, marked }], count }`.
	- `marked` indicates the "Y" marker in Column D (RSVP already submitted).
5. UI lists any matches or a friendly not-found message.

### RSVP Submission (existing)

The RSVP form (section `#rsvp`) POSTs guest details to the same Apps Script endpoint (without `mode=lookup`). The script:
- Marks matched guest row(s) in Sheet2 Column D with `Y`.
- Appends the RSVP details to `Sheet1`.
- Returns `{ success: true, rowsUpdated, rowsAppended }`.

### Deploy / Update the Apps Script

1. Open Google Apps Script project containing `SHEET2_MARKER.gs`.
2. Ensure the updated code (with lookup mode) is deployed.
3. Deploy > New deployment > Web app.
	- Execute as: Me
	- Who has access: Anyone (or domain-restricted if appropriate; adjust CORS strategy accordingly)
4. Copy the deployment URL (ends with `/exec`).
5. Replace the hardcoded `url` string inside `App.tsx` (both in `performInvitationLookup` and `handleSubmit` if you change deployments) with your new endpoint.

### Spreadsheet Layout Expectations

`Sheet2`: Guest master list.
- Column A: Last Name (or combined "Last, First" depending on legacy format)
- Column B: First Name (if split)
- Column D: RSVP marker (`Y` once submitted)

`Sheet1`: RSVP submissions log.
- Columns: Name, Attendance, Guests, High chair, High chair count, Message, Timestamp

### Fuzzy Name Matching Rules

- Last name must match exactly (case-insensitive).
- First name considered a match if:
  - Exact match
  - Row first starts with entered first
  - Entered first starts with row first (nickname vs full)
  - First letter matches (fallback)

### LocalStorage Persistence

The app stores last-used RSVP form fields and lookup names in:
- `rsvp_form_v1`
- `invitation_lookup_v1`

Cleared automatically on successful RSVP submission (form fields only).

### Error & Edge Handling

- Network failures show a simple alert (RSVP) or inline error (lookup).
- Not found lookup shows user guidance to re-check spelling or contact couple.
- Multiple matches (e.g., siblings with same last name and similar first names) are all listed.

### Future Enhancements (Suggestions)

- Add debounce & onBlur auto-lookup.
- Provide invite-specific details (table assignment, codes) once available.
- Add CAPTCHA / token to mitigate automated spam.

