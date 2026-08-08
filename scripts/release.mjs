#!/usr/bin/env node
/**
 * Bump a plugin's version everywhere it is written, atomically.
 *
 * Run: node scripts/release.mjs <plugin-name> <new-version>
 *      node scripts/release.mjs valutten-broker-briefing 0.11.0
 *
 * WHY THIS EXISTS
 * ---------------
 * The version appears in four places that must agree: the marketplace entry, the
 * plugin manifest, every scheduled-prompt stamp, and the README footer. Ten releases
 * were done by hand with sed. That is the same hand-maintained-duplicate problem this
 * repo has spent its whole history fixing everywhere else, and doing it manually here
 * while writing checks against it elsewhere was not defensible.
 *
 * This writes all four, then runs the release check. If the check fails, the bump is
 * rolled back — a half-applied version bump is worse than none, because
 * marketplace.json and plugin.json disagreeing resolves installs to a version that is
 * not what ships, and it fails silently (CLAUDE.md §2).
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [, , pluginName, newVersion] = process.argv;

if (!pluginName || !newVersion) {
  console.error('usage: node scripts/release.mjs <plugin-name> <new-version>');
  process.exit(2);
}
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error(`"${newVersion}" is not a semver version (x.y.z).`);
  process.exit(2);
}

const abs = (p) => join(root, p);
const touched = []; // [path, originalContent] for rollback

function write(rel, next) {
  const path = abs(rel);
  const before = readFileSync(path, 'utf-8');
  if (before === next) return false;
  touched.push([path, before]);
  writeFileSync(path, next);
  return true;
}

const marketplacePath = '.claude-plugin/marketplace.json';
const marketplace = JSON.parse(readFileSync(abs(marketplacePath), 'utf-8'));
const entry = marketplace.plugins.find((p) => p.name === pluginName);
if (!entry) {
  console.error(`"${pluginName}" is not listed in ${marketplacePath}.`);
  process.exit(2);
}

const pluginRoot = (marketplace.metadata?.pluginRoot ?? './plugins').replace(/^\.\//, '');
const dir = join(pluginRoot, pluginName);
const manifestRel = join(dir, '.claude-plugin/plugin.json');
const oldVersion = JSON.parse(readFileSync(abs(manifestRel), 'utf-8')).version;

if (oldVersion === newVersion) {
  console.error(`Already at ${newVersion}. Nothing to do.`);
  process.exit(2);
}

const changed = [];

// 1. marketplace entry
entry.version = newVersion;
if (write(marketplacePath, JSON.stringify(marketplace, null, 2) + '\n')) {
  changed.push(marketplacePath);
}

// 2. plugin manifest
const manifest = JSON.parse(readFileSync(abs(manifestRel), 'utf-8'));
manifest.version = newVersion;
if (write(manifestRel, JSON.stringify(manifest, null, 2) + '\n')) changed.push(manifestRel);

// 3. every scheduled-prompt stamp. The stamp always equals the plugin version — see
//    the header of assets/kickoff-prompt.md for why the simple rule beats the clever
//    one. The `v<version>` illustration is left alone.
const skillsDir = join(dir, 'skills');
if (existsSync(abs(skillsDir))) {
  for (const skill of readdirSync(abs(skillsDir))) {
    const rel = join(skillsDir, skill, 'assets/kickoff-prompt.md');
    if (!existsSync(abs(rel))) continue;
    const before = readFileSync(abs(rel), 'utf-8');
    const after = before.replace(/prompt v\d+\.\d+\.\d+/g, `prompt v${newVersion}`);
    if (write(rel, after)) changed.push(rel);
  }
}

// 4. README footer
const readmeRel = join(dir, 'README.md');
if (existsSync(abs(readmeRel))) {
  const before = readFileSync(abs(readmeRel), 'utf-8');
  const after = before.replace(/Version \d+\.\d+\.\d+\./g, `Version ${newVersion}.`);
  if (write(readmeRel, after)) changed.push(readmeRel);
}

console.log(`  ${pluginName}: ${oldVersion} → ${newVersion}`);
for (const c of changed) console.log(`    updated ${c}`);

// Verify, and roll back the whole bump if anything is inconsistent.
try {
  execFileSync('node', [join(root, 'scripts/check-release.mjs')], { stdio: 'inherit' });
} catch {
  console.error('\n  Release check failed — rolling back the bump.\n');
  for (const [path, before] of touched) writeFileSync(path, before);
  console.error(`  Restored ${touched.length} file(s) to ${oldVersion}.`);
  process.exit(1);
}

console.log(`
  Next: commit, then push to main. Anyone with "Sync automatically" on picks it up
  on their next refresh, with nothing to re-send.

  Existing scheduled tasks do NOT pick up prompt changes — but since 0.10.0 the
  prompts carry configuration only, so a skill change should not require touching
  them. If you changed a scheduled prompt itself, brokers need to refresh their
  schedule ("Refresh my weekly briefing schedule").`);
