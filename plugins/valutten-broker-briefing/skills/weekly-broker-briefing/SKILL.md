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
  request to review a week of lender/policy/industry email into a briefing. ALSO
  use to maintain an existing briefing schedule — "refresh my schedule", "update
  my briefing", "is my briefing up to date", "I just updated the plugin", "my
  Monday briefing stopped working" — which rebuilds a stale scheduled-task prompt
  from the current template while keeping the broker's sender list and cron.
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
   `Gmail` connector).

   **Gmail is strictly read-only for this skill. Search and read. Nothing else.**
   Use only search and message/thread retrieval. Do **not** label, unlabel, create
   or delete labels, archive, move, star, mark read or unread, trash, draft or
   send — not for the broker's convenience, not to "file" what you found, not to
   mark what you have already processed, not even if the broker asks in passing.
   If they want the briefing's sources labelled, say that this plugin does not
   modify their mailbox and they can do it in Gmail themselves.

   This is not fussiness. A broker's mailbox is a business record their licensee
   and aggregator can audit, and much of it is client correspondence. An automated
   process silently relabelling or archiving it is a compliance problem, and one
   that surfaces weeks later when something cannot be found. Read-only is also the
   promise made on the marketing page and in the setup email, so writing to Gmail
   would make that copy false.

   Tracking state across runs is the tempting exception — resist it. A label like
   "briefed" would let a run skip what it already covered, but it writes to their
   mailbox to save us a search we can do for free with a date window. The lookback
   window is the state.

   You will NOT draft or send email — see Step 7.
   Google **Drive**, if connected, is a useful extra: it gives the digest a real
   shareable URL in the broker's own Drive.
2. **A sender list.** The broker tells you which addresses/domains to scan. If
   they haven't given one in their message, look for it in the pasted kickoff
   prompt (see `assets/kickoff-prompt.md`). If it's still missing — especially the
   **first time** the broker uses this — don't ask them to guess a list of banks
   from memory. Run **Setup mode (Step 0)** below, which discovers the real senders
   from their inbox and lets them pick. The whole digest depends on getting this
   list right, so it's worth calibrating once against reality.
3. **The broker's name** — it fills `{{BROKER_NAME}}` in the digest header
   ("Prepared for Sarah"). A **name**, not an email address: an email address in
   that slot looks like a mail-merge that misfired. You do not need their email
   address for anything — nothing is sent — so don't ask for it.
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
- Anything **about** one named borrower is dropped on sight, not summarised and not
  quoted. An industry item that only mentions a client in passing keeps its industry
  substance with the client reference discarded — see Step 2. If you cannot tell
  which you have, drop it.
- Nothing is ever transmitted to VALUTTEN. The briefing exists only in the broker's own
  account.
- The mailbox is never modified. No labels, no archiving, no moving, no marking read,
  no drafts. The broker's inbox is exactly as they left it after a run — see
  "Before you start".

This constraint is the reason the briefing is defensible for a broker to run at all. If a
change would make the output better by reading more client email, the answer is no.

## Talking to the broker while it runs

The audience is a mortgage broker who has never installed a plugin before. Two
things reliably make them think it has broken when it has not:

- **Silence.** A discovery scan or a full briefing run goes quiet for several
  minutes. To someone watching a still screen that is indistinguishable from a
  crash, and they will close the window. **Before you start any long scan, say
  plainly that it will be quiet for a few minutes and that this is normal.** Then
  keep it to one short progress line at each major step — enough to show a pulse,
  not a running commentary.
- **Permission prompts.** These stop everything and wait indefinitely. Say a
  button is coming, say they have to click it, and say to choose **"Always allow"**
  rather than the one-time approval. See "prime the permissions" below.

Never make a broker feel they are being tested on something technical. If something
is genuinely outside our control (an org policy, a missing connector), say so in one
plain sentence and say who can fix it — do not let them conclude the plugin is
broken or that they did it wrong.

## The workflow

### Step 0 — Setup mode (first run / recalibration)

Run this the first time, or whenever the broker wants to refresh their sender list
("recalibrate", "rescan my inbox", "who should I be scanning"). The point is that a
broker can't reliably list from memory every lender, aggregator channel, media
source and event organiser that emails them — but their inbox already knows. So
discover it, show it grouped, and let them tick what belongs in the briefing.

Do this in **the broker's own session** with their Google Workspace connected —
it reads their private inbox, so it can only run where that account is connected
(e.g. their aggregator-issued Workspace account), not from anyone else's session.

1. **Pick a discovery window.** Default to the **last 45–60 days** — long enough to
   catch monthly-ish senders (policy bulletins, industry newsletters, event invites)
   that a 7-day window would miss. Confirm with the broker, or just proceed if
   they've said go.

2. **Broad scan — sender metadata ONLY.** Pull the inbox over the window and aggregate
   by sender. For each distinct sender collect **only**: the address, the domain, and how
   many emails were received.

   **Use `view: THREAD_VIEW_METADATA_ONLY` on `search_threads`. This is not optional.**
   The default view is `THREAD_VIEW_MINIMAL`, which returns the subject line and a
   snippet of every message. That means the default hands you client subject lines
   whether you want them or not, and the privacy rule degrades into "do not look at
   what you have already been given" — which is not a control, it is an honour
   system, and it is unauditable after the fact.

   `THREAD_VIEW_METADATA_ONLY` returns sender, recipients, date and labels, with no
   subject and no snippet. The client data never enters the context window at all.
   Verified against a real mailbox on 8 August 2026: the discovery scan produced a
   correct, usable sender list — industry publishers and aggregator addresses clearly
   distinguishable from SaaS and billing noise — with zero subject lines returned.

   If you ever find yourself with subject lines during discovery, you have used the
   wrong view. Stop, discard them, and re-run with the metadata view rather than
   proceeding carefully around them.

   **Do NOT collect, read, quote or display subject lines, snippets or bodies at this
   stage, and do not open messages.** Broker subject lines routinely carry a client's
   name ("Unconditional approval — Smith", "Valuation received — 14 Oak St"). Reading
   them to decide a sender is client-transactional means client personal information
   leaves the broker's mailbox for no benefit, since the decision is a sender-level one.
   See "Client data boundary" above. Watch specifically for the
   broker's own aggregator ecosystem — whichever group they are under (AFG,
   Connective, Loan Market, LMG, Finsure, Mortgage Choice and so on): corporate
   comms, the CRM/platform notices, compliance, the lender panel — plus the banks,
   non-banks, industry media
   (Momentum Media / The Adviser / Mortgage Business / Broker Daily) and event
   organisers.

3. **Auto-triage into candidate groups — from the sender identity alone.** Classify on
   the domain, the local part (`noreply@`, `broker@`, `notifications@`), and volume
   pattern. A domain you cannot place is offered to the broker as "unrecognised" for them
   to judge; never open one of its emails to find out. Using `references/classification.md`,
   sort the discovered senders into:
   - **Likely signal** (recommend including) — grouped as Lenders/Banks,
     Aggregator / Licensee, Industry Media, Events, Regulatory.
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

### Step 0b — Recalibration mode (what the quarterly task runs)

The quarterly scheduled task invokes this by name ("run the weekly-broker-briefing
skill in recalibration mode"). It is Step 0's discovery half, run unattended, with a
comparison instead of a briefing. It does **not** produce a digest.

1. Run the same sender discovery as Step 0.2 over the window in the prompt (default
   90 days). **The same rule applies with no exceptions: address, domain and message
   count only.** This runs with nobody watching, which makes it the worst possible
   place to relax it.
2. Compare what you found against the current sender list embedded in the prompt.
3. Produce a short artifact with two lists — **new senders** that look like signal
   but are not on the list, and **current senders that have gone silent** over the
   window — plus one line telling the broker to run their setup prompt if they want
   to change anything.
4. Deliver it exactly as Step 7 delivers a briefing: artifact plus the task's push
   notification. No email, no mailbox writes.
5. If nothing has changed, say so in one line. A short honest answer is the correct
   output, not a failure.

Never apply the changes yourself. Recalibration reports drift; the broker decides
what to do about it. Silently editing their sender list would change what their
briefing covers without them ever agreeing to it.

### Step 1 — Gather the sender list and settings

Collect: the list of senders/domains, the broker's name, and the lookback
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

**Named borrowers: what the message is ABOUT decides it, not what it mentions.**

- If the message **is about** one borrower, deal, property or application — an
  approval, a valuation, a settlement, a request for more documents — **drop it
  immediately and do not summarise it**, even if it also mentions a rate or a
  policy change. A rate quoted for one client is not a rate announcement.
- If the message is a **genuine industry item that incidentally names a client** —
  a lender's weekly rate sheet that closes with "congratulations on the Smith
  settlement", a BDM's policy bulletin with a pleasantry at the end — keep the
  industry substance and **discard the client reference entirely**. Summarise the
  rate or the policy only. Never quote, paraphrase, allude to or count the client
  sentence, and never let a borrower name, address or loan number reach the digest.
- **When you cannot tell which it is, drop it.** The cost of dropping an industry
  item is one missing line the broker can still find in their inbox. The cost of
  keeping a client item is a borrower's name in a document that gets screenshotted
  and forwarded.

This distinction exists because the earlier blanket rule discarded a lender's entire
weekly rate sheet whenever someone appended a courtesy line — a real and recurring
loss. The output guarantee is unchanged: nothing about a named borrower appears in
the briefing, ever. What changed is that an industry email is no longer thrown away
for merely containing a pleasantry.

Adjust `newer_than` to the chosen window. Pull the thread/message list from both,
merge, and drop duplicate message IDs. Then read each candidate with the Gmail
connector to get sender, subject, date, a usable summary of the body, and any
links in the body.

**If a sender search returns nothing, re-run it with `in:anywhere` before believing
it.** Gmail search silently excludes Spam and Trash unless you ask for them. Brokers
very often have an old filter auto-archiving or auto-trashing lender bulletins —
they set it up years ago to clean up their inbox and have long forgotten. The result
is a briefing that says "quiet week" with total confidence while the rate change sat
in Trash. This is the worst failure this skill has, because it looks like a working
run and the broker has no way to tell.

So: any configured sender that returns **zero** results over the window gets one
retry as `from:thatsender in:anywhere newer_than:<window>`. If the retry finds mail,
use it, and **tell the broker in your chat-side summary which senders were only
found outside the inbox** — that is a filter they probably want to fix, and it is
information they cannot get any other way. Do not silently fold the results in as if
nothing happened.

**Verified against a real mailbox, 8 August 2026.** One sender returned an estimate
of **1** thread without `in:anywhere` and **201** with it. Same sender, same window.
That is the size of the hole this retry closes, measured rather than assumed.

Two specifics worth knowing, both established by that test:

- **`in:anywhere` in the query is sufficient.** The `includeTrash: true` parameter on
  `search_threads` adds nothing on top of it — both together returned the same 201.
  Use the operator; it travels with the query string.
- **Seeing `TRASH` in a normal result does NOT mean Trash was searched.** `search_threads`
  matches at thread level, so a thread that matches on one message returns *all* its
  messages, trashed ones included. That looks like Trash coverage and is not: the plain
  query above surfaced trashed messages while still missing 200 threads. Never conclude
  from the presence of `TRASH` labels that the retry is unnecessary — run it on any
  zero-result sender regardless.

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

Group items into these six categories, and **only** these six. They match the
section headings in `assets/digest-template.html` exactly, in this order. Omit any
that are empty (delete the whole `<section class="cat">`), but never invent a
seventh — there is no slot for it in the template, so anything you file under a
category that isn't on this list silently vanishes from the page.

1. Rate Changes
2. Credit & Lending Policy
3. Regulatory & Government
4. Lender Service & Process
5. Aggregator & Licensee
6. Industry News & Events

Note that **industry media and events share one section**. A conference invite, an
awards night and a Momentum Media article all belong in "Industry News & Events".

### Step 4a — Verify every figure before it goes on the page

A broker acts on this. A wrong rate, a wrong LVR or a wrong effective date is worse
than no briefing at all, because the digest presents everything with the same
confidence and they have no way to tell which numbers were read carefully.

So, before assembly, check each summary against its source message:

- **Every number must appear in the source.** Rates, LVR caps, dollar figures,
  percentages, basis points. If you cannot point at where in the email the figure
  came from, it does not go in the summary.
- **Every date must appear in the source.** Never infer an effective date from
  context, and never convert "from Monday" into a specific date — write what the
  email said.
- **Never carry a number across items.** If two lenders both moved rates, the risk
  is attaching one lender's figure to the other. Re-check each against its own
  message.

When a figure does not survive that check, **drop the number, keep the item**. Write
the headline and summary without the specific ("CBA — variable rates changed, see
the announcement") and let the source link carry the detail. A vaguer true item is
worth more than a precise wrong one.

Do not report this checking in the digest or the chat summary. It is a quality gate,
not a feature.

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

**Every `{{PLACEHOLDER}}` must be replaced or its element deleted.** A literal
`{{BROKER_NAME}}` rendered in the header is the single most visible way this skill
can look broken, and it is the first thing the broker sees.

Delete the template's instructional HTML comments as you go — the "HOW TO USE THIS
TEMPLATE" block at the top, the item-template comment, the quiet-week comment. They
are notes to you, not content, and the first of them contains the literal text
`{{PLACEHOLDERS}}`. Keep the one comment that says not to remove the colophon.

Then search the finished file for `{{` — if anything remains, fix it. The full set:

| Placeholder | Fill with |
|---|---|
| `{{WEEK_RANGE}}` | e.g. `21–27 July 2026` |
| `{{GENERATED_DATE}}` | the date you ran |
| `{{BROKER_NAME}}` | the broker's name from the prompt (**not** their email address) |
| `{{ISSUE_NUMBER}}` | see below — appears twice, header and colophon |
| `{{TOP_ITEM_1..3}}` | the 2–3 biggest items; **delete any unused `<li>`** rather than leaving it empty |
| `{{N}}` | item count for that category |
| `{{SUBJECT}}` `{{ONE_LINE_SUMMARY}}` `{{PRIMARY_SOURCE_URL}}` `{{EMAIL_URL}}` `{{SOURCE_NAME}}` `{{DATE}}` `{{EFFECTIVE_DATE}}` | per item, per the template's item comment |
| `{{PUBLIC_URL}}` | the Drive URL — or delete the whole `.openbar` block (Step 7) |
| `{{SEEN}}` `{{NEXT_BRIEFING_DATE}}` | quiet-week block only |
| `{{IMPACT_LINE}}` `{{IMPACT_SOURCE_URL}}` `{{IMPACT_SOURCE_LABEL}}` | commission/clawback item — or delete the whole `.impact` block (Step 6a) |
| `{{DROPPED_COUNT}}` `{{TIDY_SEARCH_URL}}` `{{TIDY_SEARCH_QUERY}}` | tidy-up block — or delete the whole `.tidy` block (Step 6b) |

The `.impact` and `.tidy` blocks are **optional and conditional**: unlike a category
section, leaving one in with its placeholders unfilled is not merely untidy, it
publishes a broken advert and a dead search link. When in doubt, delete the block.

**The issue number.** A scheduled run is a fresh session with no memory of last
week, so you cannot know the sequence number by reasoning about it. Derive it from
the date instead: **the ISO week number of the briefing week**, so the same week
always produces the same issue number no matter how often it is re-run. Write it
plainly (`2026-W31`). Do not guess an incrementing counter, and do not write "Issue
1" every week — a briefing that is permanently issue 1 tells the broker the thing is
not really running.

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
`class="wordmark"` element, the `utm_source=broker-briefing` parameter, the
`class="feedback"` line, and a closing `</footer>`. If any is missing, rebuild the
page from the template rather than patching it.

### Step 6a — "What this does to your book" (only when the week earns it)

The template has an `.impact` block just above the colophon. It exists to solve a
specific problem: the colophon ends the page with a link about commissions, and on a
digest full of rate changes that reads as an advert rather than a next step.

**Include the block only when the week genuinely contained a commission, clawback,
trail or remuneration change.** These arrive via aggregators and licensees and are
already a KEEP category. When one is present:

- Keep the item in its category section as normal.
- Additionally, fill `{{IMPACT_LINE}}` with one plain sentence on what it means for
  the broker's income — the change and its direction. "Your aggregator is moving
  clawback from 24 to 18 months from 1 September, which shortens the window where a
  refinance costs you the upfront."
- Fill `{{IMPACT_SOURCE_URL}}` and `{{IMPACT_SOURCE_LABEL}}` with the same source
  link the item carries.

**When no such item exists, delete the whole `.impact` block.** Do not stretch a rate
change or a service update into a commission story to create the bridge, and do not
write a generic line about commissions in general. A manufactured impact line is
worse than no block: it is the exact advert-in-disguise the block exists to avoid,
and a broker spots it immediately.

One block, one item. If two commission changes landed, take the one with the larger
effect on income and leave the other in its category.

### Step 6b — The "tidy up" block (optional, and it never touches their mail)

Brokers often ask whether the briefing can clear deal traffic out of their inbox. It
cannot and must not — Gmail is read-only here, see "Before you start". But the want
is reasonable, so the template offers the outcome without the write: a search **they**
run, and a filter recipe **they** apply, in their own Gmail.

Fill `{{DROPPED_COUNT}}` with how many messages you classified DROP this run, and
build `{{TIDY_SEARCH_QUERY}}` from the deal vocabulary you actually excluded, scoped
to the same window — for example:

`newer_than:7d subject:(approval OR approved OR valuation OR settlement OR settled OR "pre-approval" OR discharge OR payout OR "loan application")`

Then `{{TIDY_SEARCH_URL}}` is `https://mail.google.com/mail/u/0/#search/` followed by
that query, URL-encoded.

Two rules. **Never include a client name, a borrower name, an address or a loan
number in the query** — it is a link that may be shared or screenshotted, and the
whole point is that named-borrower material never leaves their mailbox. Keep it to
generic deal vocabulary. And **delete the block entirely if nothing was dropped**, or
if the count is trivially small; a tidy-up prompt for two emails is noise.

If a broker asks you directly to move, label or archive the mail, say plainly that
this plugin does not modify their mailbox by design, and point them at this block.

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

**Never end a run without delivering something.** The artifact path depends on tools
that are not guaranteed to be present in every session type. If
`mcp__remote-devices__create_artifact` is unavailable or errors, fall back in this
order, and take the first that works:

1. `SendUserFile` with the HTML — the broker gets the file in the conversation.
2. Upload to Drive if connected, and give them the URL.
3. Failing both, put the briefing's headlines directly in your chat reply as plain
   text with the links inline.

Then say in one line which path you used and why, so the broker knows the delivery
was degraded rather than wondering where their page went. A run that did all the
work and then silently produced no output is the worst possible outcome: it burns
their usage, tells them nothing, and looks exactly like the plugin not working.

**Why no email.** Three reasons, in order of durability:

1. **We do not write to the broker's mailbox.** Read-only is the design (see "Before
   you start") and it is the promise made on the marketing site, in the setup guide,
   in the setup email and in both READMEs. Drafting is a write.
2. **A self-addressed message is a worse artifact than an artifact.** It has to inline
   the entire briefing because there is usually no URL to link to, and it does not
   update in place — week eleven is the eleventh copy. The Cowork artifact is one
   pinned location that refreshes, which is what "waiting for you Monday morning"
   actually needs to mean.
3. **A draft lands in Drafts, which nobody opens.** It is not in the inbox and it is
   not waiting anywhere the broker looks.

Note the reason that is deliberately **not** on that list: "the Gmail connector can
only draft, never send." That was the original justification and it is a fact about
Gmail rather than a reason. The Microsoft 365 connector holds `Mail.Send`, so on any
Outlook variant that argument evaporates and the invariant looks arbitrary — which is
how a well-meaning change reintroduces it. The three reasons above hold on every
transport. See `references/transport-m365.md`.

Gmail is still required, but for **reading** the source email, not delivery.

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

**A thin prompt carrying configuration only.** A scheduled run starts fresh with no
memory, so the trigger's `prompt` must carry what exists nowhere else: the version
stamp, the instruction to run this skill, the broker's name (for `{{BROKER_NAME}}`),
their sender list, timezone and lookback window. Build it from
`assets/kickoff-prompt.md` ("Scheduled-task version") and set `notifications` to
`{push:true}`.

**Do not restate the method in the prompt.** Not the categories, not the delivery
rules, not the link formats, not the Trash retry. It is tempting — the prompt reads
as if it should be self-sufficient — but a stored prompt is frozen at creation while
this file is not, so every rule copied into it becomes a stale duplicate that
contradicts the skill within a release or two. That is precisely what happened: four
consecutive releases each required every existing broker to hand-edit their task,
because the task was carrying its own out-of-date copy of the method.

The division is: **method lives here and syncs; configuration lives in the prompt
because it is the broker's, not ours.** The only deliberate exceptions are the two
safety lines in the prompt template — never read client mail to triage senders,
never write to the mailbox — which are duplicated because their failure mode is
unacceptable rather than merely untidy, and a thin prompt must fail closed if the
skill does not load.

**Keep the version-stamp line.** Both scheduled prompts open with
`# valutten-broker-briefing prompt v<version> — keep this line`. Never strip it when
filling in the placeholders. A stored trigger prompt is a copy frozen at creation
time, and this line is the only way anyone can tell how old that copy is — see
"Refresh an existing schedule" below.

After creating it, tell the broker the schedule in plain language ("every Monday
at 7am Brisbane time") and that they can ask you to change or pause it anytime.

## Refresh an existing schedule (when the plugin has been updated)

Use this when the broker says "update my briefing", "refresh my schedule", "is my
briefing up to date", or after they install a new version of the plugin.

Publishing a new plugin version does **not** update tasks that already exist. Each
scheduled task stores the prompt it was created with, verbatim and forever. So after
an upgrade the broker can have a current skill and a stale prompt, which fails in
quiet ways: a renamed skill that no longer resolves, a delivery instruction that
contradicts the skill, a privacy guard the old prompt never had.

Rebuild the prompt rather than asking the broker to re-do setup — the sender list
they calibrated is the expensive part, and it is already sitting in the old prompt.

1. **List their tasks** and find the briefing ones (the weekly Monday one, and the
   quarterly recalibration one if it exists).
2. **Read each task's stored prompt.** Check line one for
   `# valutten-broker-briefing prompt v<version>`. If it matches the installed
   plugin version, that task is current — say so and leave it alone. If it is older
   or the line is missing entirely, it needs rebuilding.
3. **Lift the broker-specific values out of the old prompt** — the sender list, the
   broker's name, their timezone, and any lookback they customised. These are the
   only things worth keeping. Do not carry across any of the surrounding
   instructions: those are what you are replacing.
4. **Rebuild from the current template** in `assets/kickoff-prompt.md`, dropping
   those values into the placeholders, with the stamp set to the installed version.
5. **Update the task's prompt in place** if the Remote MCP surface exposes an update
   tool; if it only exposes create and delete, record the existing cron expression
   and notification settings first, create the replacement, and delete the old one
   only once the new task exists. Either way the cron and notifications must come
   out identical — the broker chose that delivery time, and silently moving it is a
   worse bug than the one you are fixing. Never delete first: a failed create leaves
   them with no briefing at all and no record of when it used to run.
6. **Tell them what actually changed** in one or two lines, in plain terms ("your
   Monday briefing was still set up to email you a draft; it now just opens the
   page"). Do not paste the diff.

If the sender list cannot be recovered from the old prompt — the task was deleted,
or the prompt was hand-edited into something unparseable — say so plainly and offer
to run Setup mode (Step 0) again. Do not guess at a sender list, and do not
reconstruct one by scanning the inbox without telling them: that is a fresh read of
their mailbox and they should know it is happening.

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
- **Placeholders left unfilled.** The kickoff prompts mark their blanks with double
  angle brackets. If the pasted prompt still contains anything of the form
  `<<...>>` — `<<paste sender addresses / domains here>>`, `<<broker's name>>`,
  `<<e.g. Australia/Brisbane>>` — do not guess and do not proceed. Ask for the real
  values. In an **unattended** run there is nobody to ask, so say clearly in the
  output that the schedule was created with placeholders still in it and needs
  fixing, rather than briefing on a sender list that is literally the word "paste".
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
  **But never report a quiet week without first re-running the empty senders with
  `in:anywhere`** (Step 2). A genuine quiet week and a filter quietly trashing every
  lender bulletin look identical from inside the inbox, and only one of them is
  worth telling the broker about. If *every* configured sender came back empty,
  treat that as a fault to investigate — a whole sender list going silent in the
  same week is far more likely to be a connector, account or filter problem than a
  real lull.
- **Huge volume:** if a sender floods the inbox, summarise at the theme level and
  link representative emails rather than making 40 near-identical cards.
