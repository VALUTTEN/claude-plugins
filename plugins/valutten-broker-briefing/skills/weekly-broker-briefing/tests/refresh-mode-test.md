# Testing refresh mode

Refresh mode ("Refresh an existing schedule" in SKILL.md) rebuilds a stale
scheduled-task prompt from the current template while preserving the broker's sender
list, name, timezone, lookback and cron.

It is a documented procedure carried out by a model, not code, so this is a
behavioural test. **Run each case twice.** A procedure that works once may have got
lucky on phrasing.

It also cannot be run from Claude Code: scheduled tasks are Cowork objects, created
through the Claude Code Remote MCP `create_trigger` tool. This needs a desktop Cowork
session.

**Do not test on a live briefing.** If refresh mode misbehaves, the failure mode is a
mangled or deleted schedule. Use the throwaway fixture below.

**Step 0.** Confirm the installed plugin version (Customize → Plugins). If it predates
the version that introduced refresh mode, sync first — otherwise you are testing a
version that does not contain the feature.

---

## Case 2 — a stale task rebuilds correctly (the real test)

### Create the fixture

New scheduled task named `ZZ TEST — refresh fixture (delete me)`.

Set the cron to something that cannot fire during the test — `0 3 1 1 *` (3am on
1 January). **Never click Run now on this task.** It exists only as something for
refresh mode to read. Nothing here touches a mailbox.

Paste this as its prompt. It is deliberately stale: old stamp, a skill name that no
longer exists, a drafted-email instruction, no Trash/Spam retry, no privacy guard.

```
# valutten-broker-briefing prompt v0.3.0 — keep this line

It's Monday — build this week's industry briefing using the weekly-policy-digest
skill. This is an automated run with nobody watching, so proceed without asking
questions.

Scan the Google Workspace inbox from the last 14 days. KEEP only industry/policy
signal: rate changes, credit & lending policy changes, regulatory/government news,
lender service/process updates, aggregator/licensee updates, industry media, and
events/awards. DROP all client- and deal-specific email.

Senders to scan (plus a topic search for anything relevant beyond this list):
zz-test-lender-one.example, zz-test-lender-two.example,
zz-test-aggregator.example, zz-test-media.example

Deliver:
1. An interactive HTML digest grouped by category.
2. A briefing email drafted into the inbox with the highlights and source links.

Timezone for dates: Australia/Brisbane.
```

The fixture carries three marks that appear nowhere else. Without them, a refresh
that quietly regenerated a fresh prompt from the template would be indistinguishable
from one that genuinely carried the broker's settings across:

- a **14-day** lookback, not the default 7
- four **.example** sender domains
- cron `0 3 1 1 *`

### Run it

In a new Cowork session: `Refresh my briefing schedule.`

### Pass criteria

Any "no" is a finding worth fixing before a broker relies on this.

- [ ] Identified the fixture as stale by **reading the stamp**, not by noticing the
      prompt looked odd
- [ ] All four `.example` domains carried across **verbatim and complete** — not
      three of four, not paraphrased, not "your existing lender list"
- [ ] The **14-day** lookback survived. Most likely thing to be silently reset to the
      7-day default, and the easiest to miss
- [ ] Cron still `0 3 1 1 *`, notification setting unchanged
- [ ] New prompt carries the **current** stamp
- [ ] New prompt names **weekly-broker-briefing**
- [ ] Drafted-email instruction **gone**
- [ ] Trash/Spam (`in:anywhere`) retry instruction now **present**
- [ ] It did **not** open the inbox. Refresh reads a stored prompt, not mail — any
      Gmail permission prompt during a refresh is a red flag
- [ ] Told you what changed in plain language, without pasting a diff
- [ ] If it used create-then-delete rather than update-in-place: the new task existed
      **before** the old was removed. At no point were there zero tasks

### Clean up

Delete `ZZ TEST — refresh fixture` and anything refresh mode created from it.

---

## Case 1 — a current task is left alone

With a task already on the current stamp, ask again.

**Pass:** reports it current, changes nothing.

**Fail:** rebuilds anyway. That means the stamp is decorative and it is really just
regenerating on request — which will eventually overwrite a broker customisation the
template does not know about.

---

## Case 3 — an unrecoverable prompt asks rather than guesses

Delete the entire "Senders to scan" block from the fixture, then refresh.

**Pass:** says the sender list cannot be recovered and offers to run Setup mode.

**Fail:** scans the inbox to rebuild the list without saying so first. That is a fresh
read of a mailbox full of client mail that nobody asked for — the only failure here
with a privacy consequence rather than a usability one, which is why it is a case of
its own.

---

## If a case fails

Fix the "Refresh an existing schedule" section in SKILL.md, bump the patch version,
push, re-sync, re-test. Changing the prompt template means bumping the stamp in
`assets/kickoff-prompt.md` too — the stamp always equals the plugin version.
