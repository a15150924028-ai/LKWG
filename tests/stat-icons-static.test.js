const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(/const STAT_ICON_DATA_URIS = \{/.test(html), "Missing embedded stat icon map.");
["hp", "atk", "spa", "defense", "spd", "spe"].forEach((key) => {
  assert(new RegExp(`${key}: "data:image/png;base64,`).test(html), `Missing embedded ${key} icon.`);
});
assert(/function statIconDataUri\(statKey\)/.test(html), "Missing stat icon resolver.");
assert(/function natureBoostStatKey\(natureId\)/.test(html), "Missing nature boost stat resolver.");
assert(/PVP_NATURES\.forEach\(\(nature\)/.test(html), "Nature records must receive embedded icons.");
assert(/PVP_TALENTS\.forEach\(\(talent\)/.test(html), "Talent records must receive embedded icons.");
assert(/nature\.boostStat = natureBoostStatKey\(nature\.id\)/.test(html), "Nature icons must use the boosted stat.");
assert(/item\?\.iconDataUri/.test(html), "Generic combo rendering must support embedded icons.");
assert(/className\)} stat-image-icon/.test(html), "Embedded stat icons must use the image icon class.");

console.log("stat-icons-static.test.js passed");
