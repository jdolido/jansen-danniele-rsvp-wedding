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
