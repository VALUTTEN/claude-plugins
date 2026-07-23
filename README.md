# VALUTTEN Plugins

Plugins for Australian mortgage brokers, built by [VALUTTEN](https://valutten.com).

## Install

You need the Claude desktop app on any paid plan (Pro, Max, Team or Enterprise).
No account with us and no sign-in is required.

1. Open the Claude desktop app, open **Cowork**, then **Customize** in the left sidebar, then the **Plugins** tab.
2. Under **Personal plugins**, click **+**, choose **Add marketplace**, then **Add from a repository**.
3. Enter `VALUTTEN/claude-plugins`.
4. Find the plugin you want and click **Install**.

Updates arrive on their own once you have added the marketplace.

## Plugins

### VALUTTEN Broker Briefing

A weekly Monday intelligence briefing built from your own inbox, so the policy and
rate changes that matter do not get buried under client and deal traffic.

Once a week it scans a set of senders you choose (banks and lenders, your aggregator
or licensee, industry media, event organisers), keeps only the industry signal, and
deliberately excludes client and deal-specific email. Nothing about a named borrower
appears in it.

You get an interactive HTML digest grouped by theme, where every item links back to
the original email and to the source document, plus a briefing email drafted into
your own inbox ready for Monday morning.

**Getting started:** connect Google Workspace / Gmail in Cowork, then run the
first-time setup. It scans roughly the last 60 days, finds your real senders, and
lets you pick which belong in the briefing rather than guessing a list from memory.
It then sets up a recurring Monday task and a quarterly recalibration reminder.

Ready-to-paste prompts are in the plugin's `assets/kickoff-prompt.md`.

## Releasing an update

Bump `version` in **both** `plugins/<plugin>/.claude-plugin/plugin.json` and the
matching entry in `.claude-plugin/marketplace.json`. The two must always agree.
Then push to the default branch.
