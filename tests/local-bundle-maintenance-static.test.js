const fs = require("fs");
const path = require("path");

const htmlPath = path.join(
  __dirname,
  "..",
  "\u514b\u5236\u9762\u67e5\u8be2_\u65e0\u56fe\u4f4e\u98ce\u9669\u7248.html"
);
const html = fs.readFileSync(htmlPath, "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertIncludes(needle, message) {
  assert(html.includes(needle), message);
}

function functionBody(name) {
  const start = html.indexOf(`function ${name}(`);
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

const bundleMatch = html.match(
  /<script type="application\/json" id="LOCAL_BUNDLE_DATA">([\s\S]*?)<\/script>/
);
assert(bundleMatch, "The single-file build must contain #LOCAL_BUNDLE_DATA.");
const embeddedBundle = JSON.parse(bundleMatch[1]);
assert(embeddedBundle.monsters.length >= 400, "Embedded data must contain the full monster pool.");
assert(embeddedBundle.skills.length >= 450, "Embedded data must contain the skill pool.");
assert(embeddedBundle.passives.length >= 150, "Embedded data must contain passive records.");
assert(Array.isArray(embeddedBundle.bloodlines), "Embedded data must contain bloodlines.");
assert(Array.isArray(embeddedBundle.pvpPresets), "Embedded data must contain PVP presets.");

[
  'id="importDataBtn"',
  'id="exportDataBtn"',
  'id="clearLocalDataBtn"',
  'id="maintenanceBtn"',
  'id="importDataFile"',
  'id="maintenancePanel"',
  'id="maintenanceValidationResults"',
  'id="maintenanceCsvFiles"',
  'id="maintenanceBwikiUpdateBtn"',
].forEach((needle) => assertIncludes(needle, `Missing maintenance control ${needle}.`));

[
  "readEmbeddedBundle",
  "openMaintenancePanel",
  "validateManagedBundle",
  "saveMaintenanceDraftToBrowser",
  "exportManagedBundle",
  "generateSingleFileHtml",
  "importCsvFiles",
  "updateMaintenanceDraftFromBwiki",
].forEach((name) => assertIncludes(`function ${name}`, `Missing maintenance function ${name}.`));

const loadBody = functionBody("loadDexData");
assert(
  loadBody.indexOf("localStorage.getItem(DATA_STORAGE_KEY)") <
    loadBody.indexOf("readEmbeddedBundle()"),
  "Startup must check localStorage before embedded data."
);
assert(
  loadBody.indexOf("readEmbeddedBundle()") < loadBody.indexOf("FALLBACK_DATA"),
  "Startup must use embedded data before FALLBACK_DATA."
);
assert(!loadBody.includes("updateDexData("), "Startup must not call BWiki update.");
assert(!html.includes('id="updateBtn"'), "The main online update button must be removed.");
assert(
  !html.includes('updateBtn.addEventListener("click", updateDexData)'),
  "The old online update listener must be removed."
);

assertIncludes(
  "\u8be5\u529f\u80fd\u4f1a\u8054\u7f51\u8bf7\u6c42\u7b2c\u4e09\u65b9\u516c\u5f00\u6570\u636e\uff0c\u4ec5\u5efa\u8bae\u4e2a\u4eba\u5b66\u4e60\u7ef4\u62a4\u4f7f\u7528\u3002",
  "Advanced BWiki update must show the required warning."
);
assertIncludes(
  "\u514b\u5236\u9762\u67e5\u8be2_\u5185\u7f6e\u6570\u636e\u7248.html",
  "Generated HTML must use the requested filename."
);
assertIncludes(
  'downloadBundleJson(maintenanceDraft, "local-bundle.json")',
  "JSON export must use local-bundle.json."
);

const bwikiBody = functionBody("updateMaintenanceDraftFromBwiki");
assert(bwikiBody.includes("fetchRemoteBundle()"), "Advanced update must still use the existing BWiki fetcher.");
assert(
  bwikiBody.includes("maintenanceDraft ="),
  "Advanced update must place fetched data in the maintenance draft."
);
assert(
  !bwikiBody.includes("saveDexDataToStorage(") && !bwikiBody.includes("applyDexData("),
  "Advanced update must not automatically overwrite active data."
);

assert(!/patchwiki\.biligame\.com/i.test(html), "Patchwiki image links must remain disabled.");
assert(!/rocomwiki\.app\/.*\.(?:png|svg|webp)/i.test(html), "Rocomwiki image links must remain disabled.");

console.log("Local bundle and maintenance static checks passed.");
