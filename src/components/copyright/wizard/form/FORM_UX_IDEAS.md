# Copyright Form UX Ideas

The create copyright form (`CustomCopyrightForm.jsx`) is a long single-scroll page with three major sections: intro text (~10 paragraphs), clauses (checkboxes + selects), token search (search/add/remove tokens), and a generated agreement preview at the bottom. These ideas aim to make it less overwhelming.

## 1. Wizard / stepper within the form

Break the single scroll into 3-4 collapsible or stepped sub-sections:

- **Step A: Select your clauses** (checkboxes + exclusive rights + expiration)
- **Step B: Add your works** (token search + token list)
- **Step C: Review generated agreement** (live-generated text)

Each step could be an accordion panel or a mini-stepper with "Next" buttons. The intro/explainer text becomes a dismissible banner or a "Learn more" expandable block instead of 8 paragraphs at the top. The user sees one focused task at a time rather than a wall of text.

## 2. Live sidebar summary

As the user toggles clauses, show a sticky sidebar (or a floating card on mobile) that summarizes their current selections in plain language — "You're allowing reproduction and broadcast, requiring attribution, no expiration." This gives instant feedback without scrolling to the bottom to read the generated legal text.

## 3. Presets / templates

Offer 3-4 common starting points at the top:

- **"All Rights Reserved"** — everything off
- **"Open Use"** — reproduce, broadcast, display, derivatives all on
- **"Display Only"** — public display on, everything else off
- **"Custom"** — start from scratch (current behavior)

Picking a preset pre-fills the checkboxes, and the user can tweak from there. This eliminates decision fatigue for the most common cases and gets people to the token search step faster.

## 4. Collapse the intro text

The ~10 paragraphs of explanation before the first checkbox are important but only need to be read once. Options:

- A short 2-sentence summary with a "Read full details" expandable
- Move it to a dedicated "How it works" page linked from the form
- Show it only on first visit (localStorage flag)

## 5. Progress indicator

A small progress bar or step counter at the top showing "Clauses > Works > Review" so the user knows where they are and how much is left. The existing tab bar (Edit / Preview / Create) handles the macro flow, but within the Edit tab there's no sense of progress.

## Recommended starting point

Start with **(4) collapse the intro** + **(3) presets** — those two changes alone would dramatically reduce the initial overwhelm. Then consider **(1) accordion sections** if it still feels too long. The presets especially would make it feel more approachable — most artists just want one of a handful of configurations.
