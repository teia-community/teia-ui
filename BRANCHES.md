# Proposed Branches (corrected)

> **Base corrected to `upstream/main`** (production), not the stale `origin/main`.
> Against the right base the true delta is **107 files / ~9.5k insertions across 77 commits** —
> most of what looked "new" (messaging, channels, DMs, poll/token comments, bakers,
> notifications, mentions, token-embed, bluesky) is **already live on `upstream/main`** and
> needs no extraction. Full detail in [BRANCH_SPLIT_PLAN.md](./BRANCH_SPLIT_PLAN.md).

Stacked, dependency-ordered. Merge top-to-bottom. `wiki-feature` stays as the Wiki PR.

| # | Branch | Off (parent) | Genuinely-new feature | Depends on |
|---|---|---|---|---|
| 1 | `feat/roles` | `upstream/main` | `data/roles.ts` role resolver + `OfficialPosts` moderator-as-multisig | — (foundational) |
| 2 | `feat/activity` | `feat/roles` | Activity feeds: `components/activity`, `utils/activity.js`, `use-activity-filter.js`, global `/activity` feed, profile Activity tab, `useSocialActivity` (Social toggle) | roles; live messaging/comments |
| 3 | `feat/dao-tabs` | `feat/roles` | DAO **Fees** + **Moderators** tabs (`dao/tabs/Fees.jsx`, `components/moderators`) | roles |
| 4 | `feat/admin` | `feat/roles` | Moderation console (`pages/admin`, `messaging/admin.ts`, `data/moderators.ts`) **+ folded-in** moderation actions added to live `poll/token-comments-actions.ts` & channel actions | roles; live comments/channels |
| 5 | `feat/stats` | `feat/admin` | DAO stats page (`pages/stats`, `messaging/stats.ts`, `recharts`) | admin |
| 6 | `wiki-feature` | `upstream/main` (after sync) | **Wiki** — `pages/wiki`, `data/wiki`, `components/wiki`, `utils/diff.js` | roles; live messaging ipfs |
| — | `fix/notifications` *(optional)* | `upstream/main` | Notification fixes on already-live `pages/notifications` (back-nav, mark-all-read, square thumbs) — no new-feature branch owns these | — |

**Merge sequence:** 1 → (2, 3 any order) → 4 → 5 → 6. `fix/notifications` independent.

**Not branches (already live on `upstream/main`):**
messaging / channels / DMs · poll-comments · token-comments · bakers · notifications ·
mentions · token-embed · **bluesky** (PR #512, byte-identical — not ours).

**Notes**
- Decision: edits `wiki-feature` made to already-live files are **folded into the relevant
  new-feature branch** (e.g. comment-moderation actions → `feat/admin`).
- `notifications/index.jsx` differs from upstream but no new-feature branch owns it → the
  optional `fix/notifications` PR is the exception to the fold-in rule.
- Sync of `wiki-feature` to `upstream/main` (the 6 missing commits #528–#532) is **deferred —
  analysis only for now**. Overlap with upstream #529 is low-risk (sale filters vs activity
  filters; only `index.jsx` + `profile/index.jsx` touch the same lines).
