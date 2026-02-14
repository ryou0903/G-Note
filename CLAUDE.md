# CLAUDE.md

## Project Overview

G-Note is an AI Native Knowledge Base — a personal note-taking and knowledge management PWA built with React, TypeScript, and Firebase. UI/UX design is inspired by [Obsidian](https://obsidian.md/). When developing new features or modifying existing ones, keep Obsidian's design philosophy and interaction patterns in mind as a reference.

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Framework**: React 19 with Vite 7
- **Styling**: Tailwind CSS 3 with dark mode support
- **State Management**: Jotai (atom-based)
- **Backend**: Firebase (Firestore, Authentication, Hosting)
- **Markdown**: React Markdown with remark-gfm, rehype-highlight, rehype-raw
- **Animations**: Framer Motion
- **Drag & Drop**: @dnd-kit
- **PWA**: vite-plugin-pwa with Workbox

## Commands

```bash
npm run dev        # Start dev server (0.0.0.0:5173)
npm run build      # TypeScript check + Vite production build
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

## Project Structure

```
src/
├── components/          # Shared components (AuthGuard, ui/)
├── features/            # Feature modules
│   ├── ai/gemini/       # Gemini AI service
│   ├── editor/          # Editor canvas and components
│   ├── filesystem/      # FileTree, folders, notes, context menus
│   ├── layout/          # MainLayout
│   └── storage/         # Storage utilities
├── lib/                 # Firebase initialization
├── store/               # Jotai atoms (global state)
├── types/               # TypeScript type definitions
├── utils/               # Utility functions (image processing)
├── App.tsx              # Root component
└── main.tsx             # Entry point
```

## Architecture

- **Feature-based organization**: Code is grouped by feature (ai, editor, filesystem, layout, storage), not by type.
- **Custom hooks pattern**: Business logic lives in custom React hooks (`useNotes`, `useFolders`, `useStorage`).
- **Firestore security**: Admin-only access controlled by email whitelist in `firestore.rules`.
- **Local persistence**: UI state (last note ID, expanded folders, sort type) persisted in localStorage.

## TypeScript

Strict mode is enabled with `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, and `noUncheckedSideEffectImports`. Target is ES2022.

## Linting

ESLint 9 with flat config. Extends `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`. No Prettier configured.

## Testing

No testing framework is currently configured.

## CI/CD

GitHub Actions (`.github/workflows/firebase-hosting-merge.yml`) runs on push to `main`:
1. `npm ci`
2. `npm run build` (with Firebase env vars injected)
3. Deploy to Firebase Hosting

## Environment Variables

Firebase config uses `VITE_` prefixed environment variables. Required secrets are configured in GitHub Actions for CI/CD. Do not commit `.env` files.
