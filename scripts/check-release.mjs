#!/usr/bin/env node
/**
 * Release integrity checks for the VALUTTEN plugin marketplace.
 *
 * Run: node scripts/check-release.mjs
 *
 * Every check here corresponds to a defect that has actually shipped from this repo.
 * None of them are style rules. If one fails, something a broker would see is wrong.
 *
 * The version checks exist because releases were bumped by hand with sed across four
 * files, which is the same drift class the repo has been bitten by repeatedly — and
 * doing it by hand while writing rules against hand-maintained duplicates was not a
 * defensible position.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf-8');
const readJson = (p) => JSON.parse(read(p));

const failures = [];
const notes = [];
const fail = (m) => failures.push(m);

const marketplace = readJson('.claude-plugin/marketplace.json');
const pluginRoot = (marketplace.metadata?.pluginRoot ?? './plugins').replace(/^\.\//, '');

for (const entry of marketplace.plugins) {
  const dir = join(pluginRoot, entry.name);
  const manifestPath = join(dir, '.claude-plugin/plugin.json');

  if (!existsSync(join(root, manifestPath))) {
    fail(`${entry.name}: listed in marketplace.json but ${manifestPath} does not exist.`);
    continue;
  }
  const manifest = readJson(manifestPath);
  const version = manifest.version;

  // 1. marketplace entry and plugin manifest must agree. A mismatch resolves installs
  //    to a version that is not what ships, and it fails silently (CLAUDE.md §2).
  if (entry.version !== version) {
    fail(
      `${entry.name}: marketplace.json says ${entry.version}, plugin.json says ${version}. ` +
        `A mismatch installs a version that is not what ships, and it fails silently.`,
    );
  }

  // 2. Names are public-facing and must be kebab-case (CLAUDE.md §2).
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(entry.name)) {
    fail(`${entry.name}: marketplace name must be kebab-case — it is public-facing.`);
  }

  // 3. Every scheduled-prompt stamp must equal the plugin version. Refresh mode
  //    compares the stamp against the installed version, so a lagging stamp makes a
  //    current task read as stale and a leading one hides a real staleness.
  const skillsDir = join(dir, 'skills');
  if (existsSync(join(root, skillsDir))) {
    for (const skill of readdirSync(join(root, skillsDir))) {
      const promptPath = join(skillsDir, skill, 'assets/kickoff-prompt.md');
      if (!existsSync(join(root, promptPath))) continue;
      const prompts = read(promptPath);

      const stamps = [...prompts.matchAll(/prompt v(\d+\.\d+\.\d+)/g)].map((m) => m[1]);
      if (stamps.length === 0) {
        fail(`${promptPath}: no version stamp found. Scheduled prompts must carry one.`);
      }
      for (const s of new Set(stamps)) {
        if (s !== version) {
          fail(`${promptPath}: stamp v${s} does not match plugin version ${version}.`);
        }
      }

      // 4. Trigger prompts carry configuration, not method (CLAUDE.md §8). Method
      //    restated in a stored prompt goes stale and forces every broker to
      //    hand-edit their task — which happened four releases running.
      // Only real prompts, not the `v<version>` illustration in the explanatory
      // section — that one legitimately carries no safety lines.
      const scheduled = [...prompts.matchAll(/```\n(# valutten[\s\S]*?)```/g)]
        .map((m) => m[1])
        .filter((b) => /prompt v\d+\.\d+\.\d+/.test(b));
      for (const block of scheduled) {
        if (block.length > 2000) {
          fail(
            `${promptPath}: a scheduled prompt is ${block.length} chars. Over ~2000 means ` +
              `method has crept back in. Prompts carry configuration only (CLAUDE.md §8).`,
          );
        }
        // The two deliberate safety duplications must survive. Normalise whitespace
        // first: these prompts are hard-wrapped prose, so a phrase can legitimately
        // straddle a line break ("client\ninformation") and a naive test misses it.
        const flat = block.replace(/\s+/g, ' ');
        if (!/never write to the mailbox/i.test(flat)) {
          fail(`${promptPath}: a scheduled prompt lost the "never write to the mailbox" line.`);
        }
        if (!/client information|client email|client-related/i.test(flat)) {
          fail(`${promptPath}: a scheduled prompt lost its client-data safety line.`);
        }
      }
    }
  }

  // 5. README version footer, if it has one, must agree.
  const readmePath = join(dir, 'README.md');
  if (existsSync(join(root, readmePath))) {
    const m = read(readmePath).match(/Version (\d+\.\d+\.\d+)\./);
    if (m && m[1] !== version) {
      fail(`${readmePath}: footer says Version ${m[1]}, plugin.json says ${version}.`);
    }
  }

  // 6. Digest template invariants (CLAUDE.md §5). A digest that renders without its
  //    branding is a silent failure, not a cosmetic one.
  const templatePath = join(dir, 'skills/weekly-broker-briefing/assets/digest-template.html');
  if (existsSync(join(root, templatePath))) {
    const t = read(templatePath);
    const required = [
      ['class="wordmark"', 'the masthead wordmark'],
      ['utm_source=broker-briefing', 'the colophon UTM parameters'],
      ['</footer>', 'the closing colophon tag'],
      ['class="feedback"', 'the colophon feedback line'],
    ];
    for (const [needle, what] of required) {
      if (!t.includes(needle)) fail(`${templatePath}: missing ${what} (${needle}).`);
    }
    // The artifact viewer blocks external images, so the logo renders as a broken
    // glyph exactly where brokers read the briefing (CLAUDE.md §5.1).
    const imgs = (t.match(/<img/g) || []).length;
    if (imgs > 0) {
      fail(`${templatePath}: ${imgs} <img> tag(s). The artifact viewer blocks external images.`);
    }
    // Self-contained: no external resource loads. Links are fine; loads are not.
    const loads = [...t.matchAll(/(?:src|rel=["']stylesheet["'][^>]*href)=["']https?:\/\//g)];
    if (loads.length) {
      fail(`${templatePath}: ${loads.length} external resource load(s). The page must be self-contained.`);
    }
  }

  notes.push(`${entry.name} @ ${version}`);
}

// 7. This repo is public (CLAUDE.md preamble). Catch the obvious leaks.
const SECRET_PATTERNS = [
  [/sk-ant-[A-Za-z0-9_-]{10,}/, 'an Anthropic API key'],
  [/AIza[0-9A-Za-z_-]{30,}/, 'a Google API key'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'a private key'],
];
const walk = (rel) => {
  for (const e of readdirSync(join(root, rel), { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    const p = join(rel, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!/\.(md|json|html|mjs|js|ts)$/.test(e.name)) continue;
    const body = read(p);
    for (const [re, what] of SECRET_PATTERNS) {
      if (re.test(body)) fail(`${p}: looks like it contains ${what}. This repo is public.`);
    }
  }
};
walk('.');

if (failures.length) {
  console.error('\n  Release check FAILED\n');
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error('');
  process.exit(1);
}
console.log(`  ✓ Release check OK — ${notes.join(', ')}`);
