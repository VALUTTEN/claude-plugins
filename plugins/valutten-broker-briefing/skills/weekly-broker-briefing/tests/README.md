# Classification regression eval

The weekly briefing's KEEP/DROP decision is the product. Everything else — the
search, the template, the delivery — is plumbing around that one judgement, and it
is the only part of the skill with no code in it. It is instructions to a model, so
editing `SKILL.md` Step 3 or `references/classification.md` can change the output in
ways that no typecheck, lint or render will catch.

Two failure directions, both expensive and neither symmetric:

- **A wrong KEEP is a privacy failure.** A client's unconditional approval appearing
  in a briefing is the thing the whole client-data boundary in `CLAUDE.md` exists to
  prevent, and it has to be assumed to have been read by whoever the broker shares
  the digest with.
- **A wrong DROP is a product failure.** A missed rate change or clawback update
  means the broker paid for a briefing that told them nothing they needed.

This directory holds a synthetic mailbox that exercises the boundary between them,
and a runner that checks the fixture's integrity and emits the eval prompt.

## Read this before you read a score

**This is a behavioural eval of a prompt, not a test suite.** The same fixture run
twice against the same unchanged skill will not always produce the same score. A
single failure on a single item is signal that something is worth looking at — it is
not proof of a regression, and a single clean run is not proof that a change is safe.

**The number to watch is the trend across runs**, and specifically the trend on the
items that were previously stable. One new failure on `m034` after an edit to the
privacy wording is worth investigating. One failure on `m027`, which is a genuine
category judgement call, is close to noise.

Score at least two runs before concluding anything, and record every run in the log
below whether it looked good or bad. A log with only the bad runs in it cannot show
a trend.

## Running it

### 1. Check the fixture

```bash
cd plugins/valutten-broker-briefing/skills/weekly-broker-briefing
node tests/run-eval.mjs --check
```

This calls no model and touches no network. It validates that every entry has the
required fields, that ids are unique, that verdicts are only `KEEP` or `DROP`, that
every KEEP carries one of the six real categories from `SKILL.md` Step 4, that no
DROP carries a category, that all six categories are exercised, and that the
KEEP/DROP split has not drifted so far that a classifier answering the same word
every time would score well.

It exits non-zero on any problem, so it is safe to wire into CI. It is the only part
of this directory that can be automated.

### 2. Run the behavioural eval

```bash
node tests/run-eval.mjs --prompt | pbcopy
```

Paste that into a **fresh Cowork session** — fresh matters, because a session that
has already been discussing this repo has the answers in its context. The prompt is
self-contained and states plainly that the data is synthetic and that no mailbox
should be opened.

Ask the session to classify. You will get back one line per message.

### 3. Score it

Compare the reply against `expect` and `category` in `fixtures/mailbox.json`. Count
three things separately, because they mean different things:

| Metric | What it means |
|---|---|
| **False KEEPs** | Client email that would have reached the briefing. The privacy number. Target is zero, always. |
| **False DROPs** | Industry signal that would have been lost. The product number. |
| **Category errors** | Right verdict, wrong section. Cosmetic by comparison, but a category outside the six vanishes from the page entirely, so an invented seventh category is a real bug, not a category error. |

Do not collapse these into one percentage. A run with one false KEEP and no other
errors is worse than a run with four category errors, and a single score hides that.

## When it regresses

1. **Confirm it repeats.** Re-run the same prompt in another fresh session. Prompt
   evals are noisy; one bad line is not a regression.
2. **Read the `why` field for the failed item.** Every fixture entry records the
   reasoning the expected verdict rests on, and several cite the exact line of
   `SKILL.md` or `classification.md` they are testing. If the model's reasoning
   disagrees with the `why`, one of the two is wrong — and sometimes it is the
   fixture. A fixture that is wrong should be fixed, with the reason recorded here.
3. **Diff the rules, not the fixture.** `git log -p SKILL.md references/classification.md`
   over the period since the last clean run. The classification section is short;
   the change that caused it is usually visible by eye.
4. **Prefer adding a worked example to rewriting a rule.** Both `SKILL.md` Step 3
   and `classification.md` steer mostly through examples, and adding the failing case
   as an example is a smaller, more predictable change than rewording the rule that
   governs every other case.
5. **Never fix a false KEEP by widening what gets dropped** without re-running the
   whole fixture. Tightening the privacy rule is the easy move, and it is exactly
   what turns `m034` (a rate sheet with a one-line congratulation) into a false DROP.
   The two failure directions trade off against each other; that trade-off is the
   thing the fixture exists to measure.

## The fixture

`fixtures/mailbox.json` — 34 entirely invented emails. No real broker, client,
mailbox or address is represented. Placeholder surnames (Smith, Nguyen, Patel),
placeholder street addresses, and `.example` domains wherever a domain is invented.
Real lender, aggregator and regulator brand names appear because they are public
companies and the classifier legitimately keys off them; nothing attributed to them
is a real communication.

Fields per entry: `id`, `from`, `from_domain`, `subject`, `body_excerpt`, `date`,
`expect`, `category` (KEEPs only), `why`, and `edge_case` naming the documented rule
the entry tests, where it tests one.

The cases that carry the most weight:

- **`m004` and `m034`** — the same collision resolved opposite ways. `m004` mixes a
  real policy change with substantive outstanding-conditions traffic about a named
  file, and drops, because `SKILL.md` Step 2 is unconditional about anything
  concerning one named borrower. `m034` is a rate sheet with a congratulation
  attached, and keeps, because `classification.md` says a client reference that is
  just a footer does not poison a genuine policy item. The line between them is
  whether the client material is substance or aside, and it is the finest
  distinction the skill has to draw.
- **`m017`, `m021`, `m022`** — three messages from `stgeorge.example`: a settlement,
  a lifestyle giveaway and a credit policy bulletin. Two DROP, one KEEP. Any rule
  that decides at the domain level gets at least one wrong, which is why sender
  selection can never replace per-message classification.
- **`m008` and `m009`** — the same BDM introducing themselves, then chasing one file.
  Same test as above at the individual-sender level.
- **`m006` and `m007`** — an aggregator clawback change against a commission query on
  one settlement. The KEEP here is the most commercially valuable item in a typical
  week.
- **`m019`** — an unconditional approval for a named borrower. If only one item ever
  gets checked, check this one.

## Run log

Record every run. Date, what changed since the last run, the three counts, and the
ids that failed.

| Date | Change under test | False KEEPs | False DROPs | Category errors | Failed ids |
|---|---|---|---|---|---|
| | | | | | |
