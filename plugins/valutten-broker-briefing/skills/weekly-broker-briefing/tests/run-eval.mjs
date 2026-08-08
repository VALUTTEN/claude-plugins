#!/usr/bin/env node
// Fixture integrity check and eval prompt generator for the weekly-broker-briefing
// classification step.
//
// This script does NOT call a model and does NOT touch the network. It does two jobs:
//
//   1. Structural validation of tests/fixtures/mailbox.json, so a malformed or
//      drifted fixture fails in CI rather than silently weakening the eval.
//   2. Emitting a self-contained prompt that a human pastes into a Cowork session
//      to run the actual behavioural eval, whose score they then record.
//
// Usage:
//   node run-eval.mjs              validate, print the summary and the eval prompt
//   node run-eval.mjs --check      validate and print the summary only (for CI)
//   node run-eval.mjs --prompt     print only the eval prompt (clean to pipe to pbcopy)
//
// Exit codes: 0 all checks passed, 1 a structural problem was found.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(HERE, 'fixtures', 'mailbox.json');

// The six categories from SKILL.md Step 4, in order. If SKILL.md ever changes
// these, this list and the fixture's own `categories` array must both be updated —
// the validator checks that they agree, which is how that drift gets caught.
const CATEGORIES = [
  'Rate Changes',
  'Credit & Lending Policy',
  'Regulatory & Government',
  'Lender Service & Process',
  'Aggregator & Licensee',
  'Industry News & Events',
];

const REQUIRED_FIELDS = [
  'id',
  'from',
  'from_domain',
  'subject',
  'body_excerpt',
  'date',
  'expect',
  'why',
];

const errors = [];
const fail = (msg) => errors.push(msg);

// ---------------------------------------------------------------- load

let fixture;
try {
  fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'));
} catch (err) {
  console.error(`FAIL  could not read or parse ${FIXTURE_PATH}`);
  console.error(`      ${err.message}`);
  process.exit(1);
}

if (!Array.isArray(fixture.emails)) {
  console.error('FAIL  fixture has no `emails` array');
  process.exit(1);
}

const emails = fixture.emails;

// ---------------------------------------------------------------- validate

if (!Array.isArray(fixture.categories)) {
  fail('fixture is missing its `categories` array');
} else {
  const declared = fixture.categories.join(' | ');
  const expected = CATEGORIES.join(' | ');
  if (declared !== expected) {
    fail(
      'fixture `categories` do not match the six categories in SKILL.md Step 4\n' +
        `        fixture:  ${declared}\n` +
        `        expected: ${expected}`
    );
  }
}

const seenIds = new Set();

for (const [i, email] of emails.entries()) {
  const label = email && email.id ? `${email.id}` : `entry #${i}`;

  if (typeof email !== 'object' || email === null) {
    fail(`${label}: entry is not an object`);
    continue;
  }

  for (const field of REQUIRED_FIELDS) {
    const value = email[field];
    if (typeof value !== 'string' || value.trim() === '') {
      fail(`${label}: missing or empty required field \`${field}\``);
    }
  }

  if (typeof email.id === 'string') {
    if (seenIds.has(email.id)) fail(`${label}: duplicate id`);
    seenIds.add(email.id);
  }

  if (email.expect !== 'KEEP' && email.expect !== 'DROP') {
    fail(`${label}: \`expect\` must be exactly "KEEP" or "DROP", got ${JSON.stringify(email.expect)}`);
  }

  if (email.expect === 'KEEP') {
    if (!CATEGORIES.includes(email.category)) {
      fail(
        `${label}: KEEP entries need a \`category\` from the six in SKILL.md Step 4, got ${JSON.stringify(email.category)}`
      );
    }
  } else if (email.expect === 'DROP' && email.category !== undefined) {
    fail(`${label}: DROP entries must not carry a \`category\` (got ${JSON.stringify(email.category)})`);
  }

  if (typeof email.date === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(email.date)) {
    fail(`${label}: \`date\` should be YYYY-MM-DD, got ${JSON.stringify(email.date)}`);
  }
}

// A fixture that has drifted to nearly all DROP or nearly all KEEP stops being a
// useful eval: a classifier that always answers the majority verdict would score
// well without reading anything.
const keeps = emails.filter((e) => e.expect === 'KEEP');
const drops = emails.filter((e) => e.expect === 'DROP');
if (emails.length > 0) {
  const keepShare = keeps.length / emails.length;
  if (keepShare < 0.3 || keepShare > 0.7) {
    fail(
      `verdict balance is skewed (${keeps.length} KEEP / ${drops.length} DROP). ` +
        'Keep it roughly even so a constant-answer classifier cannot score well.'
    );
  }
}

// Every category should be exercised, otherwise a category can be broken without
// any fixture noticing.
const perCategory = new Map(CATEGORIES.map((c) => [c, 0]));
for (const e of keeps) {
  if (perCategory.has(e.category)) perCategory.set(e.category, perCategory.get(e.category) + 1);
}
for (const [cat, n] of perCategory) {
  if (n === 0) fail(`no fixture exercises the "${cat}" category`);
}

// ---------------------------------------------------------------- report

const mode = process.argv.includes('--prompt')
  ? 'prompt'
  : process.argv.includes('--check')
    ? 'check'
    : 'full';

if (mode !== 'prompt') {
  console.log('weekly-broker-briefing — classification fixture check');
  console.log('');
  console.log(`fixture:  ${FIXTURE_PATH}`);
  console.log(`version:  ${fixture.fixture_version ?? '(unversioned)'}`);
  console.log(`entries:  ${emails.length}  (${keeps.length} KEEP / ${drops.length} DROP)`);
  console.log('');
  console.log('KEEP category distribution:');
  for (const [cat, n] of perCategory) {
    console.log(`  ${String(n).padStart(2)}  ${cat}`);
  }
  const edged = emails.filter((e) => e.edge_case);
  console.log('');
  console.log(`documented edge cases covered: ${edged.length}`);
  console.log('');
}

if (errors.length > 0) {
  console.error(`FAIL  ${errors.length} structural problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors) console.error(`  - ${e}`);
  console.error('');
  console.error('Fix the fixture before running the behavioural eval. A malformed');
  console.error('fixture produces a score that means nothing.');
  process.exit(1);
}

if (mode === 'check') {
  console.log('OK  fixture is structurally sound.');
  process.exit(0);
}

// ---------------------------------------------------------------- eval prompt

// The emitted prompt must stand alone: the person pasting it is in a fresh Cowork
// session with no memory of this repo. It carries the rules summary, the data, and
// the output format, and it says loudly that the data is synthetic so the session
// never reaches for a real mailbox.

const table = emails
  .map((e) => `${e.id} | ${e.from} | ${e.subject} | ${e.body_excerpt}`)
  .join('\n');

const prompt = `
You are running a scored classification eval. This is TEST DATA, not a real mailbox.

Every message below is synthetic and invented for this eval. Do NOT connect to Gmail,
do NOT search any mailbox, do NOT open any connector. All the input you need is in this
message. Any names, addresses and domains below are placeholders; none refer to a real
person, client or broker.

TASK
For each message, decide KEEP or DROP exactly as the weekly-broker-briefing skill would
at Step 3, and for each KEEP assign one of six categories.

THE RULE
KEEP anything that matters to the broker's whole business — how they price, advise, work,
or where they need to show up. DROP anything that exists only because of one specific
client, application, property or settlement.

KEEP covers: interest-rate changes (including promotional pricing and cashbacks), credit
and lending policy changes, lender service and process updates that apply to all deals
(turnaround times, portals, BDM appointments, accreditation), regulatory and government
items (APRA, ASIC, AFCA, RBA as policy setter, Treasury, schemes), aggregator or licensee
communications (commission and clawback structure, compliance, CRM changes, PD
requirements), industry media and commentary, and events, awards, conferences and
webinars.

DROP covers: approvals of any kind for a named borrower, application status and "further
information required", valuations for a named property, settlement bookings, loan
documents, discharge and payout progress, anything quoting a client name or an
application or loan number, one-to-one meeting invites, generic lifestyle marketing,
spam and receipts.

TWO RULES THAT DECIDE THE HARD CASES
1. If a message is substantively about one named borrower, DROP it even when it also
   mentions a rate or policy change. Do not summarise the policy half.
2. If a message is substantively a rate or policy announcement and the client reference
   is only an aside, a footer or a congratulation carrying no borrower detail, KEEP it and
   summarise the policy only, never the client.

THE SIX CATEGORIES (use these exact names, nothing else)
${CATEGORIES.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Industry media and events share one section: "Industry News & Events".

MESSAGES (id | from | subject | body excerpt)
${table}

OUTPUT
One line per message, in the order given, in exactly this format:

  <id> | KEEP | <category>
  <id> | DROP | -

Then a one-line note for any message you found genuinely ambiguous, saying which way you
went and why. No other commentary.
`.trim();

if (mode === 'full') {
  console.log('OK  fixture is structurally sound.');
  console.log('');
  console.log('Paste everything between the markers into a fresh Cowork session,');
  console.log('then score the reply against fixtures/mailbox.json. See README.md.');
  console.log('');
  console.log('----- BEGIN EVAL PROMPT -----');
}

console.log(prompt);

if (mode === 'full') {
  console.log('----- END EVAL PROMPT -----');
}

process.exit(0);
