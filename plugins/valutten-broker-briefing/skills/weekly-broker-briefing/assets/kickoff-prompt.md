# Kickoff prompts

Four versions of the same prompt. **First-time setup** builds the sender list. The
**manual** version is what the broker pastes into a Cowork session when they want to
run the briefing by hand. The **scheduled-task** version gets baked into the recurring
Monday trigger, and the **recalibration** version into a quarterly one — both must be
fully self-contained, because a scheduled run has no memory of any earlier chat.

Fill in every `<<...>>` placeholder before use.

Every version delivers the same one thing: the HTML digest, as a Cowork artifact plus
a push notification. **No prompt here asks for an email.** Gmail is read-only in this
plugin — a self-addressed draft lands in Drafts where nobody looks (SKILL.md, "Why no
email"). If you edit these prompts, keep it that way.

## The version stamp — why the two scheduled prompts start with a comment

Both scheduled prompts open with:

```
# valutten-broker-briefing prompt v<version> — keep this line
```

A scheduled task stores its own copy of the prompt from the moment it was created.
Publishing a new plugin version does **not** reach it. So a broker can be running a
prompt that is several releases old, and nothing on the task says so — which is
exactly how a trigger survived for weeks calling a skill name that no longer existed.

The stamp makes staleness visible: open the task, read line one, compare against the
plugin version.

**The stamp always equals the plugin version. Bump it on every release, even when
the prompt text itself did not change.** It is tempting to treat it as a separate
prompt-template version and bump it only when the prompt changes — don't. Refresh
mode compares the stamp against the installed plugin version, so a stamp that lags
makes a current task look stale. The cost of the simple rule is an occasional
rebuild that changes nothing, which is harmless because rebuilding is idempotent.
The cost of the clever rule is a comparison nobody can reason about. Keep it dumb.

---

## First-time setup version — run this ONCE to build the sender list

The broker pastes this the first time (with their Google Workspace connected) so the
skill discovers their real senders instead of them guessing from memory.

```
Set up my weekly industry briefing — this is my first run, so calibrate it against
my inbox before configuring anything.

Scan my Google Workspace inbox over the last 60 days and discover every sender that
emails me, grouped by type: lenders/banks, my aggregator/Loan Market/licensee
channels, industry media (Momentum Media, The Adviser, Mortgage Business, etc.),
and event/awards organisers. Separate out the senders that are mostly
client/deal-specific (approvals, valuations, settlements) or marketing/personal, and
recommend excluding those.

Show me the grouped list — sender and how many emails from each, no subject lines
and no message contents — with your recommended include/exclude, and let me pick which
sources belong in my weekly briefing. Do not open or quote any of my emails while
working out who is who: my inbox contains client information and it should not be read
to make a sender-level decision. Once I've chosen, save that as my sender list, run a first briefing over
the last 7 days, and set up the recurring Monday schedule with the list baked in.

My timezone is <<e.g. Australia/Brisbane>>.
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

Deliver one thing: an interactive HTML digest grouped by category, where each item
links back to the original email (and to the source document/website when there is
one). Save it as a Cowork artifact and send it to me in the conversation. Do not
draft or send an email.

My timezone is <<e.g. Australia/Brisbane>>.
```

---

## Scheduled-task version — embed in the weekly Monday trigger

This is the `prompt` for the `create_trigger` scheduled task. It repeats the sender
list and settings because the scheduled session starts fresh. Keep it complete.

```
# valutten-broker-briefing prompt v0.8.0 — keep this line

It's Monday — build this week's industry briefing using the weekly-broker-briefing
skill. This is an automated run with nobody watching, so proceed without asking
questions.

The briefing is for <<broker's name>> — use it for {{BROKER_NAME}} in the template.

Scan the Google Workspace inbox from the last 7 days. KEEP only industry/policy
signal: rate changes, credit & lending policy changes, regulatory/government news,
lender service/process updates, aggregator/licensee updates, industry media
(Momentum Media / The Adviser / Mortgage Business etc.), and events/awards. DROP
all client- and deal-specific email (pre-approvals, conditional/unconditional
approvals, application status, valuations, settlements, anything naming one
borrower or application).

Senders to scan (plus a topic search for anything relevant beyond this list):
<<paste the same sender addresses / domains here>>

Deliver one thing: a self-contained interactive HTML digest, grouped by category,
each item linking back to the original Gmail message (build links as
https://mail.google.com/mail/u/0/#all/<MESSAGE_ID>) and to any source
document/website found in the email. Save it as a Cowork artifact — that plus the
push notification on this task is the whole delivery. Do NOT draft or send an email.

If a Google Drive / file-hosting connector is available, also upload the HTML there
and put its shareable URL in the template's `.openbar` block, so the briefing opens
in a real browser. If there is no such URL, delete that block rather than shipping a
button that goes nowhere.

If any configured sender returns zero results, re-run that sender with in:anywhere
before concluding there was nothing — a mail filter may be auto-archiving or
trashing their bulletins. Note in the briefing which senders were only found
outside the inbox.

If it was a quiet week, still deliver a short "quiet week" briefing rather than
nothing. Timezone for dates: <<e.g. Australia/Brisbane>>.
```

---

## Recalibration-reminder version — embed in a quarterly trigger

Keeps the sender list from going stale. Fires every few months, rescans, and delivers
a short artifact highlighting what changed. Self-contained (fresh session).

```
# valutten-broker-briefing prompt v0.8.0 — keep this line

It's time for a quarterly recalibration of my weekly industry briefing. This is an
automated run — proceed without asking questions.

Scan my Google Workspace inbox over the last 90 days and discover the senders
emailing me, grouped as usual (lenders/banks, aggregator/licensee, industry media,
events/regulatory, and likely client/deal/noise). Use sender address, domain and
message count ONLY — do not open, quote or read subject lines while working out who
is who. My inbox contains client information and it must not be read to make a
sender-level decision.

Compare what you find against my CURRENT briefing sender list:
<<paste the current sender list here>>

Deliver a short HTML artifact titled "Briefing sources — quarterly check", flagging:
- NEW senders that have appeared and look like signal but aren't on my list yet
- Current senders that have gone SILENT over the window
- A one-line prompt telling me to paste my setup prompt to refresh the list if I
  want to add or drop anything.

Do not draft or send an email — the artifact plus the push notification on this task
is the whole delivery.

If nothing has changed, say so in one line rather than padding it out.
Timezone for dates: <<e.g. Australia/Brisbane>>.
```

---

## Refreshing an existing trigger after a plugin update

The broker does not need any of the prompts above for this. They say:

```
Refresh my weekly briefing schedule — I've updated the plugin.
```

The skill then reads the stored prompt off their existing task, keeps the sender
list, name, timezone and cron, and rebuilds the rest from the current template. See
"Refresh an existing schedule" in SKILL.md. The calibrated sender list is the
expensive part and it is already in the old prompt, so nobody should be re-running
first-time setup just to pick up a new version.

---

## Setting up the trigger (for whoever configures it)

Use the Claude Code Remote MCP `create_trigger` tool with:
- **prompt**: the scheduled-task version above, placeholders filled in
- **cron_expression**: Monday delivery time converted to UTC. For 7:00am Monday in
  Australia/Brisbane (UTC+10) that's `0 21 * * 0` (21:00 UTC Sunday). Recompute for
  the actual timezone; if the conversion crosses midnight, shift the day field.
- **name**: e.g. "VALUTTEN — Weekly Broker Briefing"
- **notifications**: `{push:true}` so the broker gets pinged when it's ready. This is
  not optional: the push *is* half the delivery, since an artifact that appears with
  no notification is an artifact nobody opens.
