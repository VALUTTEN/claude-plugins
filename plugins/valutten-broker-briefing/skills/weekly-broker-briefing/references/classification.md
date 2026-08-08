# Classification: signal vs. noise

The single most important job of this skill is deciding what to KEEP and what to
DROP. Get this wrong in the "keep too much" direction and the briefing becomes the
same overwhelming inbox the broker was trying to escape. Get it wrong in the "drop
too much" direction and they miss a policy change that costs them a deal. This
file is the reference for making that call well.

## The core distinction

Ask one question of every email:

> **Does this matter to the broker's whole business and how they operate — or
> only to one specific client's file?**

- Matters to the business / the industry / how they work, price, advise, or where
  they show up → **KEEP**.
- Only matters because it's about one named borrower, one application, one
  property, one settlement → **DROP**.

Everything below is elaboration on that one question.

## KEEP — industry & policy signal

### Interest-rate changes
Lender rate announcements of any kind: variable rate moves, new/changed fixed
rates, special/promotional pricing, cashback offers, rate-lock fee changes,
construction/bridging pricing, commercial or asset-finance rate changes.
Repricing notifications that apply to a product or the whole book (not a single
client's repricing request).

**The RBA itself is not a rate change.** An RBA cash rate decision — moved or held —
goes under **Regulatory & Government**: it is a policy decision by a public
authority, and on its own it changes nothing about how the broker prices a loan. A
*lender* moving its rates, whether or not it cites the RBA, is a **Rate Change**.
Industry *commentary* about what the RBA might do next is **Industry News &
Events**.

The distinction matters because a decision to hold would otherwise land under "Rate
Changes" as an item where nothing changed, which is the one place a broker expects
every line to be actionable. This was ambiguous until an eval run split on it.

### Credit & lending policy changes
Serviceability/assessment-rate changes, borrowing-capacity or buffer changes,
maximum LVR changes, LMI policy, acceptable income types (e.g. treatment of
bonuses, overtime, self-employed, casual, government benefits), acceptable
security/postcode/category changes, exposure limits, policy niches opening or
closing, new products launched or products withdrawn, changes to how an existing
product is assessed.

### Lender service & process
Turnaround-time updates, SLA notices, broker portal / application platform
changes, new document requirements that apply to *all* applications, ID/verification
process changes, valuation ordering process changes, BDM appointments/changes and
new BDM introductions, accreditation requirements.

### Regulatory & government
APRA, ASIC, AFCA, ACCC, RBA (as regulator/policy), Treasury. Changes to responsible
lending, best-interests duty, comprehensive credit reporting, first-home-buyer
schemes / guarantees, stamp-duty or grant changes, budget items affecting lending
or property, compliance obligations and deadlines.

### Aggregator / licensee / advisor
Communications from the broker's aggregator, licensee, or advisory group:
compliance bulletins, commission/upfront/trail/clawback changes, CRM/tech
platform changes, group-wide policy or process, PD requirements, group offers.

### Industry media & commentary
Momentum Media titles (The Adviser, Mortgage Business, Broker Daily), MPA
(Mortgage Professional Australia), other industry newsletters and market
commentary, lender or aggregator thought-leadership, market/property data
releases relevant to broking.

### Events & awards
Awards nights and award nominations/finalist announcements, conferences, summits,
roadshows, PD days, webinars, lender/aggregator networking events, industry
breakfasts/lunches, expos.

## DROP — client transactional & non-signal

### Client deal correspondence (the big one)
Any email that exists because of one specific client/application:
- Pre-approval issued / conditional approval / **unconditional (formal) approval**
- Application received / submitted / status update / assessment in progress
- "Further information required" / outstanding-conditions requests for a client
- Valuation ordered, valuation returned, valuation shortfall for a named property
- Loan documents issued / signed / returned for a client
- Settlement booked / settlement date / settlement confirmation
- Discharge/refinance progress for a named borrower
- Anything quoting a specific application number, loan number, or client name

The tell: it names a person (borrower), a property address, or an application/loan
reference, and the content is only actionable for that one file. Even though these
often come *from* the same lenders whose policy emails you KEEP, the content is
deal-flow, not industry signal — drop it.

### Other non-signal
- Personal/admin email, one-to-one meeting invites, internal team logistics
- Generic marketing unrelated to policy/rates/events (e.g. lifestyle offers)
- Spam, newsletters the broker clearly doesn't care about, receipts, notifications
  from unrelated tools
- Pure social/relationship email with no industry content

## Edge cases and how to resolve them

**A rate email that mentions a client.** If the substance is a genuine rate/policy
change and the client is just an example or footer, KEEP it and summarise the
policy, not the client. If the substance is "here's your client's new rate after
their repricing request", DROP it.

**A lender newsletter that bundles policy + a client shout-out + an event.** KEEP
it; summarise the policy and event, ignore the client bit.

**An event invitation that's really a sales pitch for one lender's product.** If
there's a real event (date, venue, RSVP), KEEP under Events; if it's just "book a
call with your BDM", it's borderline — KEEP only if it signals a product/policy
worth knowing, otherwise DROP.

**Aggregator email about a specific commission discrepancy for one deal.** DROP —
that's a single-file finance query. But a commission *structure* change for all
brokers → KEEP.

**"Your pre-approval for the Smith file expires Friday."** DROP — client file.

**"We've increased our assessment rate buffer to 3.00% effective Monday."** KEEP —
credit policy, high signal.

**"APRA releases updated guidance on serviceability buffers."** KEEP — regulatory,
high signal; link the source article/PDF if present.

**"You're a finalist in the Australian Broking Awards 2026."** KEEP — Events &
Awards, and it's a nice one to surface prominently.

## When unsure

The two directions are **not** symmetrical, and it matters which way you lean.

**Bias toward KEEP for policy, rate and regulatory material.** Missing a policy
change costs the broker one line they could have used. Cheap mistake.

**Bias toward DROP for anything that smells client-specific**, and when you
genuinely cannot tell, drop it. They already handle those in their CRM, so the cost
of dropping is close to zero — while the cost of keeping is a borrower's name in a
document that gets screenshotted and forwarded, in a briefing whose entire promise
is that this never happens.

Never "surface it in case" with a hedge like "possibly client-specific". There is no
wording that makes client material safe to publish, and a flagged client item is
still a client item on the page. Ambiguity resolves to DROP, silently.

(An earlier version of this file advised exactly that hedge. It was wrong, and it
contradicted both the client data boundary in SKILL.md and the promise made on
every digest's colophon.)
