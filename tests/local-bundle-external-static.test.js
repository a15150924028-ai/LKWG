const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const indexPath = path.join(root, "index.html");
const bundlePath = path.join(root, "data", "local-bundle.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertIncludes(text, needle, message) {
  assert(text.includes(needle), message);
}

function assertNotIncludes(text, needle, message) {
  assert(!text.includes(needle), message);
}

function functionBody(html, name) {
  const starts = [`async function ${name}(`, `function ${name}(`];
  const start = starts.map((needle) => html.indexOf(needle)).find((index) => index >= 0);
  assert(start >= 0, `Missing function ${name}.`);
  const open = html.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < html.length; index += 1) {
    if (html[index] === "{") depth += 1;
    if (html[index] === "}") {
      depth -= 1;
      if (depth === 0) return html.slice(start, index + 1);
    }
  }
  throw new Error(`Could not parse function ${name}.`);
}

assert(fs.existsSync(indexPath), "B-plan build must create index.html.");
assert(fs.existsSync(bundlePath), "B-plan build must create data/local-bundle.json.");

const html = fs.readFileSync(indexPath, "utf8");
const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
const keys = Object.keys(bundle).sort();
assert(
  JSON.stringify(keys) === JSON.stringify(["monsters", "passives", "skills"]),
  "data/local-bundle.json must contain only monsters, skills, and passives."
);
assert(bundle.monsters.length >= 400, "External bundle must contain the full monster pool.");
assert(bundle.skills.length >= 450, "External bundle must contain the skill pool.");
assert(bundle.passives.length >= 150, "External bundle must contain passive records.");

assertIncludes(html, 'const LOCAL_BUNDLE_URL = "data/local-bundle.json";', "index.html must load data/local-bundle.json.");
assertIncludes(html, "const BLOODLINES = [", "index.html must keep fixed BLOODLINES.");
assertIncludes(html, "const FALLBACK_DATA = {", "index.html must keep a tiny FALLBACK_DATA.");
assertIncludes(html, "function applyDexData", "index.html must keep the core data application path.");
assertIncludes(html, "rotateSkillsDown", "index.html must keep roller logic.");
assertIncludes(html, "actionCuteLayers", "index.html must keep manual cute-layer state.");
assertIncludes(html, "const REAL_BOSS_FORM_NAMES = new Set([", "index.html must keep the fixed boss-form name list.");
["黑猫密探", "幻影荆棘", "祭礼巨像"].forEach((name) => {
  assertIncludes(html, `"${name}"`, `index.html must keep fixed boss-form source name: ${name}.`);
  assert(bundle.monsters.some((monster) => monster.name === name), `External bundle must keep the base monster used for boss generation: ${name}.`);
});

const loadBody = functionBody(html, "loadDexData");
assert(loadBody.includes("fetch(LOCAL_BUNDLE_URL"), "loadDexData must fetch the external local bundle.");
assert(loadBody.includes("applyDexData(normalizeLocalBundle(bundle))"), "loadDexData must apply the normalized local bundle.");
assert(loadBody.includes("applyDexData(FALLBACK_DATA)"), "loadDexData must fall back to the tiny built-in data.");
assert(!loadBody.includes("localStorage.getItem(DATA_STORAGE_KEY)"), "Startup must not use old browser data-cache storage.");
assert(!loadBody.includes("readEmbeddedBundle"), "Startup must not read embedded large data.");

const startupBody = functionBody(html, "startApp");
assert(startupBody.includes("await loadDexData()"), "Startup must wait for local-bundle.json before rendering.");

const applyBody = functionBody(html, "applyDexData");
assert(applyBody.includes("monsters: withBossForms("), "applyDexData must still generate fixed boss forms at runtime.");
const bossBody = functionBody(html, "withBossForms");
assert(bossBody.includes("bossFormNamesFromMonsters(baseMonsters)"), "withBossForms must use fixed boss-form names.");
assert(bossBody.includes("createGeneratedBossForm"), "withBossForms must create boss-form monsters from base monsters.");

[
  "LOCAL_BUNDLE_DATA",
  "maintenancePanel",
  "maintenanceDraft",
  "updateMaintenanceDraftFromBwiki",
  "importCsvFiles",
  "generateSingleFileHtml",
  "readEmbeddedBundle",
  "fetchRemoteBundle",
  "BWIKI_API_URL",
  "BWIKI",
  "BWiki",
  "bwiki",
  "maintenance",
  "DATA_STORAGE_KEY",
  "saveDexDataToStorage",
  "updateDexData",
  "importDataBtn",
  "exportDataBtn",
  "clearLocalDataBtn",
  "maintenanceBtn",
].forEach((needle) => assertNotIncludes(html, needle, `index.html must not contain old single-file or maintenance chain: ${needle}`));

assertNotIncludes(html, "patchwiki.biligame.com", "index.html must not request patchwiki assets.");
assertNotIncludes(html, "rocomwiki.app", "index.html must not request rocomwiki assets.");
assertNotIncludes(html, "<img", "index.html must not render third-party images.");

const scripts = [...html.matchAll(/<script(?![^>]*type="application\/json")[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
scripts.forEach((script, index) => {
  try {
    new Function(script);
  } catch (error) {
    throw new Error(`Executable script block ${index + 1} does not parse: ${error.message}`);
  }
});

const urlIssues = [];
function inspect(value, pathName) {
  if (typeof value === "string") {
    if (/https?:|patchwiki|rocomwiki|biligame/i.test(value)) urlIssues.push(`${pathName}: ${value.slice(0, 120)}`);
    if (/\.(?:png|jpe?g|gif|svg|webp)(?:[?#]|$)/i.test(value)) urlIssues.push(`${pathName}: ${value.slice(0, 120)}`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspect(item, `${pathName}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => inspect(item, `${pathName}.${key}`));
  }
}
inspect(bundle, "bundle");
assert(urlIssues.length === 0, `data/local-bundle.json must not contain URL or image fields:\n${urlIssues.slice(0, 10).join("\n")}`);

console.log("External local bundle static checks passed.");
