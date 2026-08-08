# Transport mapping: Gmail → Microsoft 365 / Outlook

A design document, not an implementation. Nothing in the skill reads it yet. Its job is to
answer, ahead of time, every question the Outlook port will raise, so that the port is a
day of work rather than a week of discovering that Outlook is not Gmail with different
nouns.

Roughly a third of Australian mortgage brokers sit on Microsoft 365 rather than Google
Workspace, usually because their aggregator or licensee issues the mailbox. Today the
skill cannot serve them at all. The mapping below is mostly mechanical; the parts that are
not are the parts worth reading, and they are flagged.

Every factual claim about Microsoft Graph carries the documentation URL it came from.
Anything that could not be confirmed in Microsoft's own documentation is marked
**UNVERIFIED** and must be tested against a real mailbox before the port ships. Do not
quietly upgrade an UNVERIFIED line to a fact because it sounds right.

---

## 1. Search construct mapping

There are three candidate transports on the M365 side, and they are not interchangeable.

- **Graph `$filter`** — OData predicates over message properties. Evaluated against the
  store, not the search index. Exact, deterministic, no relevance ranking.
- **Graph `$search`** — Keyword Query Language (KQL) over the Exchange search index.
  Same query language brokers see in Outlook's own search box.
- **The Claude Microsoft 365 connector** — a wrapper (`outlook_email_search`) whose
  underlying Graph calls are not publicly documented. See §4 and §5.

| Gmail construct | Graph `$filter` | Graph `$search` (KQL) | Notes |
|---|---|---|---|
| `from:cba.com.au` (domain) | `$filter=endswith(from/emailAddress/address,'@cba.com.au')` | `$search="from:cba.com.au"` | Gmail's `from:` matches a bare domain. Neither M365 form does so cleanly: `$filter` needs `endswith` with an explicit `@`, and KQL `from:` matches SMTP address, display name **or** alias, which is looser than intended. |
| `from:broker@cba.com.au` (address) | `$filter=from/emailAddress/address eq 'broker@cba.com.au'` | `$search="from:broker@cba.com.au"` | Exact address is the one case where both are reliable. |
| `from:(a OR b OR c)` | `$filter=` … `or` … | `$search="from:a OR from:b"` | KQL `OR` must be uppercase and outside the quoted clause. |
| `newer_than:7d` | `$filter=receivedDateTime ge 2026-07-21T00:00:00Z` | `$search="received>=2026-07-21"` | **There is no relative-date operator.** The run must compute the absolute UTC boundary itself from the lookback window. |
| `subject:(rate OR policy)` | `$filter=contains(subject,'rate')` | `$search="subject:rate OR subject:policy"` | `contains()` on `subject` is supported but slow and, on large mailboxes, prone to `InefficientFilter`. Prefer KQL for subject text. |
| `-subject:(approval OR settlement)` | no clean equivalent | `$search="… NOT subject:approval NOT subject:settlement"` or `-subject:approval` | See the negation warning below. |
| `in:anywhere` | **no equivalent — see §2** | **no equivalent — see §2** | This is the important row. |

**Which is more reliable: `$filter` for the sender pass, `$search` for the topic pass.**

Pass A (the configured sender list) is a set of exact, known values over a known date
window. That is precisely what `$filter` is for, and `$filter` is deterministic: it either
matches the stored property or it does not, with no index freshness and no relevance
cutoff. Pass B is fuzzy text matching over subjects, which `$filter` does badly and KQL
does well.

That split runs straight into a hard constraint:

> **`$search` and `$filter` cannot be combined in the same request against message
> collections.** You get one or the other.
> ([Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/1401458/using-search-and-filter-parameters-for-messages-en);
> the reference page for
> [$search](https://learn.microsoft.com/en-us/graph/search-query-parameter) does not state
> this explicitly, so treat the exact error behaviour as **UNVERIFIED** even though the
> restriction itself is well attested.)

So the date window cannot be applied as a `$filter` on top of a KQL topic search. It has to
go *inside* the KQL string as `received>=<date>`, or be applied client-side after the fact.
Putting it inside the KQL string is better: it keeps the result set small, and `$search`
returns at most 1,000 results with no way to page beyond that
([search-query-parameter](https://learn.microsoft.com/en-us/graph/search-query-parameter)).
A busy broker mailbox can produce 1,000 hits for a loose subject query in a week, and the
truncation is silent — the same class of failure as §2.

**Negation is the weakest link.** The Gmail pass B relies on `-subject:(...)` to keep
client deal traffic out of the results, and that exclusion is a privacy control, not a
tuning knob (see the skill's client data boundary and CLAUDE.md §4). Exchange KQL supports
both `NOT` and a leading minus sign, with Boolean operators required in uppercase
([keyword queries and search
conditions](https://learn.microsoft.com/en-us/purview/ediscovery-keyword-queries-and-search-conditions)) —
but that reference documents the Purview eDiscovery dialect, and **whether Graph's
`$search` on `/me/messages` honours `NOT` and `-property:value` identically is
UNVERIFIED**. Microsoft's `$search` documentation only ever demonstrates `AND` and `OR`.

This must be tested first, against a real mailbox, before any other porting work. If
negation does not work in Graph `$search`, pass B cannot be run as a single query at all
and must instead be: fetch subject-matching candidates, then apply the exclusion terms
client-side before anything is read further. That is a materially different design, and it
is better to know on day one.

---

## 2. The Trash/Spam equivalence problem

SKILL.md Step 2 treats this as the skill's worst failure: Gmail search silently excludes
Spam and Trash, a broker has a forgotten filter auto-trashing lender bulletins, and the
briefing reports a confident "quiet week" while the rate change sits in Trash. It looks
exactly like a working run, and the broker has no way to tell.

M365 has the same failure and three additional ones.

### What is actually in scope

`GET /me/messages` returns "the messages in the signed-in user's mailbox **(including the
Deleted Items and Clutter folders)**"
([user-list-messages](https://learn.microsoft.com/en-us/graph/api/user-list-messages?view=graph-rest-1.0)).
So the single most dangerous Gmail behaviour — Trash being excluded by default — does
**not** apply to Graph. Deleted Items is included.

The documentation names Deleted Items and Clutter and stops there. It does **not** say
Junk Email is included. Junk Email is an ordinary well-known mail folder under
`msgfolderroot`
([mailFolder](https://learn.microsoft.com/en-us/graph/api/resources/mailfolder?view=graph-rest-1.0)),
so it very probably is in scope, but **this is UNVERIFIED** and it is the exact spot where
being wrong produces a false quiet week. Do not build on the assumption.

### The four M365 traps

1. **Junk Email.** Scope UNVERIFIED, as above. Behaviourally the same trap as Gmail's Spam.
2. **Clutter.** Documented as in scope for `/me/messages`, but it is a real folder on older
   tenants that quietly swallows low-priority bulk mail — which is precisely what a lender
   policy bulletin looks like to a relevance heuristic. **Gmail has no equivalent.**
3. **Focused vs Other.** This is *not* a folder. It is the `inferenceClassification`
   property on the message, valued `focused` or `other`
   ([message](https://learn.microsoft.com/en-us/graph/api/resources/message?view=graph-rest-1.0)).
   Both live in the Inbox, so Graph sees both and no retry is needed. It matters anyway,
   because the broker's mental model is wrong: they will say "I never get anything from
   that lender" while a year of bulletins sits in Other. Worth surfacing in the discovery
   output, not worth a retry. **Gmail's tabs are a loose analogue but do not hide mail from
   the API in the same way.**
4. **The online archive — the genuinely unsolvable one.** Microsoft states plainly: "The
   API does *not* support accessing in-place archive mailboxes, not on Exchange Online nor
   on Exchange Server"
   ([mail-api-overview](https://learn.microsoft.com/en-us/graph/api/resources/mail-api-overview?view=graph-rest-1.0)).
   Aggregator and licensee tenants very commonly apply a retention policy that moves mail
   older than 30, 60 or 90 days into the online archive. For a 7-day briefing window that
   is harmless. **For the 45–60 day discovery scan in Step 0, and the ~90 day
   recalibration scan, it is not** — a large slice of the sender history is simply
   invisible, and the sender list comes out wrong in a way nobody can see. There is no
   workaround within Graph; EWS is the only programmatic route and is out of scope. This
   must be disclosed to the broker, not worked around silently.

   Note also that the one-click **Archive** folder is a different thing entirely, is an
   ordinary well-known folder (`archive`), and is reachable.

5. **Quarantine.** Messages caught by anti-malware, Safe Attachments, or high-confidence
   phishing policies are held in a hosted quarantine store, not the mailbox, and for
   several verdict types "only admins can work with" them
   ([quarantine-about](https://learn.microsoft.com/en-us/defender-office-365/quarantine-about)).
   A delegated `Mail.Read` token cannot see them at all. Retention is 15–30 days, after
   which they are permanently deleted. A lender bulletin with a rate-sheet PDF attached is
   a realistic false positive. **Gmail has nothing equivalent — Gmail spam still lands in
   the mailbox.** Like the online archive, this is a disclosure, not a retry.

### The concrete retry a run must perform

Do not rely on the documented `/me/messages` scope. Make the retry explicit, because an
explicit folder query is cheap and being wrong is not.

Any configured sender that returns **zero** results over the window gets one retry that
queries each of these endpoints directly with the same date `$filter`:

```
GET /me/mailFolders/junkemail/messages?$filter=<same predicate>&$select=<metadata only>
GET /me/mailFolders/deleteditems/messages?$filter=<same predicate>&$select=<metadata only>
GET /me/mailFolders/archive/messages?$filter=<same predicate>&$select=<metadata only>
GET /me/mailFolders/recoverableitemsdeletions/messages?$filter=<same predicate>&$select=<metadata only>
```

Well-known folder names work regardless of the mailbox's locale
([mailFolder](https://learn.microsoft.com/en-us/graph/api/resources/mailfolder?view=graph-rest-1.0)),
which matters more than it sounds: a broker on a non-English tenant has a folder literally
named something else, and hardcoding "Deleted Items" would fail on exactly the mailboxes
nobody tests against.

`recoverableitemsdeletions` holds items deleted from Deleted Items or shift-deleted, and
is invisible in every Outlook client. Include it: a mail rule with a hard-delete action
puts bulletins there, and it is the closest thing to the "I have no idea where it went"
case that motivated the Gmail rule.

If the retry finds mail, use it, and **tell the broker in the chat-side summary which
senders were only found outside the Inbox and which folder they were in.** That is a rule
they probably want to fix, and it is information they cannot get any other way. Do not fold
the results in silently.

Same escalation as Gmail: if *every* configured sender comes back empty, treat it as a
fault to investigate — connector, wrong account, or tenant policy — not a quiet week.

---

## 3. Deep links to a single message

Gmail: `https://mail.google.com/mail/u/0/#all/<MESSAGE_ID>`, with the RFC822 header form
as fallback.

**For M365, do not construct the URL. Read it.** The `message` resource carries a
`webLink` property, described as "The URL to open the message in Outlook on the web… The
message opens in the browser if you are signed in to your mailbox via Outlook on the web"
([message](https://learn.microsoft.com/en-us/graph/api/resources/message?view=graph-rest-1.0)).
Request it explicitly — `$select=webLink` — because the privacy projection in §4 means the
run will never be fetching the default property set.

Two consequences of using `webLink` rather than a hand-built URL:

- It resolves the **host** correctly on its own. Work and school mailboxes live under
  `outlook.office.com`; personal Microsoft accounts under `outlook.live.com`. The
  hand-built deeplink forms circulating in the community
  (`https://outlook.office.com/mail/deeplink/read/<url-encoded id>`, and the older
  `outlook.office365.com/owa/?ItemID=…&exvsurl=1&viewmodel=ReadMessageItem`) are
  **UNVERIFIED** and have broken before —
  see [OfficeDev/office-js#1095](https://github.com/OfficeDev/office-js/issues/1095).
  Treat them as an emergency fallback only, and note that the Graph `id` contains
  characters that must be percent-encoded before it can go in a URL path.
- The host question is largely academic for this skill anyway: the Claude Microsoft 365
  connector requires a Microsoft Entra work or school tenant and explicitly does not
  support personal accounts
  ([setup guide](https://support.claude.com/en/articles/12542951-set-up-the-microsoft-365-connector)).
  A broker on `@outlook.com` cannot use the plugin at all. Say so plainly rather than
  letting them conclude it is broken.

**The identifier problem.** Graph message `id` values "might change after certain actions
such as copy or move"
([mail-api-overview](https://learn.microsoft.com/en-us/graph/api/resources/mail-api-overview?view=graph-rest-1.0)).
A broker who files a bulletin into a folder after reading Monday's briefing may break that
briefing's link. Sending `Prefer: IdType="ImmutableId"` yields an ID stable for the life of
the item within the mailbox
([outlook-immutable-id](https://learn.microsoft.com/en-us/graph/outlook-immutable-id)).
Send it. **Whether `webLink` returned alongside an immutable ID still resolves correctly is
UNVERIFIED** and needs a click test.

The `internetMessageId` property (RFC2822) is the direct analogue of Gmail's
`rfc822msgid:` fallback and is stable by construction, but there is no documented Outlook
Web URL that takes it. It is worth capturing as a durable identifier regardless — it is the
only ID that survives everything.

Unchanged from Gmail: when the email points at a real document or page, that is the primary
Source link and the message link is the secondary "· email". Every item still needs at
least one working link.

---

## 4. Sender-metadata-only discovery

Step 0.2 requires aggregating senders by address, domain and count **without** reading
subjects, snippets or bodies. CLAUDE.md §4 is explicit that this is a hard rule, not an
optimisation, and that it has already been got wrong once. The question for the port is
whether it can be made mechanically enforceable rather than a matter of the model
behaving.

**On raw Graph: yes, cleanly.**

```
GET /me/messages?$select=from,receivedDateTime&$top=1000
```

`$select` is a projection, and the server honours it. Microsoft's own example of
`$select=sender,subject` returns a response body containing only `id`, `sender`, `subject`
and the `@odata.etag`
([user-list-messages](https://learn.microsoft.com/en-us/graph/api/user-list-messages?view=graph-rest-1.0)).
So `$select=from,receivedDateTime` returns `from`, `receivedDateTime`, `id` and the etag —
**no `subject`, no `bodyPreview`, no `body`**. `bodyPreview` is defined as the first 255
characters of the body, and `internetMessageHeaders` requires `$select` to be returned at
all, so neither leaks by accident.

That is the property the rule needs: with this projection, subject lines are not merely
unread, they are never transmitted. The privacy guarantee becomes a property of the request
rather than a property of the run's self-discipline, which is the only version of it that
survives contact with a compliance officer.

Constraints to respect while doing it:

- Page with `@odata.nextLink`. Do not attempt to derive `$skip` yourself — Graph uses
  `$skip` to count items traversed, so it can exceed the page size even in the first
  response.
- `$top` may go to 1,000, and a large page with a slim `$select` is exactly the case
  Microsoft recommends `$select` for. A 60-day scan on a busy broker mailbox is several
  thousand messages; this is many requests, and the run will be quiet for a while. Say so
  up front — silence reads as breakage.
- Use `$filter=receivedDateTime ge <window start>` with `$orderby=receivedDateTime desc`,
  and note the ordering rule: properties in `$orderby` must also appear in `$filter`, in
  the same order, before any others, or the request fails with `InefficientFilter`
  ([user-list-messages](https://learn.microsoft.com/en-us/graph/api/user-list-messages?view=graph-rest-1.0)).
- Use `$filter`, not `$search`, for discovery. `$search` on messages caps at 1,000 results
  total, which would silently truncate a 60-day scan and skew the sender counts downward
  in exactly the invisible way this document keeps warning about.
- Do **not** add `subject` to the `$select` "just for the sender-picker UI". Step 0.4 is
  explicit that entries are not illustrated with subject lines even when it would make the
  list easier to judge. The projection is the enforcement; widening it removes the
  enforcement.

**On the Claude Microsoft 365 connector: no, and this is the largest single risk in the
port.**

The connector exposes `outlook_email_search`, described only as accessing "mail with
sender/date filters"
([security guide](https://support.claude.com/en/articles/12684923-microsoft-365-connector-security-guide)).
Its parameters, its underlying Graph calls, and — critically — the fields it returns are
not publicly documented. If it returns subjects or snippets, as an email search tool almost
certainly does, then **the metadata-only rule cannot be enforced at all through the
connector**: the subject lines arrive in context whether or not the run wants them, and by
then client information has already left the broker's mailbox. That is the precise failure
CLAUDE.md §4 records as having happened once already.

Least-exposing alternative, in order of preference:

1. **Raw Graph with an explicit `$select`.** The only option that makes the rule
   mechanical. Requires an authenticated Graph path — a scoped MCP server or equivalent —
   rather than the shipped connector, which is real additional work and should be costed
   into the port from the start rather than discovered halfway through.
2. **If the connector must be used**, first establish empirically what
   `outlook_email_search` returns. If it returns subjects, Step 0 cannot be ported as
   specified. Do not port it in a weakened form. Instead fall back to the broker naming
   their senders and confirming a domain list — worse output, but it does not read a single
   client subject line. The skill already refuses to trade client email for better output;
   discovery is the case that rule was written for.
3. Never: run discovery through the connector and rely on the model to ignore the subjects
   it was handed. Not reading something you have already been sent is not a privacy
   control.

---

## 5. Auth, connectors and what can block a broker

SKILL.md's "Handling problems gracefully" documents the Gmail case: aggregators and
licensees allowlist which third-party apps may touch company mail, and when the connector
is absent that is almost always why. Retrying does not help; their IT or licensee has to
approve it.

The M365 analogue is the same shape and, if anything, a harder gate.

- **Tenant-wide admin consent is mandatory and cannot be self-served.** "A Microsoft Entra
  Global Administrator must complete a one-time consent process before anyone in the tenant
  can connect"
  ([security guide](https://support.claude.com/en/articles/12684923-microsoft-365-connector-security-guide)).
  This holds on every plan including Free and Pro — an individual broker cannot click
  through it, no matter what they are willing to approve for their own mailbox.
- **Entra user-consent settings can block it before that.** A Privileged Administrator can
  disable user consent entirely, or restrict it to verified publishers and low-impact
  permissions; where the admin consent workflow is enabled the broker sees an "Approval
  required" screen and can submit a request
  ([user and admin consent
  overview](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/user-admin-consent-overview)).
  Reading `Mail.Read` across a mailbox is not a low-impact permission by any classification.
- **Team and Enterprise Claude plans add a second gate**: an organisation Owner must enable
  the connector, on top of the Entra consent.
- **Conditional access applies.** MFA, device compliance, IP restrictions and group-based
  access all sit in front of the token, and tokens expire after 90 days of inactivity by
  default. A weekly scheduled run keeps the token warm; a broker who pauses their schedule
  for a quarter will need to reconnect.
- **Personal Microsoft accounts are not supported** — `outlook.com`, `hotmail.com`,
  `live.com`. There is no workaround.

What to say to a broker, in one plain sentence each, without letting them conclude they did
something wrong: this needs a one-time approval from whoever administers their Microsoft
365 — usually the aggregator's or licensee's IT — and there is a built-in request button if
their organisation has that turned on.

**One scope note that matters for the read-only promise.** The connector's requested
permission set includes `Mail.Send`, `Mail.ReadWrite` and `MailboxSettings.ReadWrite`
([security guide](https://support.claude.com/en/articles/12684923-microsoft-365-connector-security-guide)).
The skill's rule is unchanged and unconditional — search and read, nothing else, no labels,
no categories, no moving, no marking read, no drafts — but on M365 that rule is now the
*only* thing standing between the plugin and a mailbox it is technically permitted to
write to. Under Gmail the connector's inability to send was a backstop. Here there is no
backstop. Restate the rule in the Outlook variant of the skill at least as forcefully as
the Gmail one, and prefer a tenant consent that covers read scopes only where the broker's
admin will grant it.

---

## 6. What changes in SKILL.md when we build this

The claim under test was that classification, summarisation, template assembly and delivery
are all transport-agnostic. **Three of the four hold. Delivery does not.** Details below.

### Transport-agnostic — reuse verbatim

- **Step 3, classification.** `references/classification.md` contains no transport
  reference of any kind — it reasons entirely about content. It ports unchanged. So does
  the KEEP/DROP summary in SKILL.md Step 3 and the `tests/fixtures/mailbox.json` regression
  fixture, whose records are already abstract (`from`, `from_domain`, `subject`).
- **Step 4, summarisation.** The six categories, the one-line-per-item discipline, and the
  ISO-week issue number are all transport-free.
- **Step 6, template assembly.** `digest-template.html` contains no Gmail reference. The
  placeholder set is already neutral — note that `{{EMAIL_URL}}`, not `{{GMAIL_URL}}`, was
  the right call and needs no change. The masthead and colophon invariants apply
  identically.
- **Scheduling, refresh and recalibration.** Cron, UTC conversion, the version-stamp line,
  the permission-priming step. All transport-free — with the exception noted below.
- **The client data boundary section itself.** The principle is unchanged; only the
  mechanism in §4 above changes.

### Transport-specific — must be rewritten

- **The `description` frontmatter**, which names "Gmail/Google Workspace inbox".
- **"Before you start" item 1** — connector name, and the read-only rule needs the
  strengthening described in §5.
- **Step 0.2**, the broad scan — replace with the `$select` projection from §4, which is a
  genuine improvement in enforceability rather than a like-for-like swap.
- **Step 2 entirely** — both passes, the merge, and the `in:anywhere` retry, which becomes
  the four-folder retry in §2.
- **Step 5's second bullet** — the Gmail URL construction becomes `webLink`. The first
  bullet, preferring a real document or page, is agnostic and stays.
- **"Handling problems gracefully"** — the Gmail-connector-blocked and wrong-Google-account
  entries become their Entra equivalents from §5. The wrong-account symptom is identical
  and worth keeping: if discovery finds almost no lender or aggregator senders, suspect the
  wrong mailbox before concluding the inbox is quiet.

### More Gmail-coupled than it looks

Four places where the coupling is not where you would look for it:

1. **`assets/kickoff-prompt.md` embeds Gmail syntax in the scheduled-task prompt** —
   `https://mail.google.com/mail/u/0/#all/<MESSAGE_ID>` and the `in:anywhere` retry
   instruction, both spelled out in the prompt body. Because a scheduled task stores its
   prompt frozen at creation time, every broker who has ever set up a schedule is carrying
   Gmail instructions that no plugin update will change. The Outlook variant needs its own
   prompt file, and the "Refresh an existing schedule" flow needs to recognise a
   Gmail-shaped stored prompt on a mailbox that is no longer Gmail.

2. **"Why no email" rests on a Gmail-specific fact that is false on M365.** SKILL.md argues
   no email is drafted or sent because "the Gmail connector can only create drafts, never
   send". The M365 connector holds `Mail.Send`. The argument does not survive the port —
   but CLAUDE.md invariant 2 must. Re-justify it on the grounds that actually generalise:
   a self-addressed message is a worse artifact than a pinned artifact, it needs the whole
   briefing inlined because there is no URL, and the skill does not write to the broker's
   mailbox. Someone will otherwise "fix" this in six months with an entirely reasonable
   argument, and CLAUDE.md §5 exists precisely to stop that.

3. **Delivery is not as agnostic as it looks.** The artifact-plus-push path is transport
   free. The Drive upload that produces `{{PUBLIC_URL}}` is not: the M365 equivalent is
   OneDrive or SharePoint, which needs `Files.ReadWrite.All` — a **write** scope requiring
   a separate round of admin consent and a separate organisational toggle
   ([connector docs](https://claude.com/docs/connectors/microsoft/365)). Expect the common
   M365 case to be a read-only tenant consent with no upload target, which means the
   `.openbar` block gets deleted (invariant 4) far more often than under Gmail. That is
   correct behaviour, not a regression, and the fallback chain in Step 7 already handles
   it — but do not promise brokers a shareable URL in the Outlook copy.

4. **The 45–60 day discovery window quietly assumes the mail is still in the mailbox.**
   Under Gmail it always is. Under M365, a tenant retention policy may have moved most of
   it to the online archive, which Graph cannot read at all (§2). The window is not the
   problem; the assumption underneath it is. The Outlook variant of Step 0 must tell the
   broker what it could not see, rather than presenting a sender list that looks complete.

### Structure

Given the above, the port is a **sibling skill** — `weekly-broker-briefing-outlook` — not a
branch inside the existing one. Steps 0, 2 and 5 differ substantially, the connector and
consent story differs entirely, and the kickoff prompts have to be separate files anyway.
Sharing `references/classification.md` and `assets/digest-template.html` across both is the
right seam: those are the parts that carry the product's judgement and its branding, and
they must not fork.
