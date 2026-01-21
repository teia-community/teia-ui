# Megarefactor Tracking Document
branch: `ufffd-megarefactor-dec2025-rebase`  

## Overview

This branch contains a major TypeScript migration and codebase cleanup effort. The primary goal is converting the entire codebase from JavaScript/JSX to TypeScript/TSX with proper type annotations.

---

## Commits in This Branch

Listed from oldest to newest (after base commit `58814d50`):

| Commit | Description |
|--------|-------------|
| `8fc410d9` | megarefactor - use tsx and fetch |
| `a60c0aa0` | megarefactor - bulk conversion to tsx (with errors), style guide, manual chunking in vite |
| `b072320c` | megarefactor - fixing typescript errors and types in `/atoms`, `/utils`, and `/hooks` |
| `a30a7e46` | megarefactor - fixing type annotations in `/context` and `/data` - swr.js still outstanding |
| `721fafc1` | megarefactor - `/components` typescript annotations |
| `58c86d27` | megarefactor - various type annotations and type related refactors |
| `acab07cc` | install vite-plugin-static-copy to handle react-pdf, and patch package-lock after rebasing |
| `cf1b0145` | add @storybook/types |
| `2c72049b` | megarefactor - update model-viewer dep, react types |

---

## ✅ Completed Work

### TypeScript Conversion
- [x] **All source files converted to TypeScript**
- [x] `/atoms` - Types added 
- [x] `/utils` - Types added
- [x] `/hooks` - Types added
- [x] `/context` - Types added
- [x] `/data` - Types added (swr converted to .ts)
- [x] `/components` - Types added
- [x] `/pages` - Converted to TSX

### Infrastructure
- [x] `tsconfig.json` configured with path aliases
- [x] Type declaration files created:
  - [types.d.ts](file:///c:/Users/kyle/projects/teia/teia-ui/src/types.d.ts) - Core application types
  - [env.d.ts](file:///c:/Users/kyle/projects/teia/teia-ui/src/env.d.ts) - Environment types
  - [declaration.d.ts](file:///c:/Users/kyle/projects/teia/teia-ui/src/declaration.d.ts)
  - [react-pdf-vite.d.ts](file:///c:/Users/kyle/projects/teia/teia-ui/src/react-pdf-vite.d.ts)
  - [static-components.d.ts](file:///c:/Users/kyle/projects/teia/teia-ui/src/static-components.d.ts)
- [x] Storybook types added (`@storybook/types`)
- [x] vite-plugin-static-copy installed for react-pdf handling
- [x] Manual chunking configured in Vite

### Dependencies Updated
- [x] model-viewer dependency updated
- [x] React types updated

---

## ⚠️ Known Issues

### TypeScript Errors (External)
```
node_modules/react-hook-form/dist/watch.d.ts:37:30
error TS1139: Type parameter declaration expected.
```
> **Resolution**: This was caused by `typescript@4.9.5` being incompatible with `react-hook-form@7.68.0`. Upgrading TypeScript to `^5.3.0`.

---

## 🔲 Remaining Work / Review Items

### Files Needing Conversion
- [x] `src/App.test.jsx` → Convert to TSX

### Type Improvements (from TODO comments)
- [ ] [types.d.ts:47](file:///c:/Users/kyle/projects/teia/teia-ui/src/types.d.ts#L47) - Cleanup and complete types
- [ ] [types.d.ts:220](file:///c:/Users/kyle/projects/teia/teia-ui/src/types.d.ts#L220) - Use separate NFT types depending on the stage

### Dependency Issues
- [ ] Investigate `react-hook-form` type errors
- [ ] Consider updating to compatible version or adding type patches

### Pre-Merge Review Checklist
- [ ] Run full TypeScript check (`npx tsc --noEmit`)
- [ ] Run test suite (`npm test`)
- [ ] Manual testing of key user flows
- [ ] Review all `// @ts-ignore` or `any` type usages (none found in search ✅)
- [ ] Squash or organize commits for cleaner history
- [ ] Update CHANGELOG or release notes

---

## Directory Structure Summary

| Directory | Status | Notes |
|-----------|--------|-------|
| `/atoms` | ✅ Complete | 61 children, all typed |
| `/components` | ✅ Complete | 131 children, all typed |
| `/context` | ✅ Complete | 9 children, all typed |
| `/data` | ✅ Complete | 4 children, swr.ts converted |
| `/hooks` | ✅ Complete | 9 children, all typed |
| `/icons` | ✅ Complete | 109 children |
| `/pages` | ✅ Complete | 92 children, all TSX |
| `/stories` | ✅ Complete | 11 children |
| `/styles` | ✅ Complete | 13 children |
| `/utils` | ✅ Complete | 19 children, all typed |

---

## TODO Comments in Codebase

There are **32 TODO comments** throughout the codebase. Key ones related to types:

| File | Line | Note |
|------|------|------|
| [types.d.ts](file:///c:/Users/kyle/projects/teia/teia-ui/src/types.d.ts#L47) | 47 | Cleanup and complete types |
| [types.d.ts](file:///c:/Users/kyle/projects/teia/teia-ui/src/types.d.ts#L220) | 220 | Use separate NFT types |
| [localSettingsStore.ts](file:///c:/Users/kyle/projects/teia/teia-ui/src/context/localSettingsStore.ts#L76) | 76 | Replace set methods with merge pattern |
| [userStore.ts](file:///c:/Users/kyle/projects/teia/teia-ui/src/context/userStore.ts#L519) | 519 | Collab contracts not accounted |

---

## Stats

```
224 files changed, 15230 insertions(+), 15984 deletions(-)
```

Branch diff against main shows this is a significant refactor touching most of the codebase.
