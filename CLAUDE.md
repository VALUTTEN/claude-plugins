# VALUTTEN Plugins — working notes

Marketplace repo for VALUTTEN's Claude/Cowork plugins for Australian mortgage brokers.

> **This repository is PUBLIC.** Everything here is readable by anyone. Do not add customer
> data, credentials, internal funnel or pricing strategy, analytics IDs, or anything you would
> not put on the website.

---

## 1. Layout

```
.claude-plugin/marketplace.json          # the catalogue
plugins/<plugin>/.claude-plugin/plugin.json
plugins/<plugin>/skills/<skill>/SKILL.md
plugins/<plugin>/skills/<skill>/assets/  · references/
```

`metadata.pluginRoot` is `./plugins`, so a new plugin is a drop-in: create
`plugins/<name>/`, add an entry to `marketplace.json`, push to `main`.

## 2. Releasing

**Bump `version` in BOTH `plugins/<name>/.claude-plugin/plugin.json` and the matching
marketplace entry. They must agree.** A mismatch resolves installs to a version that is not
what ships, and it fails silently.

Push to `main`. Anyone who added the marketplace with **Sync automatically** on picks it up on
their next refresh, with nothing to re-send. To rename or retire a plugin use the
marketplace-level `renames` map so existing installs migrate instead of breaking.

`name` fields are public-facing (`<plugin>@valutten-plugins`) and must be kebab-case. Check the
reserved-name list in the Anthropic marketplace docs before choosing a marketplace name.

## 3. Install path (verified 2026-07-23)

**Customize (left sidebar) → Plugins → Personal plugins `+` → Add marketplace → Add from a
repository → `VALUTTEN/claude-plugins`.**

There is no Cowork *tab*: Cowork is a mode toggle in the message box, and skills that read email
need Cowork mode rather than Chat. This UI has already changed once mid-build, which is why the
README points at `valutten.com/broker-briefing` instead of repeating steps here. **Keep it that
way** — one canonical place means the next UI change is a one-file fix.

## 4. Client data boundary — the rule that outranks everything else

These skills run against a mortgage broker's mailbox, which is full of their clients'
personal information. Everything a skill reads is sent to Anthropic for inference, in the
United States. Brokers have their own privacy obligations, and their aggregator or licensee
almost always has an AI policy on top.

**Read the minimum needed, and never read client mail in order to decide it is client mail.**

- Sender discovery uses address, domain and message count only. No subject lines, no
  snippets, no bodies, no opening messages. Subject lines carry client names
  ("Unconditional approval — Smith"), which is exactly how this was got wrong once already.
- **Enforce that with `view: THREAD_VIEW_METADATA_ONLY`, not with instructions.** Gmail's
  default view returns subject and snippet for every message, so an instruction not to read
  them arrives after the data is already in context — an honour system, and unauditable.
  The metadata view returns sender/date/labels only, so the client data is never exposed at
  all. Verified against a real mailbox 2026-08-08. Any transport we add later needs the
  equivalent projection before it ships; see `references/transport-m365.md`.
- Any keyword or topic search must carry negative terms excluding deal traffic (approval,
  valuation, settlement, discharge, payout, loan application).
- Anything **about** one named borrower is dropped on sight, never summarised and never
  quoted. An industry item that merely *mentions* a client in passing (a rate sheet ending
  "congratulations on the Smith settlement") keeps its industry substance and discards the
  client reference completely — the blanket version of this rule was throwing away whole
  lender rate sheets over a courtesy line. When it is unclear which kind you have, drop it.
  The output guarantee is unchanged either way: no borrower name, address or loan number
  ever reaches the digest.
- Nothing is ever transmitted to VALUTTEN. Output exists only in the broker's own account.

**Never write reassurance copy that is true of the output but false of the scan.** "Client
email is excluded from the briefing" was accurate about what appeared in the digest while
the discovery scan was reading client subject lines. That distinction is the first thing a
compliance officer will pull on.

If a change would improve the output by reading more client email, the answer is no.

## 5. Invariants — do not "fix" these

Each of these looks like a bug and is not. All were established by observing a real run.

1. **The digest masthead is a text wordmark, not the logo image.** The Cowork artifact viewer
   blocks external images, so the logo JPG renders as a broken-image glyph exactly where brokers
   read the briefing. Websites use the real logo; artifacts must not.
2. **No email is sent or drafted.** Delivery is a Cowork artifact plus a push notification.
   Mail is READ only. The reasons that hold on any transport: we never write to the broker's
   mailbox (it is the promise made in five places); a self-addressed message must inline the
   whole briefing and cannot update in place, so week eleven is the eleventh copy, whereas the
   artifact is one pinned thing that refreshes; and a draft sits in Drafts where nobody looks.
   Do **not** justify this with "the connector can only draft, never send" — that was the
   original argument, it is a fact about Gmail rather than a reason, and it is false on
   Microsoft 365 where the connector holds `Mail.Send`. An invariant defended by an argument
   that expires gets overturned the moment someone notices.
3. **Never route briefing content through VALUTTEN infrastructure.** It derives from the broker's
   own lender correspondence and must not leave their account. This is the product's core promise.
4. **The `.openbar` "Open in your browser" block only ships when a real URL exists** (e.g. an
   upload to the broker's own Drive). A button inside an artifact cannot open the artifact.
   Delete the block rather than ship a dead link.
5. **The masthead and colophon in `digest-template.html` are load-bearing** and must be
   reproduced verbatim in every rendered digest. They are how the briefing is attributed back to
   VALUTTEN; a digest without them is a defect even if the content is perfect.
6. **The `.impact` ("What this does to your book") block is conditional, and its absence is
   correct.** It appears only when the week actually contained a commission, clawback or
   remuneration change. It exists so the colophon's commissions link follows from something on
   the page instead of reading as an advert. Do not make it unconditional, and never let a run
   manufacture a money angle to fill it — a stretched impact line is worse than no block,
   because it is exactly the advert-in-disguise the block was added to remove.
7. **The `.tidy` block hands the broker a search, never an action.** Brokers ask for the
   briefing to file or clear their deal email; the answer is a Gmail search link and a filter
   recipe they apply themselves. Gmail is read-only (see §4) — a misclassification under a
   read-only design is one dull line in a digest, and under a write-enabled one it is a client's
   approval archived out of a broker's inbox. Also: never put a client name, address or loan
   number in that search query. It is a link that gets screenshotted.
8. **Scheduled-task prompts carry configuration, never method.** A stored trigger prompt is
   frozen at creation; the skill is not. So anything restated in the prompt — categories,
   delivery rules, link formats, retries — becomes a stale duplicate that contradicts the
   skill within a release or two, and every improvement then requires every broker to
   hand-edit their task. That happened four releases running. Method lives in SKILL.md and
   syncs; only the broker's own settings (name, senders, timezone, window) belong in the
   prompt, because they exist nowhere else. The two safety lines in the prompt template are
   a deliberate exception: a thin prompt must fail closed if the skill does not load, and
   the failure modes there — reading client mail to triage senders, writing to the mailbox
   — are unacceptable rather than merely untidy.
9. **The colophon feedback line is deliberately on every issue, not just the second.** A
   scheduled run starts fresh and cannot know which week it is, so any "show this on issue 2"
   logic would be guesswork. It is also the only feedback channel that exists: nothing about a
   run is reported to VALUTTEN by design, so a broker who stops reading is invisible unless they
   write in.

## 6. Verifying changes

Templates are HTML with `{{PLACEHOLDER}}` slots, so a typecheck proves nothing. **Render the
page and look at it.** Serve the assets directory over localhost and open it; `file://` will not
load in some tooling.

```bash
cd plugins/<plugin>/skills/<skill>/assets && python3 -m http.server 8000 --bind 127.0.0.1
```

Check the masthead renders, the colophon link survives with its query parameters intact, and the
quiet-week state still looks deliberate. A digest that renders without branding is a silent
failure, not a cosmetic one.

To test an install end to end, add the marketplace from a local clone, install, and reload:

```
/plugin marketplace add ./valutten-claude-plugins
/plugin install <name>@valutten-plugins
/reload-plugins
```

Remove the local marketplace afterwards: each marketplace name registers once per user, and
re-adding replaces the earlier entry.

## 7. Writing skills for non-technical brokers

The audience is a mortgage broker who has never installed a plugin. Two failure modes recur:

- **Silence reads as breakage.** A long scan with no output looks frozen. Say up front that it
  will be quiet for a few minutes.
- **Approval prompts stall everything.** Scheduled-task creation asks permission and waits
  indefinitely. Tell the user a button is coming and that they must click it.

Never ask a broker to list their lenders from memory. Discover senders from their inbox and let
them tick what belongs.
