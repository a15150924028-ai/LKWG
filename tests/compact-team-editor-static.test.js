const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  fs.existsSync(path.join(root, "assets", "bloodline-icons", "boss.png")),
  "The supplied boss bloodline PNG must be stored as a local asset."
);
const bossIcon = fs.readFileSync(path.join(root, "assets", "bloodline-icons", "boss.png"));
assert(
  bossIcon[25] === 6,
  "The boss bloodline icon must be an RGBA PNG with transparency."
);
assert(
  crypto.createHash("sha256").update(bossIcon).digest("hex") ===
    "a8ad70fc357a7ee72d90ce1dde24161da7d8ac1d271a858dae62190cd75e3f74",
  "The boss bloodline icon must use the approved background-removed asset."
);
assert(
  /id:\s*"bloodline-boss"[\s\S]*?icon:\s*"assets\/bloodline-icons\/boss\.png"/.test(html),
  "The boss bloodline must reference the supplied local image."
);
assert(
  /item\?\.kind === "bloodline" && item\?\.icon/.test(html),
  "Bloodline icons must render their explicit image before falling back to type badges."
);
assert(
  /\.combo-icon\.bloodline-image-icon\s*\{[^}]*object-fit:\s*contain;[^}]*background:\s*transparent;/s.test(html),
  "The transparent boss icon must render without cropping or a replacement background."
);
assert(
  /class="field compact-field compact-field-single"/.test(html),
  "Monster, bloodline, and nature controls should use compact inset-labeled fields."
);
assert(
  /class="field compact-field compact-field-group"/.test(html),
  "Talent and skill sections should use compact inset-labeled groups."
);
assert(
  /\.compact-field\s*>\s*label[\s\S]*position:\s*absolute/.test(html),
  "Compact field labels should sit inside the group border instead of taking a separate row."
);
assert(
  /\.pet-editor\s+\.form-row[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(html),
  "Monster and bloodline fields must remain equal-width columns."
);
assert(
  /@media \(max-width:\s*760px\)[\s\S]*?\.pet-editor\s+\.form-row[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(html),
  "Monster and bloodline fields must remain side by side on mobile."
);
assert(
  /@media \(max-width:\s*760px\)[\s\S]*?\.pet-editor\s+\.skill-row[\s\S]*?grid-template-columns:\s*28px\s+minmax\(0,\s*1fr\)\s+minmax\(180px,\s*0\.72fr\)/.test(html),
  "Ordinary mobile widths should keep skill metadata on the same row."
);
assert(!html.includes("function renderPetBattleSummary"), "The removed battle summary renderer must not remain.");
assert(!html.includes("${renderPetBattleSummary(selectedMonster, pet)}"), "Team cards must not render battle summaries.");
assert(!/class="pet-summary"/.test(html), "Team card markup must not contain the battle summary panel.");

console.log("Compact team editor static checks passed.");
