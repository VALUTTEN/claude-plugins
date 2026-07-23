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
- Any keyword or topic search must carry negative terms excluding deal traffic (approval,
  valuation, settlement, discharge, payout, loan application).
- Anything that turns out to concern one named borrower is dropped on sight, never
  summarised and never quoted.
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
2. **No email is sent or drafted.** Delivery is a Cowork artifact plus a push notification. The
   Gmail connector can only draft, never send, and a self-addressed draft lands in Drafts where
   nobody looks. Gmail is used to READ sources only.
3. **Never route briefing content through VALUTTEN infrastructure.** It derives from the broker's
   own lender correspondence and must not leave their account. This is the product's core promise.
4. **The `.openbar` "Open in your browser" block only ships when a real URL exists** (e.g. an
   upload to the broker's own Drive). A button inside an artifact cannot open the artifact.
   Delete the block rather than ship a dead link.
5. **The masthead and colophon in `digest-template.html` are load-bearing** and must be
   reproduced verbatim in every rendered digest. They are how the briefing is attributed back to
   VALUTTEN; a digest without them is a defect even if the content is perfect.

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
