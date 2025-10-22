# Log Instruction Review

A React 18 + Vite + TypeScript application that provides a workspace for reviewing operational log instructions. The project ships with Ant Design for the UI layer, Recharts for lightweight visualisations, Zustand for state management primitives, and Zod-powered utilities for working with JSON payloads.

## Getting started

```bash
npm install
npm run dev
```

The development server boots at [http://localhost:5173](http://localhost:5173) with hot-module replacement enabled.

## Available scripts

- `npm run dev` – start the Vite development server.
- `npm run build` – type-check the project and create an optimised production build.
- `npm run lint` – run ESLint across the project source.
- `npm run format` – check source formatting with Prettier.
- `npm run format:write` – automatically format supported files with Prettier.
- `npm run preview` – serve the production build locally.

## Project structure

```
src/
├── components/        # Shared UI components (layout, summaries, primitives)
├── constants/         # Global constants such as instruction mappings
├── hooks/             # Custom React & Zustand hooks
├── pages/             # Route-level views
├── services/          # Data access and transformation utilities
├── types/             # Shared TypeScript contracts
├── utils/             # Reusable helper utilities
└── theme.ts           # Global Ant Design theme configuration
```

The base tooling is configured with ESLint and Prettier, including opinionated import ordering, path aliases under `@/`, and Ant Design theming via `ConfigProvider`.
