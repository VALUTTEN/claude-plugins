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
emails me, grouped by type: lenders/banks, my aggregator/licensee channels,
industry media (Momentum Media, The Adviser, Mortgage Business, etc.), and
event/awards organisers. Separate out the senders that are mostly client or
deal-specific (approvals, valuations, settlements) or marketing/personal, and
recommend excluding those.

Show me the grouped list — sender and how many emails from each, no subject lines
and no message contents — with your recommended include/exclude, and let me pick which
sources belong in my weekly briefing. Do not open or quote any of my emails while
working out who is who: my inbox contains client information and it should not be
read to make a sender-level decision. Once I've chosen, save that as my sender list,
run a first briefing over the last 7 days, and set up the recurring Monday schedule
with the list baked in.

My name is <<your first name>> and my timezone is <<e.g. Australia/Brisbane>>.
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

This is the `prompt` for the `create_trigger` scheduled task.

**Keep it thin. It carries the broker's settings and nothing else.**

Earlier versions of this prompt restated the whole method — the KEEP/DROP category
lists, the delivery rules, the Gmail link format, the Trash retry, the quiet-week
behaviour. That was a mistake, and an expensive one. A stored trigger prompt is
frozen at creation; SKILL.md is not. So every one of those duplicated rules was a
copy that went stale the moment the skill improved, and each improvement then
required every broker to hand-edit their task. Four releases in a row needed exactly
that.

Everything that is *method* belongs in the skill, which syncs. Only what is *this
broker's configuration* belongs here, because it exists nowhere else. The result is a
prompt that should not need changing again when the skill changes.

```
# valutten-broker-briefing prompt v0.10.0 — keep this line

It's Monday. Run the weekly-broker-briefing skill and follow it exactly — it holds
the current method, and it is newer than this prompt. This is an automated run with
nobody watching, so proceed without asking questions, and do not stop to confirm
anything.

My configuration:
- Name (for the digest header): <<broker's name>>
- Timezone for all dates: <<e.g. Australia/Brisbane>>
- Lookback window: the last 7 days
- Senders to scan, plus a topic search for anything relevant beyond this list:
  <<paste the sender addresses / domains here>>

Two things that must hold even if this prompt and the skill ever disagree: never
read or quote client email in order to decide whether a sender is client-related,
and never write to the mailbox — no drafts, no labels, no archiving, no sends.

If the weekly-broker-briefing skill is not available in this session, stop and say
so plainly rather than improvising a briefing from this prompt alone.
```

**Why the two safety lines are still duplicated.** Everything else was removed
precisely because duplication rots. These two stay because their failure mode is
unacceptable rather than merely untidy: reading client mail to triage senders, and
writing to a broker's mailbox. If the skill somehow fails to load, a thin prompt
should produce nothing — not an improvised briefing that breaks the privacy promise.
That is a deliberate exception to the rule above, not an oversight.

---

## Recalibration-reminder version — embed in a quarterly trigger

Keeps the sender list from going stale. Fires every few months, rescans, and delivers
a short artifact highlighting what changed. Self-contained (fresh session).

Thin, for the same reason as the weekly one: the method lives in the skill's Setup
mode (Step 0), which syncs; only the broker's current list is local to this task.

```
# valutten-broker-briefing prompt v0.10.0 — keep this line

It's time for the quarterly recalibration of my industry briefing. Run the
weekly-broker-briefing skill in recalibration mode and follow it exactly — it holds
the current method. Automated run, nobody watching, so proceed without asking
questions.

My configuration:
- Timezone for all dates: <<e.g. Australia/Brisbane>>
- Discovery window: the last 90 days
- My CURRENT briefing sender list, to compare against what you find:
  <<paste the current sender list here>>

Deliver a short artifact flagging senders that are new since this list was built and
senders that have gone silent, so I can decide whether to refresh it.

Two things that must hold even if this prompt and the skill ever disagree: discover
senders from address, domain and message count only — never open, quote or read
subject lines to decide who a sender is, because my inbox contains client
information — and never write to the mailbox.

If the weekly-broker-briefing skill is not available in this session, stop and say so
plainly rather than improvising.
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
