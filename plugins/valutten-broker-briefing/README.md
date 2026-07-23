# VALUTTEN Broker Briefing

A Cowork plugin that gives a mortgage broker a **weekly Monday intelligence
briefing** built from their own inbox — so the policy and rate changes that matter
don't get buried under client and deal traffic.

## What it does

Once a week it scans a broker-chosen set of senders (banks, lenders, aggregator /
Loan Market / licensee channels, industry media like Momentum Media, The Adviser and
Mortgage Business, and event organisers), keeps only the **industry signal** —
interest-rate changes, credit and lending policy changes, regulatory/government news,
lender service updates, and industry events/awards — and deliberately **excludes
client and deal-specific email** (pre-approvals, unconditional approvals, valuations,
settlements, anything about one named borrower).

The result is delivered two ways:

- an **interactive HTML digest** grouped by theme, where every item links straight
  back to the original email and to the source document/website, delivered as a
  Cowork artifact you can pin so each week updates the same place; and
- a **push notification** on Monday when the new briefing is ready.

No email is sent or drafted. Gmail is used to *read* your sources, nothing else.

## Getting started

1. **Connect Google Workspace / Gmail** in Cowork — the briefing reads email
   through that connector, so it can only run in the broker's own session with their
   account connected. It never sends or drafts anything. Connecting **Google Drive**
   too is optional but useful: the digest then also gets a real shareable URL in the
   broker's own Drive.
2. **Run first-time setup.** The first time, the plugin scans the inbox over the last
   ~60 days, discovers the real senders, groups them, and lets the broker pick which
   belong in their briefing — no need to guess a list from memory.
3. **Let it schedule itself.** It sets up a recurring Monday task (with the sender
   list baked in) plus a quarterly recalibration reminder that rescans and flags new
   or gone-quiet senders.

Ready-to-paste kickoff, scheduled-task and recalibration prompts live in the skill's
`assets/kickoff-prompt.md`.

## What's inside

- **skills/weekly-broker-briefing** — the full workflow: setup/discovery mode,
  Gmail search strategy, the signal-vs-noise classification rules
  (`references/classification.md`), the HTML digest template and source picker
  (`assets/`), delivery, and the weekly + quarterly scheduling.

## Requirements

- Claude desktop app (Cowork), with custom plugins allowed by the user's organisation.
- A connected **Google Workspace / Gmail** account (the broker's own).
- Optional: a Google Drive / file-hosting connector, which lets the briefing email
  link to a hosted copy of the HTML page; without it, the full linked digest is
  included in the email body as a fallback.

## Notes

This briefing is an **internal** tool for the broker — it is not client-facing.
It is built around Gmail / Google Workspace search; an Outlook / Microsoft 365
variant would need the search steps adapted.

---

Built for VALUTTEN subscribers. Version 0.1.0.
