# Changelog

Brokers with **Sync automatically** on receive every release at their next refresh,
with nothing to reinstall. There is no staging step between a push to `main` and a
broker's Monday briefing, so entries here describe user-visible effect, not internals.

Scheduled tasks are the exception: a task stores the prompt it was created with. Since
0.10.0 those prompts carry configuration only, so skill changes reach existing tasks
without editing them.

## 0.10.0

- Scheduled-task prompts now carry configuration only — name, timezone, window, sender
  list. The method moved entirely into the skill, which syncs. Previously the prompt
  restated the categories, delivery rules, link formats and retries, so every release
  went stale in every existing task and required a hand edit. **This should be the last
  release that needs one.**
- Added Recalibration mode (Step 0b) so the quarterly task has a named mode to invoke.

## 0.9.1

- Setup prompt synced with the marketing site copy; it had never asked for the broker's
  name, so digests rendered `{{BROKER_NAME}}` in the header.
- Removed one aggregator's branding from four user-facing places.

## 0.9.0

- Classification regression fixtures (34 cases) and a runner.
- Microsoft 365 transport mapping, as design only — no Outlook support yet.
- Resolved the named-borrower rule: what a message **is about** decides it, not what it
  mentions. A rate sheet ending "congratulations on the Smith settlement" now keeps its
  rate and discards the client reference, instead of being thrown away whole.
- Removed advice to surface ambiguous items flagged "possibly client-specific".
  Ambiguity now resolves to DROP.

## 0.8.0

- "What this does to your book" block, shown only when a commission or clawback change
  landed, so the footer link follows from something on the page.
- Every figure and date is now checked against its source before it goes on the page;
  anything unverifiable loses the number and keeps the item.
- "Tidy up" block: a Gmail search and a filter recipe the broker applies themselves.
  Nothing is moved, labelled or archived.
- Feedback line in the colophon.

## 0.7.1

- Gmail read-only made an explicit instruction. It was the intent and the behaviour, but
  nothing forbade labelling or archiving.

## 0.7.0

- Empty sender searches now retry with `in:anywhere`. A filter auto-archiving lender
  bulletins previously produced a confident "quiet week" — a wrong briefing that looked
  like a successful run.
- Categories aligned to the template's six; a seventh had no slot and its items silently
  vanished.
- Issue number derived from the ISO week, so re-runs are idempotent.
- Delivery falls back through SendUserFile → Drive → inline text rather than ending with
  nothing.

## 0.6.0

- Version stamp on scheduled prompts, and refresh mode ("Refresh my weekly briefing
  schedule") to rebuild a stale task without redoing setup.

## 0.5.1 and earlier

Drafted-email delivery removed in favour of the artifact plus push notification; sender
discovery stopped reading client subject lines; scheduled-task permissions primed at
setup. See git history.

---

## If a release breaks briefings

Auto-sync means a bad release reaches everyone. There is no rollback button, so:

1. **Revert and push.** `git revert <sha> && node scripts/release.mjs <plugin> <prev
   version>` then push. Brokers pick the fix up on their next refresh — same path as any
   release, no action from them.
2. **Do not delete the marketplace entry.** That breaks the install for everyone rather
   than reverting it. Use `renames` in `marketplace.json` if a plugin genuinely has to
   move (CLAUDE.md §2).
3. **Check whether scheduled prompts changed.** If they did, existing tasks are still on
   the broken text and a revert alone does not reach them; brokers need to refresh their
   schedule.
4. **The digest is rebuilt each week from scratch**, so a bad release corrupts one
   Monday, not a history. There is no stored state to repair.
