# Kickoff prompts

Two versions of the same prompt. The **manual** version is what Andrew pastes into
a Cowork session when he wants to run the briefing by hand. The **scheduled-task**
version is what gets baked into the recurring Monday trigger (it must be fully
self-contained because a scheduled run has no memory of any earlier chat).

Fill in every `<<...>>` placeholder before use.

---

## First-time setup version — run this ONCE to build the sender list

Andrew pastes this the first time (with his Loan Market Google Workspace connected)
so the skill discovers his real senders instead of him guessing them.

```
Set up my weekly industry briefing — this is my first run, so calibrate it against
my inbox before configuring anything.

Scan my Google Workspace inbox over the last 60 days and discover every sender that
emails me, grouped by type: lenders/banks, my aggregator/Loan Market/licensee
channels, industry media (Momentum Media, The Adviser, Mortgage Business, etc.),
and event/awards organisers. Separate out the senders that are mostly
client/deal-specific (approvals, valuations, settlements) or marketing/personal, and
recommend excluding those.

Show me the grouped list with a couple of example subject lines each and your
recommended include/exclude, and let me pick which sources belong in my weekly
briefing. Once I've chosen, save that as my sender list, run a first briefing over
the last 7 days, and set up the recurring Monday schedule with the list baked in.

My email is <<andrew's email>> and my timezone is <<e.g. Australia/Brisbane>>.
```

---

## Manual version — paste into Cowork any time

```
Run my weekly industry briefing.

Scan my Google Workspace inbox from the last 7 days and build my Monday policy &
industry digest. Only keep industry/policy signal — rate changes, credit & lending
policy changes, regulatory/government news, lender service/process updates,
aggregator/licensee updates, industry media, and events/awards. DROP all
client-specific and deal-specific email: pre-approvals, conditional and
unconditional approvals, application status, valuations, settlements, and anything
about one named borrower or application.

Senders to scan (also do a topic search for anything relevant I might have missed):
<<paste sender addresses / domains here, e.g.
cba.com.au, nab.com.au, anz.com.au, westpac.com.au, macquarie.com,
your-aggregator.com.au, news.themortgagebusiness.com.au, theadviser.com.au>>

Deliver:
1. An interactive HTML digest grouped by category, where each item links back to
   the original email (and to the source document/website when there is one).
2. A briefing email drafted into my inbox (to <<andrew's email>>) with the
   highlights, the source links inline, and a link to the full HTML page.

My timezone is <<e.g. Australia/Brisbane>>.
```

---

## Scheduled-task version — embed in the weekly Monday trigger

This is the `prompt` for the `create_trigger` scheduled task. It repeats the sender
list and settings because the scheduled session starts fresh. Keep it complete.

```
It's Monday — build this week's industry briefing using the weekly-policy-digest
skill. This is an automated run with nobody watching, so proceed without asking
questions.

Scan the Google Workspace inbox from the last 7 days. KEEP only industry/policy
signal: rate changes, credit & lending policy changes, regulatory/government news,
lender service/process updates, aggregator/licensee updates, industry media
(Momentum Media / The Adviser / Mortgage Business etc.), and events/awards. DROP
all client- and deal-specific email (pre-approvals, conditional/unconditional
approvals, application status, valuations, settlements, anything naming one
borrower or application).

Senders to scan (plus a topic search for anything relevant beyond this list):
<<paste the same sender addresses / domains here>>

Deliver:
1. A self-contained interactive HTML digest, grouped by category, each item linking
   back to the original Gmail message (build links as
   https://mail.google.com/mail/u/0/#all/<MESSAGE_ID>) and to any source
   document/website found in the email. If a Google Drive / file-hosting connector
   is available, upload the HTML and use its shareable URL in the email below.
2. A briefing email drafted into the inbox addressed to <<andrew's email>>, subject
   "Weekly Industry Briefing — week of <date>", containing the top-of-mind summary,
   headlines per category with the source links inline, and a link to the full HTML
   page (or the full linked content inline if no hosted URL is available).

If it was a quiet week, still deliver a short "quiet week" briefing rather than
nothing. Timezone for dates: <<e.g. Australia/Brisbane>>.
```

---

## Recalibration-reminder version — embed in a quarterly trigger

Keeps the sender list from going stale. Fires every few months, rescans, and drafts
a nudge email highlighting what changed. Self-contained (fresh session).

```
It's time for a quarterly recalibration of my weekly industry briefing. This is an
automated run — proceed without asking questions.

Scan my Google Workspace inbox over the last 90 days and discover the senders
emailing me, grouped as usual (lenders/banks, aggregator/Loan Market/licensee,
industry media, events/regulatory, and likely client/deal/noise).

Compare what you find against my CURRENT briefing sender list:
<<paste the current sender list here>>

Draft a short email to <<andrew's email>>, subject "Briefing sources — quarterly
check", flagging:
- NEW senders that have appeared and look like signal but aren't on my list yet
- Current senders that have gone SILENT over the window
- A one-line prompt telling me to reply, or paste my setup prompt, to refresh the
  list if I want to add or drop anything.

If nothing has changed, say so in one line rather than sending a long email.
Timezone for dates: <<e.g. Australia/Brisbane>>.
```

---

## Setting up the trigger (for whoever configures it)

Use the Claude Code Remote MCP `create_trigger` tool with:
- **prompt**: the scheduled-task version above, placeholders filled in
- **cron_expression**: Monday delivery time converted to UTC. For 7:00am Monday in
  Australia/Brisbane (UTC+10) that's `0 21 * * 0` (21:00 UTC Sunday). Recompute for
  the actual timezone; if the conversion crosses midnight, shift the day field.
- **name**: e.g. "Andrew — Weekly Industry Briefing"
- **notifications**: `{push:true}` so Andrew gets pinged when it's ready
