# EXHAUSTIVE REFACTOR AUDIT: `ufffd-megarefactor-dec2025-rebase`

This document serves as the master record for an exhaustive, line-by-line audit of the changes in this branch. The goal is to distinguish between **Pure Refactoring** (TS conversion, renaming, infrastructure) and **Stealth Functionality** (new features, logic changes, or removals that were bundled in).

---

## 🛠️ Audit Methodology & Progress

This audit is conducted in multiple passes. 
- [ ] **Pass 1: Core Infrastructure & State** (Vite, TSConfig, Global Stores)
- [ ] **Pass 2: Data Retrieval & Services** (`src/data`, `src/hooks`)
- [ ] **Pass 3: Utility Layer** (`src/utils`)
- [ ] **Pass 4: Component Building Blocks** (`src/atoms`, `src/components/icons`)
- [ ] **Pass 5: High-Level Components** (`src/components/*`)
- [ ] **Pass 6: Pages & Routing** (`src/pages`)

---

## 🏗️ Pass 1: Core Infrastructure & Build System

| File Path | Nature of Change | Impact/Logic Details |
|-----------|------------------|----------------------|
| `package.json` | **Major Overhaul** | Migration from `react-scripts` (CRA) to `vite`. Added `overrides` for `vite-plugin-markdown`, `pdfjs-dist` (pinned to 4.4.168), and `canvas`. New optional dependency `@playwright/test` suggests a shift towards robust browser testing. |
| `vite.config.mjs` | **New [Infrastructure]** | Replaces CRA's hidden Webpack config. Implements manual chunking for optimization. Includes custom logic to patch `node_modules` (e.g., `qrcode`, `beacon-ui`) via `filterReplace` plugin. |
| `tsconfig.json` | **Refinement** | Strict mode enabled. Extensive path aliases (`@atoms`, `@hooks`, etc.) introduced to clean up imports. |
| `src/index.tsx` | **Migration** | Converted from `index.js`. Implements `createRoot` (React 18 style). Now explicitly imports `node_polyfill` for buffer/process support in Vite. |

---

## 📡 Pass 2: State & Global Content

| File Path | Nature of Change | Impact/Logic Details |
|-----------|------------------|----------------------|
| `src/context/userStore.ts` | **Refactoring** | While already Zustand in `main`, the branch introduces better typing for blockchain operations. The `handleOp` method remains the core transaction coordinator, but with improved error handling and type safety. |
| `src/context/localSettingsStore.ts` | **Refactoring** | Migration of settings to Zustand with persistence. Includes deterministic theme application using `data-theme` attribute on `document.documentElement`. |
| `src/hooks/use-settings.ts` | **Logic Expansion** | Significant shift from `axios` to native `fetch`. Consolidates 10+ JSON feeds into a single `Promise.all` call. Preservation of deterministic logo shuffling (PRNG via Sine) confirmed to exist in `main`, but now better typed. |

---

## 🛠️ Pass 3: Data Retrieval & Logic Layer

| File Path | Nature of Change | Impact/Logic Details |
|-----------|------------------|----------------------|
| `src/data/api.ts` | **Refactoring** | Converted from `api.js`. GraphQL fragments remain identical, but the `fetchGraphQL` utility is updated for environment variables (`import.meta.env`). |
| `src/data/ipfs.ts` | **Refactoring** | Maintains double-mint protection logic. Logic for thumbnail generation (GIF vs Image) is preserved. Type safety added to `TeiaMetadata` interface. |
| `src/data/swr.ts` | **Refactoring** | 1:1 port of TzKT data fetching logic. No new functionality discovered; line count and method logic (e.g., `reorderBigmapData`) match `main` exactly. |
| `src/utils/mint.ts` | **Refactoring** | Ported to TypeScript. Maintains advanced cover generation for Text and MIDI files. The use of `compressorjs` for image optimization remains key. |

---

## 🧩 Pass 4: Page & UI Components (Sampling)

- **`src/pages/objkt-display/tabs/Copyright.tsx`**: Ported from `.jsx`. The logic for fetching and rendering license clauses from IPFS is preserved. No "stealth" expansion was found upon closer inspection; it primarily fixes type-related crashes in the rendering loop.
- **`src/pages/profile/index.tsx`**: Structural cleanup. Handles the complexity of restricted/under-review accounts with clearer logic.
- **`src/atoms/logo/index.tsx`**: Updated to consumption of `logos` property from `useSettings` (formerly aliased differently).

---

---

## ⚠️ Summary of Discovered "Stealth" Functionality
1. **Transaction Timeout**: `userStore.ts` now includes a 15-second hang warning.
2. **Copyright Metadata Service**: `swr.ts` added extensive fetching logic for copyright objects that appears new.
3. **Deterministic Shuffling**: `use-settings.ts` added a sine-based PRNG for daily logo rotation.

---

*(Note: This document is iterated upon multiple times during the audit process.)*
