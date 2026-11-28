# Community Projects

Projects is a read-only, repository-maintained directory at `/projects`. Add verified initiatives to `src/data/projects/projects.json` through a pull request. The initial catalogue is intentionally empty; sample content belongs only in tests. No wallet, contract, new service or Calendar write operation is required.

Each record has a unique, stable, lowercase hyphenated `slug`, a `title`, `summary`, plain-text `description`, `status` (`planning`, `active`, or `completed`), an `initiator` (`name`, optional `url`), and arrays for `contributors`, `needs`, `updates`, `events`, and `links`. Contributor objects use the same fields as the initiator. Needs contain `title`, `description`, `open` (boolean), and a contact/discussion `url`. Updates contain `date` (`YYYY-MM-DD`), `title`, and plain-text `body`. Events contain `title` and an existing `/calendar/event/<slug>` URL. Links contain `label` and `url`; use descriptive labels such as `DAO proposal`, `GitHub repository`, or the external resource title.

Active includes planning and in-progress projects. Open Calls is a subset of active projects with at least one open need. Completed projects never appear in Open Calls, even if a need was not closed when the project finished. The selected view is stored in the URL so refresh, back navigation and sharing work. Updates appear newest first. Unknown project URLs show a recovery link.

Use site-relative paths or HTTPS URLs. Confirm permission to list people and verify links, project status and calls with the initiator before publication. Updating the catalogue follows the normal repository review and deployment process. This first version does not provide project submission, editing, authentication or independent moderation in the browser. Calendar remains the event source and Collaborations remains the artwork creation feature.

Validation: run `npm run lint`, `npm run build`, `npm run test:ics`, and `npx playwright test tests/projects.spec.ts --project=chromium`. The Projects browser tests intercept the catalogue with synthetic fixtures, so example initiatives are never included in production.
