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

function constObjectBody(html, name) {
  const start = html.indexOf(`const ${name} = {`);
  assert(start >= 0, `Missing const object ${name}.`);
  const open = html.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < html.length; index += 1) {
    if (html[index] === "{") depth += 1;
    if (html[index] === "}") {
      depth -= 1;
      if (depth === 0) return html.slice(start, index + 1);
    }
  }
  throw new Error(`Could not parse const object ${name}.`);
}

assert(fs.existsSync(indexPath), "B-plan build must create index.html.");
assert(fs.existsSync(bundlePath), "B-plan build must create data/local-bundle.json.");

const html = fs.readFileSync(indexPath, "utf8");
const bundle = JSON.parse(fs.readFileSync(bundlePath, "utf8"));
const keys = Object.keys(bundle).sort();
assert(
  JSON.stringify(keys) === JSON.stringify(["currentSeason", "generatedAt", "monsters", "passives", "schemaVersion", "skills"]),
  "data/local-bundle.json must contain only schemaVersion, generatedAt, currentSeason, monsters, skills, and passives."
);
assert(bundle.schemaVersion === 1, "External bundle schemaVersion must be 1.");
assert(typeof bundle.generatedAt === "string", "External bundle generatedAt must be a string.");
assert(typeof bundle.currentSeason === "string", "External bundle currentSeason must be a string.");
assert(bundle.currentSeason === "本地数据包", "External bundle currentSeason must be 本地数据包.");
assert(bundle.monsters.length >= 400, "External bundle must contain the full monster pool.");
assert(bundle.skills.length >= 450, "External bundle must contain the skill pool.");
assert(bundle.passives.length >= 150, "External bundle must contain passive records.");

const requiredStatKeys = ["hp", "atk", "defense", "spa", "spd", "spe"];
const skillIds = new Set(bundle.skills.map((skill) => skill.id));
const passiveIds = new Set(bundle.passives.map((passive) => passive.id));
bundle.monsters.forEach((monster) => {
  assert(monster.kind === "monster", `Monster ${monster.name || monster.id} must have kind=monster.`);
  assert(/^monster-/.test(monster.id), `Monster ${monster.name || monster.id} id must use the monster- prefix.`);
  assert(Array.isArray(monster.types), `Monster ${monster.name || monster.id} must have types.`);
  assert(Array.isArray(monster.skillIds), `Monster ${monster.name || monster.id} must have skillIds.`);
  assert(Array.isArray(monster.passiveIds), `Monster ${monster.name || monster.id} must have passiveIds.`);
  assert(monster.passiveIds.length > 0, `Monster ${monster.name || monster.id} must reference at least one passive.`);
  assert(monster.stats && typeof monster.stats === "object", `Monster ${monster.name || monster.id} must have top-level stats.`);
  requiredStatKeys.forEach((key) => {
    assert(Object.prototype.hasOwnProperty.call(monster.stats, key), `Monster ${monster.name || monster.id} is missing stats.${key}.`);
    assert(Number.isFinite(Number(monster.stats[key])), `Monster ${monster.name || monster.id} stats.${key} must be numeric.`);
  });
  monster.skillIds.forEach((skillId) => assert(skillIds.has(skillId), `Monster ${monster.name} references missing skill ${skillId}.`));
  monster.passiveIds.forEach((passiveId) => assert(passiveIds.has(passiveId), `Monster ${monster.name} references missing passive ${passiveId}.`));
});
bundle.skills.forEach((skill) => {
  assert(skill.kind === "skill", `Skill ${skill.name || skill.id} must have kind=skill.`);
  assert(/^skill-/.test(skill.id), `Skill ${skill.name || skill.id} id must use the skill- prefix.`);
  ["name", "aliases", "type", "category", "mode", "power", "pp", "energyCost", "accuracy", "priority", "description", "raw"].forEach((key) => {
    assert(Object.prototype.hasOwnProperty.call(skill, key), `Skill ${skill.name || skill.id} is missing ${key}.`);
  });
  assert(Array.isArray(skill.aliases), `Skill ${skill.name || skill.id} aliases must be an array.`);
  assert(typeof skill.type === "string", `Skill ${skill.name || skill.id} type must be a string.`);
  assert(typeof skill.category === "string", `Skill ${skill.name || skill.id} category must be a string.`);
  assert(typeof skill.mode === "string", `Skill ${skill.name || skill.id} mode must be a string.`);
  ["power", "pp", "energyCost", "accuracy"].forEach((key) => {
    assert(skill[key] === null || Number.isFinite(Number(skill[key])), `Skill ${skill.name || skill.id} ${key} must be numeric or null.`);
  });
  assert(Number.isFinite(Number(skill.priority)), `Skill ${skill.name || skill.id} priority must be numeric.`);
  assert(typeof skill.description === "string", `Skill ${skill.name || skill.id} description must be a string.`);
  assert(skill.raw && typeof skill.raw === "object" && !Array.isArray(skill.raw), `Skill ${skill.name || skill.id} raw must be an object.`);
});
bundle.passives.forEach((passive) => {
  assert(passive.kind === "passive", `Passive ${passive.name || passive.id} must have kind=passive.`);
  assert(/^passive-/.test(passive.id), `Passive ${passive.name || passive.id} id must use the passive- prefix.`);
  ["name", "aliases", "description", "raw"].forEach((key) => {
    assert(Object.prototype.hasOwnProperty.call(passive, key), `Passive ${passive.name || passive.id} is missing ${key}.`);
  });
  assert(Array.isArray(passive.aliases), `Passive ${passive.name || passive.id} aliases must be an array.`);
  assert(typeof passive.description === "string", `Passive ${passive.name || passive.id} description must be a string.`);
  assert(passive.raw && typeof passive.raw === "object" && !Array.isArray(passive.raw), `Passive ${passive.name || passive.id} raw must be an object.`);
});

assertIncludes(html, 'const LOCAL_BUNDLE_URL = "data/local-bundle.json";', "index.html must load data/local-bundle.json.");
assertIncludes(html, 'const ADMIN_DATA_STORAGE_KEY = "roco-world-admin-local-bundle-v1";', "index.html must keep admin-only imported data under a separate storage key.");
assertIncludes(html, "const BLOODLINES = [", "index.html must keep fixed BLOODLINES.");
assertIncludes(html, "const FALLBACK_DATA = {", "index.html must keep a tiny FALLBACK_DATA.");
assertIncludes(html, "function applyDexData", "index.html must keep the core data application path.");
assertIncludes(html, "rotateSkillsDown", "index.html must keep roller logic.");
assertIncludes(html, "undoRoller", "index.html must keep roller undo logic.");
assertIncludes(html, "actionCuteLayers", "index.html must keep manual cute-layer state.");
assertIncludes(html, "cuteLayerDelta", "index.html must keep cute-layer skill effects.");
assertIncludes(html, "cuteTotal", "index.html must keep cute-layer damage context.");
assertIncludes(html, "超级糖果", "index.html must keep the Super Candy PVP rule.");
assertIncludes(html, "萌化+1", "index.html must keep cute +1 rules.");
assertIncludes(html, "const REAL_BOSS_FORM_NAMES = new Set([", "index.html must keep the fixed boss-form name list.");
["黑猫密探", "幻影荆棘", "祭礼巨像"].forEach((name) => {
  assertIncludes(html, `"${name}"`, `index.html must keep fixed boss-form source name: ${name}.`);
  assert(bundle.monsters.some((monster) => monster.name === name), `External bundle must keep the base monster used for boss generation: ${name}.`);
});

const loadBody = functionBody(html, "loadDexData");
const fetchBody = functionBody(html, "fetchLocalBundle");
assert(fetchBody.includes("fetch(LOCAL_BUNDLE_URL"), "fetchLocalBundle must fetch the external local bundle.");
assert(fetchBody.includes('{ cache: "no-cache" }'), "fetchLocalBundle must request data/local-bundle.json with cache: no-cache.");
assert(loadBody.includes("fetchLocalBundle()"), "loadDexData must fetch through the external local bundle helper.");
assert(loadBody.includes("isAdminMode()"), "loadDexData must branch for admin-only localStorage data.");
assert(loadBody.includes("localStorage.getItem(ADMIN_DATA_STORAGE_KEY)"), "Admin mode must read imported test data from localStorage.");
assert(loadBody.indexOf("if (isAdminMode())") >= 0, "Admin localStorage branch must be explicit.");
assert(
  loadBody.indexOf("localStorage.getItem(ADMIN_DATA_STORAGE_KEY)") > loadBody.indexOf("if (isAdminMode())"),
  "Admin localStorage reads must only happen inside the admin-mode branch."
);
assert(loadBody.includes("applyLoadedBundle(bundle)"), "loadDexData must apply a validated local bundle.");
assert(loadBody.includes("applyDexData(FALLBACK_DATA)"), "loadDexData must fall back to the tiny built-in data.");
assert(!loadBody.includes("localStorage.getItem(DATA_STORAGE_KEY)"), "Startup must not use old browser data-cache storage.");
assert(!loadBody.includes("readEmbeddedBundle"), "Startup must not read embedded large data.");

const applyLoadedBody = functionBody(html, "applyLoadedBundle");
assert(applyLoadedBody.includes("rejectMutableDataFields(bundle)"), "Loaded bundles must reject mutable bloodlines/pvpPresets fields.");
assert(applyLoadedBody.includes("activeLocalBundle = releaseBundleCopy(bundle)"), "Validated bundles must become the active exportable package.");
assert(applyLoadedBody.includes("applyDexData(normalizeLocalBundle(activeLocalBundle))"), "Validated bundles must still use the normal applyDexData path.");

const rejectMutableBody = functionBody(html, "rejectMutableDataFields");
assert(rejectMutableBody.includes('"bloodlines"'), "Imported bundles with bloodlines must be rejected or ignored before application.");
assert(rejectMutableBody.includes('"pvpPresets"'), "Imported bundles with pvpPresets must be rejected or ignored before application.");

const validateBody = functionBody(html, "validateLocalBundleShape");
[
  "schemaVersion",
  "monsters",
  "skills",
  "passives",
  "monster.stats",
  "monster.skillIds",
  "monster.passiveIds",
  "skill.category",
  "skill.mode",
  "skill.power",
  "skill.pp",
  "skill.energyCost",
  "skill.description",
].forEach((needle) => assertIncludes(validateBody, needle, `Import validation must check ${needle}.`));
assertIncludes(html, "function rejectForbiddenBundleContent", "Admin imports must reject source, URL, image, and metadata traces.");

const importAdminBody = functionBody(html, "importAdminBundleFile");
assert(importAdminBody.includes("localStorage.setItem(ADMIN_DATA_STORAGE_KEY"), "Admin imports must save only to localStorage.");
assert(importAdminBody.includes("已导入数据包："), "Admin import success must use the requested Chinese success copy.");
assert(importAdminBody.includes("只精灵") && importAdminBody.includes("个技能") && importAdminBody.includes("个特性"), "Admin import success must report monsters, skills, and passives only.");
assert(!importAdminBody.includes("血脉"), "Admin import success must not report imported bloodlines.");

const exportAdminBody = functionBody(html, "exportAdminBundle");
assertIncludes(exportAdminBody, 'new Blob(', "Admin export must create a local JSON file.");
assertIncludes(exportAdminBody, '"local-bundle.json"', "Admin export filename must be local-bundle.json.");
assertIncludes(exportAdminBody, "activeLocalBundle", "Admin export must use the currently active validated bundle.");

const renderAdminBody = functionBody(html, "renderAdminBar");
assertIncludes(renderAdminBody, "isAdminMode()", "Admin toolbar rendering must use the current hash mode.");
assertIncludes(html, 'window.addEventListener("hashchange"', "Hash changes must immediately update admin mode and data loading.");
assertIncludes(html, 'id="adminImportDataBtn" type="button">导入数据</button>', "Admin mode must expose 导入数据.");
assertIncludes(html, 'id="adminExportDataBtn" type="button">导出数据</button>', "Admin mode must expose 导出数据.");
assertIncludes(html, 'id="adminClearDataBtn" type="button">清除导入数据</button>', "Admin mode must expose 清除导入数据.");

const topActionsMatch = html.match(/<div class="actions">([\s\S]*?)<\/div>/);
assert(topActionsMatch, "Main top action bar is missing.");
const topActionIds = [...topActionsMatch[1].matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
assert(
  JSON.stringify(topActionIds) === JSON.stringify(["rollerBtn", "undoRollerBtn", "clearBtn"]),
  `Normal users must see only the three main action buttons, found: ${topActionIds.join(", ")}.`
);

const startupBody = functionBody(html, "startApp");
assert(startupBody.includes("await loadDexData()"), "Startup must wait for local-bundle.json before rendering.");
assert(startupBody.includes("setupAdminDataPanel()"), "Startup must expose the maintenance-only import panel in admin hash mode.");

const applyBody = functionBody(html, "applyDexData");
assert(applyBody.includes("monsters: withBossForms("), "applyDexData must still generate fixed boss forms at runtime.");
["monsterById", "skillById", "passiveById", "bloodlineById"].forEach((mapName) => {
  assertIncludes(applyBody, `${mapName} = new Map(`, `applyDexData must rebuild ${mapName}.`);
});
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
  "const DATA_STORAGE_KEY",
  "saveDexDataToStorage",
  "updateDexData",
  "importDataBtn",
  "exportDataBtn",
  "clearLocalDataBtn",
  "maintenanceBtn",
].forEach((needle) => assertNotIncludes(html, needle, `index.html must not contain old single-file or maintenance chain: ${needle}`));

const fallbackBody = constObjectBody(html, "FALLBACK_DATA");
assertNotIncludes(fallbackBody, "pvpPresets", "FALLBACK_DATA must not carry pvpPresets.");
assertNotIncludes(fallbackBody, "bloodlines", "FALLBACK_DATA must not carry bloodlines; fixed BLOODLINES should be applied by runtime.");
[
  "示例精灵A",
  "示例精灵B",
  "示例技能A",
  "示例技能B",
  "示例特性A",
  "示例特性B",
].forEach((name) => assertIncludes(fallbackBody, name, `FALLBACK_DATA must clearly use built-in sample name ${name}.`));
[
  "迪莫",
  "王蜥",
  "闪光",
  "放晴",
  "最好的伙伴",
  "防守反击",
].forEach((name) => assertNotIncludes(fallbackBody, name, `FALLBACK_DATA must not look like formal data: ${name}.`));
assertNotIncludes(html, "patchwiki.biligame.com", "index.html must not request patchwiki assets.");
assertNotIncludes(html, "rocomwiki.app", "index.html must not request rocomwiki assets.");
assertNotIncludes(html, "sourceCommit", "index.html must not keep source metadata fields.");
assertNotIncludes(html, "assets/roller-skill.png", "index.html must embed the roller button image instead of requesting an asset file.");
assertIncludes(html, 'src="data:image/png;base64,', "index.html must embed the roller button image.");
assertIncludes(html, "const STAT_ICON_DATA_URIS = {", "index.html must embed the six local stat icons.");
assertIncludes(html, "const TYPE_ICON_ASSETS = {", "index.html must declare local type icon assets.");
assertIncludes(html, "assets/type-icons/ghost.png", "index.html must use screenshot-cropped local type icon assets for attribute badges.");
assertIncludes(html, "assets/bloodline-icons/boss.png", "index.html must use the supplied local boss bloodline image.");
const embeddedPngs = html.match(/data:image\/png;base64,/g) || [];
assert(embeddedPngs.length === 7, "index.html must contain one roller image and six stat icon PNGs.");
const imgTags = html.match(/<img\b/gi) || [];
assert(imgTags.length === 4, "index.html must render images only through roller, stat, type, and local bloodline icon templates.");
assertIncludes(
  html,
  "页面默认读取线上数据包；如数据包不可用，将使用内置兜底数据。本工具为非官方阵容与伤害计算辅助工具。",
  "Footer must use the neutral release copy."
);

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
const sourceIssues = [];
inspectSource(bundle, "bundle");
function inspectSource(value, pathName) {
  if (typeof value === "string") {
    if (/bwiki|BWiki|BWIKI|patchwiki|rocomwiki|biligame|https?:/i.test(value)) {
      sourceIssues.push(`${pathName}: ${value.slice(0, 120)}`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectSource(item, `${pathName}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => inspectSource(item, `${pathName}.${key}`));
  }
}
assert(sourceIssues.length === 0, `data/local-bundle.json must not contain BWiki/source fields:\n${sourceIssues.slice(0, 10).join("\n")}`);

console.log("External local bundle static checks passed.");
