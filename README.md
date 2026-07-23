# VALUTTEN Plugins

Plugins for Australian mortgage brokers, built by [VALUTTEN](https://valutten.com).

## VALUTTEN Broker Briefing

A weekly Monday intelligence briefing built from your own inbox, so the policy and
rate changes that matter do not get buried under client and deal traffic.

Once a week it scans a set of senders you choose (banks and lenders, your aggregator
or licensee, industry media, event organisers), keeps only the industry signal, and
deliberately excludes client and deal-specific email. Nothing about a named borrower
appears in it.

You get an interactive HTML digest grouped by theme, where every item links back to
the original email and to the source document, plus a copy saved as a draft in your
own Gmail ready for Monday morning.

The briefing runs entirely inside your own Claude account, against your own mailbox.
None of its contents are sent to VALUTTEN.

### Get set up

**→ [valutten.com/broker-briefing](https://valutten.com/broker-briefing)**

That page walks through the whole thing: what you need, the install, and the
first-run prompt that calibrates the briefing against your inbox. It takes about
five minutes, once. It is free, and there is no VALUTTEN account to create.

You will need the Claude desktop app on any paid plan, and the Gmail or Google
Workspace account your lender and aggregator email lands in.

---

## For maintainers

This repository is the marketplace catalogue. Layout follows the documented
`.claude-plugin` convention:

```
.claude-plugin/marketplace.json      # the catalogue
plugins/<plugin>/.claude-plugin/plugin.json
plugins/<plugin>/skills/...
```

### Releasing an update

Bump `version` in **both** `plugins/<plugin>/.claude-plugin/plugin.json` and the
matching entry in `.claude-plugin/marketplace.json`. The two must always agree, or
installs will resolve to a version that does not match what ships.

Then push to `main`. Anyone who added the marketplace with **Sync automatically**
enabled picks the change up on their next refresh, with nothing to re-send.

To rename or retire a plugin, use the marketplace-level `renames` map so existing
installs migrate instead of silently breaking.
