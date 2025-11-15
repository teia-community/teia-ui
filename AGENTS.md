# AGENTS.md

## 1. Project Overview

Teia UI is the React frontend application for the community-owned Tezos NFT marketplace, teia.art, built using Vite, React (mixed JS/TSX), SCSS Modules, and Taquito for blockchain interaction.

**Primary Stack:** React, Vite, SCSS (Modules), TypeScript/JavaScript, Zustand.

## 2. Dev Environment

Use Node.js v18+. Environment variables are loaded from `.env`.

| Action | Command | Notes |
| :--- | :--- | :--- |
| **Setup Dependencies** | `npm ci` | Uses `package-lock.json` for deterministic installs. |
| **Run Dev Server** | `npm start` | Runs Vite development server (usually on `http://localhost:3000`). |
| **Build for Production** | `npm run build` | Outputs compiled assets to the `./build` directory. |
| **Setup via Docker** | `docker-compose up -d` | Starts the UI and the `tzproxy` service. |

## 3. Testing & Linting

Ensure all tests pass and code is correctly formatted before submitting a Pull Request. Pre-commit hooks are enforced via Husky.

| Action | Command | Purpose |
| :--- | :--- | :--- |
| **Run Linter (ESLint)** | `npm run lint` | Checks JavaScript and JSX source files for code quality. |
| **Format Code (Prettier)** | `npm run format` | Automatically reformats JS/JSX/SCSS files. |
| **Run Tests (Unit/Misc)** | `npm test` | Executes standard testing scripts (currently mapped to `vite test`). |
| **Run E2E Screenshots** | `npm run screenshots` | Executes Playwright tests for UI screenshot comparison. |

## 4. Key Project Structure

The codebase adheres to a modified Atomic Design structure heavily utilizing directory aliases defined in `tsconfig.json`.

| Directory | Purpose | Critical Notes |
| :--- | :--- | :--- |
| `src/atoms/` | Pure, functional, context-free components (UI primitives). | **Must not** use context or side effects (useEffect). Use padding, not margin. |
| `src/components/` | Complex or stateful UI components. | Used to assemble atoms and contain business logic/context. |
| `src/pages/` | Top-level components representing application routes/views. | Should utilize `<Page>` and `<Container>` layout atoms. |
| `src/context/` | State management using Zustand stores and React Contexts. | |
| `src/data/` | API interaction functions (`api.ts`, `ipfs.ts`). | |
| `src/styles/` | Global SCSS variables, mixins, and foundational CSS. | Styling is primarily done using SCSS Modules (`*.module.scss`). |
| `tests/` | Playwright E2E and screenshot test files. | |

## 5. Dos and Don'ts

### DOs
*   **DO** use the defined path aliases (`@atoms/`, `@components/`, `@utils/`, etc.) for all internal imports.
*   **DO** enforce strict TypeScript typing whenever working on `.tsx` files.
*   **DO** use SCSS Modules (`index.module.scss`) for component-scoped styling.
*   **DO** run `npm run format` locally before committing to maintain codebase consistency.
*   **DO** ensure new UI features/changes are covered by Playwright screenshot tests if possible.

### DON'Ts
*   **DON'T** introduce side effects (`useEffect`) or context usage within components located in `src/atoms`.
*   **DON'T** use CSS margins within `src/atoms/` components; use padding only.
*   **DON'T** commit code without running `npm run lint` successfully.
*   **DON'T** merge Pull Requests without verifying the automated `Test build` and ensuring no unexpected UI changes via Playwright checks.
*   **DON'T** modify `package-lock.json` unless adding a new package or updating an existing package.
*   **DON'T** remove any commented code during bug fixing.
