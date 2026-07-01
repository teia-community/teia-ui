# `wiki-feature` Branch Split Plan (corrected)

> Goal: extract everything that is **not** the wiki into separate, sequentially-merged PRs.
> `wiki-feature` stays as the **Wiki PR**. Branches are **stacked in dependency order**.
>
> **Correction (important):** the first version of this plan diffed against `origin/main`
> (your fork), which is **62 commits behind production**. Re-based against the real
> production branch **`upstream/main`**, most of the apparent "features" are **already live**.

---

## 1. What changed in this analysis

| | First pass (wrong base) | Corrected (`upstream/main`) |
|---|---|---|
| Base | `origin/main` (stale fork) | `upstream/main` (production) |
| Delta | 195 files / ~23.7k ins / 91 commits | **107 files / ~9.5k ins / 77 commits** |
| Branches | ~15 | **~6** |
| Merge-base | `31ff0df5` | `a1b630ed` (#526, Jun 20) — upstream only **6 commits** ahead |

**Already live on `upstream/main`** (so: *not* extraction targets — they only appeared as
"new" because the fork base predates their upstream merge):
messaging / channels / DMs · poll-comments · token-comments · bakers · notifications ·
mentions · token-embed · **bluesky** (`src/utils/bsky.js` is byte-identical to upstream
PR #512 — confirmed not ours).

---

## 2. Genuinely-new code (the real targets)

New files added on `wiki-feature` since the merge-base, by area:

| Area | Files | → Branch |
|---|---|---|
| `pages/wiki` + `data/wiki` + `components/wiki` + `utils/diff.js` | ~28 | **wiki-feature** (stays) |
| `pages/admin` + `components/moderators` + `data/moderators.ts` + `data/messaging/admin.ts` | ~15 | **feat/admin** |
| `pages/stats` + `data/messaging/stats.ts` | ~11 | **feat/stats** |
| `components/activity` + `utils/activity.js` + `hooks/use-activity-filter.js` + `pages/activity` + `pages/home/feeds/*` + `data/messaging/useSocialActivity.ts` | ~14 | **feat/activity** |
| `data/roles.ts` | 1 | **feat/roles** |
| `dao/tabs/Fees.jsx` (+ Moderators tab in `components/moderators`) | ~3 | **feat/dao-tabs** |

---

## 3. Edits to already-live files — attribution (fold-in rule)

`wiki-feature` also *modified* 30 files that already exist on `upstream/main`. Per your
decision, each edit folds into the relevant new-feature branch. Attribution:

| Modified file | Edit | → Branch |
|---|---|---|
| `data/messaging/poll-comments-actions.ts`, `token-comments-actions.ts` | moderation actions (`moderateCommentHidden`, `setUserBanned`, `setPaused`) | **feat/admin** |
| `components/poll-comments/PollComments.jsx`, `token-comments/TokenComments.jsx`, `poll-comments.ts`, `token-comments.ts` | moderation/display hooks | **feat/admin** (display-only tweaks → flag per-hunk) |
| `components/channels/{ChannelSettings,ChannelView}.jsx`, `channel-actions.ts`, channels scss | Danger-Zone explainer + global ban/pause channel actions | **feat/admin** |
| `pages/dao/{Dao.jsx,tabs/index.js,tabs/index.module.scss,tabs/Parameters.jsx}` | new DAO tabs + `canModerate` gating | **feat/dao-tabs** (admin/stats tab rows ride with their branch) |
| `data/swr.js` | `USER_/GLOBAL_ACTIVITY_QUERY`, `useSWRInfinite` | **feat/activity**; `useModerators` → **feat/roles** |
| `pages/home/feeds/index.js`, `pages/profile/index.jsx` (Activity tab), `objkt-display/tabs/History.jsx` | activity wiring | **feat/activity** |
| `pages/text/OfficialPosts.jsx`, `NewPost.jsx` | moderators treated as multisig | **feat/roles** |
| `constants.ts` | `WIKI_CONTRACT`/`MODERATOR_CONTRACT` → **wiki/roles**; `QUIPUSWAP_TEIA_URL` → **feat/stats** | split |
| `package.json` / `package-lock.json` | `recharts` | **feat/stats** |
| `env.d.ts` | `VITE_WIKI_DEV_MODERATORS` | **wiki-feature** |
| `index.jsx`, `MainMenu.jsx` | routes + menu items | split per feature (append-only) |
| `pages/notifications/index.{jsx,scss}` | back-nav, mark-all-read, square thumbs | **fix/notifications** (exception — no new-feature branch owns these) |
| `pages/polls/tabs/Polls.jsx`, `profile/comments.jsx`, `utils/string.js` | minor | ride with nearest feature |

---

## 4. Branch stack & merge order

```
upstream/main
│
├── feat/roles        roles.ts + OfficialPosts moderator-as-multisig          (foundational)
│   │
│   ├── feat/activity activity feeds + global /activity + Social toggle        (on roles; live comments)
│   ├── feat/dao-tabs DAO Fees + Moderators tabs                               (on roles)
│   └── feat/admin    moderation console + folded comment/channel mod actions  (on roles; live comments)
│       └── feat/stats DAO stats page (recharts)                               (on admin)
│
├── wiki-feature  ► Wiki PR   wiki pages/data/components                       (on roles; live ipfs)
└── fix/notifications  notification fixes (optional, independent)
```

**Merge sequence:** `feat/roles` → (`feat/activity`, `feat/dao-tabs` any order) →
`feat/admin` → `feat/stats` → `wiki-feature`. `fix/notifications` independent.

---

## 5. Sync of `wiki-feature` to production (deferred — analysis only)

`wiki-feature` is missing **6 upstream commits** (do *not* apply yet, per your call):

```
6612a6fb feat: add BYOB mx TEIA event (#528)
378a6862 feat: add primary/secondary/for sale/not for sale filters (#529)
fcf0d2e7 fix: add filters to collab page as well (#530)
39dc3c75 fix: add baseurl + hash router for gh pages (#531)
e968094d fix: collabs primary/secondary seller rules (#532)
eb5bf6f9 Revert "fix: add baseurl + hash router for gh pages (#531)"
```

**Activity-filter overlap assessment (the thing to watch):** upstream **#529** adds
*sale* filters (primary/secondary/for-sale) to `profile/collections.jsx` & `creations.jsx`
and **removes the Curation tab** — a *different* feature from our activity-feed filters
(`use-activity-filter.js`, global Trades/Social feed). They only touch the same lines in
**two append-style files**: `src/index.jsx` (routes) and `src/pages/profile/index.jsx`
(profile tabs). → **Low-risk textual conflict, no logic clash.** When sync happens
(merge `upstream/main` in, per earlier choice), resolve by keeping both tab/route sets.

---

## 6. Shared-hotspot splitting guide

Six append-mostly files carry hunks for several branches — port only each branch's hunk:
- `src/index.jsx` — import group + `<Route>` block per feature (trivial keep-both conflicts).
- `src/data/swr.js` — independent hook groups (activity queries vs `useModerators`).
- `src/components/header/main_menu/MainMenu.jsx` — one `MenuItem` (+ `canModerate` gate) per feature; merge in stack order, keep badge math additive.
- `src/constants.ts` — append-only addresses/paths; near-zero conflict.
- `src/pages/dao/Dao.jsx` + `dao/tabs/index.js` — append tab rows; `canModerate` gating belongs to roles/admin.
- `src/pages/profile/index.jsx` — append Activity/Channels/Comments tab rows (also the #529 overlap point).

---

## 7. Cleanup to fold in before shipping

- **Remove the moderation test override**: `devModerateOverride` in `src/data/wiki/roles.ts`
  (`localStorage.wiki_dev_force_moderate`) + untracked `REMOVE_TESTING_OVERRIDE.md` — strip during
  `feat/roles` / `feat/admin` extraction.
- **Pre-existing bug** (consider fixing in `feat/admin`): `channels.ts useChannelList` queries tag
  `channel_hidden` but the contract emits `channel_hidden_set` → hidden channels aren't filtered.

---

## 8. Per-branch acceptance gate

Each branch, with its parents merged, must pass independently:

```
cd teia-ui
npm run lint
npm run build      # must compile against upstream/main + parent branches only
```

A build failure on a missing import = a hidden cross-feature edge → pull that import into the
correct lower branch.

---

## 9. Suggested execution order

1. **`feat/roles`** off `upstream/main` (tiny, unblocks admin + dao-tabs + activity + wiki).
2. **`feat/activity`** and **`feat/dao-tabs`** (parallel).
3. **`feat/admin`** → **`feat/stats`**.
4. **`fix/notifications`** (independent, whenever).
5. **Sync `wiki-feature`** to `upstream/main` (resolve the #529 tab/route overlap) and reduce its
   diff to wiki-only — *when you decide to proceed with the sync*.
