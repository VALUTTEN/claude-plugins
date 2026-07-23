---
name: weekly-broker-briefing
description: >-
  Build a weekly Monday intelligence briefing from a mortgage broker's
  Gmail/Google Workspace inbox. Scans configured senders (banks, lenders,
  aggregators, licensees, industry media like Momentum Media / The Adviser),
  summarises rate changes, credit/lending policy changes, regulatory news, and
  industry events/awards, and deliberately EXCLUDES client transactional email
  (pre-approvals, unconditional approvals, deal/settlement chatter). Produces an
  interactive HTML digest whose items link back to the original email or source
  document, delivered as a Cowork artifact plus a push notification. Use whenever the user
  asks to "run my weekly digest", "build my Monday briefing", "summarise this
  week's lender/policy emails", "what changed in the industry this week", "scan
  these senders", set up a recurring weekly review of policy/industry changes, or
  mentions VALUTTEN's weekly review. Trigger even without the word "digest" — any
  request to review a week of lender/policy/industry email into a briefing.
---

# Weekly Policy & Industry Digest

## What this skill does and why

Mortgage brokers drown in email. In a single week a broker's inbox mixes two
completely different kinds of message: **deal-flow noise** (a lender approving a
specific client, a valuation for one property, a settlement booking) and
**industry signal** (a bank changing its serviceability policy, a rate move, an
APRA update, an invitation to an awards night). The signal is what a broker
needs to run their business and advise clients well — but it's buried under the
noise, which is high-volume, client-specific, and already actioned in a CRM.

This skill pulls the signal out. Once a week it scans a broker-chosen set of
senders, keeps only the industry/policy/events material, throws away the
client-specific transactional email, and turns what's left into a short, skimmable
Monday briefing: an interactive HTML page grouped by theme, where every item
links straight back to the original email (or the source document/website),
delivered as a pinned Cowork artifact that updates each week, with a push
notification when the new one is ready.

The person reading the output is the broker themselves (an internal briefing —
not client-facing), so favour a concise, plain, get-to-the-point tone over polish.

## Before you start — what you need

1. **Gmail / Google Workspace must be connected** in this Cowork session (the
   `Gmail` connector). You'll search and read with it. You will NOT draft or send
   email — see Step 7.
   Google **Drive**, if connected, is a useful extra: it gives the digest a real
   shareable URL in the broker's own Drive.
2. **A sender list.** The broker tells you which addresses/domains to scan. If
   they haven't given one in their message, look for it in the pasted kickoff
   prompt (see `assets/kickoff-prompt.md`). If it's still missing — especially the
   **first time** the broker uses this — don't ask them to guess a list of banks
   from memory. Run **Setup mode (Step 0)** below, which discovers the real senders
   from their inbox and lets them pick. The whole digest depends on getting this
   list right, so it's worth calibrating once against reality.
3. **The broker's own email address** — used to identify them in the briefing
   header, not to send anything to.
4. **The lookback window** — default to the last 7 days unless told otherwise.

Do not rely on a saved config file persisting between runs: Cowork sessions are
ephemeral, and a scheduled run starts fresh with no memory. The durable place for
the sender list is the prompt itself — that's why the kickoff prompt and the
scheduled-task prompt both embed the full list (see "Set up the weekly schedule").

## Client data boundary — read this before changing any search

This skill runs against a mortgage broker's mailbox, which contains their clients'
personal information. Everything the skill reads is sent to Anthropic for inference,
in the United States. The broker's own privacy obligations, and usually their
aggregator's or licensee's AI policy, make bulk exposure of client data unacceptable.

The rule: **read the minimum needed, and never read client mail to decide it is client
mail.** Concretely:

- Sender discovery uses sender address, domain and volume only. No subjects, no snippets,
  no bodies, no opening messages.
- Topic searches must carry the negative terms that exclude deal traffic (see Step 2).
- Anything that turns out to be about one named borrower is dropped on sight, not
  summarised and not quoted.
- Nothing is ever transmitted to VALUTTEN. The briefing exists only in the broker's own
  account.

This constraint is the reason the briefing is defensible for a broker to run at all. If a
change would make the output better by reading more client email, the answer is no.

## The workflow

### Step 0 — Setup mode (first run / recalibration)

Run this the first time, or whenever the broker wants to refresh their sender list
("recalibrate", "rescan my inbox", "who should I be scanning"). The point is that a
broker can't reliably list from memory every lender, aggregator channel, media
source and event organiser that emails them — but their inbox already knows. So
discover it, show it grouped, and let them tick what belongs in the briefing.

Do this in **the broker's own session** with their Google Workspace connected —
it reads their private inbox, so it can only run where that account is connected
(e.g. Andrew's Loan Market Workspace), not from anyone else's session.

1. **Pick a discovery window.** Default to the **last 45–60 days** — long enough to
   catch monthly-ish senders (policy bulletins, industry newsletters, event invites)
   that a 7-day window would miss. Confirm with the broker, or just proceed if
   they've said go.

2. **Broad scan — sender metadata ONLY.** Pull the inbox over the window and aggregate
   by sender. For each distinct sender collect **only**: the address, the domain, and how
   many emails were received.

   **Do NOT collect, read, quote or display subject lines, snippets or bodies at this
   stage, and do not open messages.** Broker subject lines routinely carry a client's
   name ("Unconditional approval — Smith", "Valuation received — 14 Oak St"). Reading
   them to decide a sender is client-transactional means client personal information
   leaves the broker's mailbox for no benefit, since the decision is a sender-level one.
   See "Client data boundary" above. Watch specifically for the
   Loan Market / aggregator ecosystem (corporate comms, MyCRM/platform notices,
   compliance, the lender panel) plus the banks, non-banks, industry media
   (Momentum Media / The Adviser / Mortgage Business / Broker Daily) and event
   organisers.

3. **Auto-triage into candidate groups — from the sender identity alone.** Classify on
   the domain, the local part (`noreply@`, `broker@`, `notifications@`), and volume
   pattern. A domain you cannot place is offered to the broker as "unrecognised" for them
   to judge; never open one of its emails to find out. Using `references/classification.md`,
   sort the discovered senders into:
   - **Likely signal** (recommend including) — grouped as Lenders/Banks,
     Aggregator / Loan Market / Licensee, Industry Media, Events, Regulatory.
   - **Likely client-transactional / noise** (recommend excluding) — senders whose
     traffic is mostly deal-specific (approvals, valuations, settlements), plus
     obvious personal/marketing/spam.
   Show your reasoning briefly per group so the broker can trust or overrule it.

4. **Let the broker select.** Present the grouped list for a quick decision. Two ways,
   broker's choice:
   - **Conversational (default, lowest friction):** show a numbered, grouped list of
     **senders and message counts** and ask them to tell you any to drop or add. Good
     for a fast "looks right, but drop 3 and 7". Do not illustrate entries with subject
     lines, even if it would make the list easier to judge.
   - **Interactive checklist:** populate `assets/source-picker.html` with the
     discovered senders (one checkbox row each, pre-ticked per your recommendation),
     deliver it, and have them tick and click **Copy selected senders** to paste the
     final list back. Better when there are lots of senders to sift.

5. **Produce the finalised sender list**, then offer the two next actions:
   (a) run a first briefing right now against the last 7 days (Steps 1–7), and
   (b) set up the recurring Monday schedule with this list embedded (see "Set up the
   weekly schedule"). Because the list now lives in the schedule's prompt, this
   calibration only needs redoing when their mix of senders changes.

If the broker already has a sender list they're happy with, skip Step 0 and go
straight to Step 1.

### Step 1 — Gather the sender list and settings

Collect: the list of senders/domains, the broker's email, and the lookback
window. Restate them back briefly so the broker can catch a typo'd domain before
you spend time searching. In an unattended/scheduled run, skip the confirmation
and proceed with what's embedded in the prompt.

### Step 2 — Search Gmail two ways, then merge

Search with the Gmail connector. Use two complementary passes so you don't miss
things, then de-duplicate by message:

**Pass A — by sender** (the configured list). Gmail search syntax, e.g.:
`from:(cba.com.au OR nab.com.au OR anz.com.au OR themortgageagency.com.au) newer_than:7d`

**Pass B — by topic** (catches relevant mail from senders not on the list —
e.g. a new lender BDM, a one-off industry invite). This pass MUST be bounded so it
cannot sweep in client and deal email. Exclude the transactional vocabulary explicitly:

`newer_than:7d (subject:(rate OR rates OR policy OR serviceability OR "credit policy" OR APRA OR ASIC OR webinar OR award OR conference OR "professional development")) -subject:(approval OR approved OR valuation OR settlement OR settled OR "pre-approval" OR discharge OR payout OR "loan application")`

If a Pass B result turns out to concern one named borrower, **drop it immediately and do
not summarise it**, even if it also mentions a rate or policy change.

Adjust `newer_than` to the chosen window. Pull the thread/message list from both,
merge, and drop duplicate message IDs. Then read each candidate with the Gmail
connector to get sender, subject, date, a usable summary of the body, and any
links in the body.

Be efficient: you don't need the full body of every message — the sender,
subject, and first chunk of content are usually enough to classify and summarise.
Read deeper only when an item is clearly signal and you need the specifics (the
actual new rate, the effective date, what the policy change is).

### Step 3 — Classify: keep the signal, drop the noise

This is the heart of the skill. For each message decide **KEEP** (industry/policy
signal) or **DROP** (client transactional / irrelevant). The full rules and worked
examples are in `references/classification.md` — read it; the distinction is
subtle and getting it right is the main thing that makes this briefing useful
rather than annoying.

The short version:

**KEEP** — anything about the industry, not a specific deal:
- Interest-rate changes (lender rate announcements, fixed/variable moves, RBA-driven changes, cashback/pricing changes)
- Credit & lending policy changes (serviceability, LVR, borrowing capacity, acceptable income/security, LMI, policy niches, product launches/withdrawals)
- Lender process/service updates (turnaround times, portal/tech changes, document requirements that apply to *all* deals, BDM changes)
- Regulatory & government (APRA, ASIC, AFCA, ACCC, budget/first-home-buyer scheme changes, compliance obligations)
- Aggregator / licensee / advisor communications (compliance bulletins, commission/clawback changes, industry updates from the group)
- Industry media & commentary (Momentum Media, The Adviser, Mortgage Business, Broker Daily, MPA, industry newsletters)
- Events: awards nights, conferences, PD days, roadshows, webinars, networking

**DROP** — anything tied to one client/deal or otherwise not industry signal:
- Pre-approvals, conditional approvals, unconditional/formal approvals for a named borrower
- Application status updates, "further information required", valuations ordered/returned for a specific property, settlement dates/bookings, loan-doc issuance for a client
- Anything naming an individual borrower or referencing a specific loan/application number
- Personal admin, calendar invites for one-on-one meetings, generic marketing/spam, receipts

The rule of thumb: **if it would only matter for one client's file, drop it. If it
changes how the broker works, prices, advises, or where they need to show up —
keep it.**

### Step 4 — Summarise each kept item

This is a **weekly at-a-glance briefing** — the broker should be able to skim the
whole thing in under two minutes and click into anything that matters. So keep each
item to a scannable bullet, not a paragraph:

- **Subject** — a short, plain headline (lead with the source, e.g. "CBA — variable
  rates up 0.25%"). This is the bold line the eye lands on.
- **Brief summary** — ONE line (aim for a single sentence, ~15–25 words): the
  concrete fact (the actual new rate, the actual policy change) and the effective
  date if stated. Resist writing three sentences; if it truly needs more, it's the
  exception, not the rule.
- **Source** — one clickable link that opens the origin (see Step 5).

Also capture the source name and email date for display. Nothing else — the goal is
a clean list of one-line bullets, each with a subject and a click-through, not a
wall of cards.

Group items into these categories (omit any that are empty):
1. Rate Changes
2. Credit & Lending Policy
3. Regulatory & Government
4. Lender Service & Process
5. Aggregator / Licensee
6. Industry News & Media
7. Events & Awards

Group items into these categories (omit any that are empty):
1. Rate Changes
2. Credit & Lending Policy
3. Regulatory & Government
4. Lender Service & Process
5. Aggregator / Licensee
6. Industry News & Media
7. Events & Awards

### Step 5 — Build the clickable source

Every item needs a **source link the broker can click to go straight to the origin** —
the email, the document, or the website page. Pick the single most useful target as
the primary "Source" link:

- If the email points to a real **document or web page** (a policy PDF, rate sheet,
  article, or event/RSVP page), link **that** — it's usually what the broker actually
  wants to open.
- Otherwise link the **original email in Gmail**. From the message's Gmail ID, build:
  `https://mail.google.com/mail/u/0/#all/<MESSAGE_ID>`
  If those ever don't resolve, fall back to the RFC822 header form:
  `https://mail.google.com/mail/u/0/#search/rfc822msgid:<Message-Id-header>`
  (strip the angle brackets from the header value).

When both a document/page **and** the email are useful, make the document the primary
"Source" link and add a small secondary "· email" link back to the original message.
Every item must have at least one working link — never a bullet with no click-through.

### Step 6 — Assemble the HTML digest

Use `assets/digest-template.html` as the shell — it's a clean, self-contained,
single-file page (inline CSS, no external dependencies) built as a **scannable
bulleted list**, not heavy cards. Fill in:
- The week range and generated date in the header
- A one-line "top of mind" strip (the 2–3 biggest items of the week)
- Under each category, one **bullet per item**: a bold clickable **subject**, a
  one-line summary beneath it, and the source link. Keep it tight so the whole page
  reads like a well-organised list the broker can skim in a minute or two.

Keep empty categories out. Read the template's comments for exactly where content
slots in. Save the finished page to a file (e.g. `weekly-briefing-<YYYY-MM-DD>.html`).

**The template is not advisory — reproduce its chrome exactly.** Two blocks are
load-bearing and must appear in every digest you produce, byte for byte as written
in the template:

- `<header class="masthead">`, including the VALUTTEN wordmark.
- `<footer class="colophon">`, including the `valutten.com` link with its `utm_*`
  query parameters intact.

Do not remove, reword, restyle, relocate or "tidy" either block, and do not strip
the query parameters from the footer link. This is how the briefing is attributed
back to VALUTTEN, and a digest that renders without them is a defect even if the
content is perfect. The same applies to the `<style>` block: use the template's CSS
as-is rather than writing your own.

Before saving, verify the finished file actually contains: the masthead
`class="wordmark"` element, the `utm_source=broker-briefing` parameter, and a
closing `</footer>`. If any is missing,
rebuild the page from the template rather than patching it.

### Step 7 — Deliver

**One thing gets delivered: the interactive HTML page.** Do NOT draft or send an
email. The briefing arrives as an artifact plus a push notification, and that is
deliberate — see "Why no email" below.

- **Persist it as a Cowork artifact.** This is the primary delivery. Write the HTML
  → `SendUserFile` to get the `file_uuid` → `mcp__remote-devices__create_artifact`.
  It lands in the broker's gallery, where they can pin it, so each Monday's run
  updates the same familiar place rather than scattering files.
- In an **attended** run, also send it with `SendUserFile` so it is right there in
  the conversation.
- If a **Google Drive / file-hosting connector is available**, upload the HTML there
  as well. That gives a real shareable URL in the broker's own Drive, which is the
  only way the briefing opens on a phone or gets shared with their team. Mention the
  URL in your chat-side summary.

  **When you have that URL, keep the `.openbar` block** in the template and put the
  URL in `{{PUBLIC_URL}}`. It renders an "Open in your browser" button, which opens
  the briefing in whatever browser the broker actually uses. **If you do not have a
  URL, delete the whole `.openbar` block** — a button that goes nowhere is worse than
  no button. Never point it at a local file path or an artifact identifier; neither
  resolves in a browser.

  If Drive is not connected, say so once in your chat-side summary and suggest
  connecting it, since it is the difference between a briefing they can only read
  inside Claude and one they can open anywhere.

The scheduled Monday run sets `notifications` to `{push:true}` (see "Set up the
weekly schedule"), so the broker gets a push when the new briefing is ready. Artifact
plus push is the whole delivery mechanism.

**Why no email.** The Gmail connector can only create drafts, never send. A draft
addressed to yourself lands in the Drafts folder, not the inbox, so it is not
actually "waiting for you Monday morning" — it is buried in a folder nobody opens,
and it needs the entire briefing inlined because there is usually no URL to link to.
The artifact is a better version of the same idea: one pinned place that updates
weekly. Gmail is still required, but for **reading** the source email, not delivery.

Sending the briefing through VALUTTEN's own infrastructure is also ruled out. The
content is derived from the broker's lender correspondence, and routing it through a
third party would break the guarantee that it never leaves their own account.

Keep your chat-side summary to a line or two; the deliverables carry the detail.

## Set up the weekly schedule

The broker wants this every Monday without having to remember. Set up a recurring
scheduled task with the Claude Code Remote MCP `create_trigger` tool (load via
ToolSearch: `select:mcp__claude-code-remote__create_trigger`). Never use the local
`CronCreate` tools — those die with the session.

Two things matter:

**Timezone → UTC cron.** `create_trigger` takes a 5-field cron in **UTC**.
Confirm the broker's timezone, pick a delivery time (a sensible default is ~7:00am
Monday local so it's waiting when they start the week), and convert. Example: for
**Australia/Brisbane (UTC+10)**, 7:00am Monday local = 21:00 UTC **Sunday**, so
the cron is `0 21 * * 0` (note the day rolls back to Sunday). Recompute for the
broker's actual zone; if the local→UTC conversion crosses midnight, shift the day
field too.

**Self-contained prompt with the sender list embedded.** A scheduled run starts a
fresh session with no memory of this conversation, so the trigger's `prompt` must
carry everything: instruction to run this skill, the full sender list, the
broker's email, the lookback window, and the delivery instructions. Build it from
the template in `assets/kickoff-prompt.md` (the "Scheduled-task version" at the
bottom), with the real addresses filled in. Set `notifications` to `{push:true}`
so the broker gets a ping when each week's briefing is ready.

After creating it, tell the broker the schedule in plain language ("every Monday
at 7am Brisbane time") and that they can ask you to change or pause it anytime.

## Set up the recalibration reminder (keep the sender list fresh)

A broker's mix of senders drifts over time — they get accredited with a new lender,
subscribe to a new publication, an aggregator spins up a new channel, or a sender
goes quiet. The weekly digest only scans the senders baked into its schedule prompt,
so a stale list silently misses new signal. To catch this, set up a **second,
low-frequency scheduled task** that nudges the broker to re-run Setup mode every few
months.

Create it with the same `create_trigger` tool. Suggested cadence: **quarterly** —
e.g. the 1st of Jan/Apr/Jul/Oct. In UTC for Australia/Brisbane (UTC+10), 8:00am
local on the 1st is `0 22 last-day-of-prev-month ...`; simplest is to fire on the
1st at a local morning time and let the day roll — e.g. `0 22 1 1,4,7,10 *` fires
10:00pm UTC on the 1st (which is 8:00am local on the 1st). Recompute for the broker's
actual timezone and preferred time.

Make the reminder *useful*, not just a ping: its prompt should run a fresh discovery
scan of the last ~90 days, compare what it finds against the current sender list
(embed that list in the prompt too), and produce a short artifact for the broker
flagging **new senders that have appeared** and **current senders that have gone
silent**, with a one-line "run your setup prompt to refresh your list." Deliver it
the same way as the briefing itself (artifact plus push, no email). That way the
recalibration is half-done before they even open it. Use the "Recalibration-reminder
version" prompt in `assets/kickoff-prompt.md`. Set `notifications` to `{push:true}`.

Tell the broker this exists and that they can change the cadence or turn it off
anytime — some brokers will prefer it monthly, others twice a year.

### After creating the schedule: prime the permissions (do NOT skip)

A scheduled run stalls on permission prompts and waits indefinitely, so the broker
finds nothing on Monday and assumes it is broken. Immediately after creating the task:

1. Tell the broker to click **Run now** on the task.
2. Tell them to watch for permission prompts and choose **"Always allow"** on each one,
   not the single-use approval. Future runs then auto-approve the same tools.

Say this out loud in the conversation rather than assuming they will find it. Without
it the first unattended run halts on the Gmail permission and every run after it does
the same.

Two cases where "Always allow" will not stick, both outside our control:

- Connector tools their **organisation has set to "ask"** prompt on every call and offer
  no always-allow option.
- **Team or Enterprise** orgs may require per-task approval for write-capable connector
  tools.

If either applies, say so plainly: the briefing will need a click each week, and that is
their admin's policy rather than a fault in the plugin.

## Handling problems gracefully

- **Gmail connector blocked by their employer.** Aggregators and licensees often
  allowlist which third-party apps may touch company mail. If connecting fails or the
  connector is absent, this is almost certainly it. Say so directly: it needs their IT
  or licensee to approve the connector, and no amount of retrying will fix it. Do not
  let them conclude the plugin is broken.
- **The wrong Google account is connected.** If discovery finds almost no lender,
  aggregator or industry senders, suspect a personal Gmail rather than the work
  Workspace before concluding the inbox is quiet. Ask which account is connected.
- **Placeholders left unfilled.** If the pasted prompt still contains `<your email>` or
  `<e.g. Australia/Brisbane>`, do not guess and do not proceed — ask for the real values.
- **Marketplace or plugins unavailable.** On a managed Team/Enterprise account an admin
  can disable personal marketplaces entirely, so the "Add marketplace" option is missing.
  That is an org policy, not a fault; point them at their Claude admin.
- **Usage limits.** A 60-day discovery scan plus weekly runs consume usage. If a run dies
  partway, say it may be a plan limit and suggest re-running later rather than silently
  producing a thin briefing.
- **Gmail not connected:** stop and ask the broker to connect their Google
  Workspace account before continuing — everything depends on it.
- **No sender list:** ask for it; don't guess a list of banks.
- **A quiet week / nothing kept:** still deliver a short briefing that says it was
  a quiet week and lists the few low-signal items you saw, rather than silently
  producing nothing — a broker seeing "quiet week" is useful information.
- **Huge volume:** if a sender floods the inbox, summarise at the theme level and
  link representative emails rather than making 40 near-identical cards.
