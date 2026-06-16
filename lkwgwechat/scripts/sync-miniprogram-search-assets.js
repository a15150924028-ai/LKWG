const fs = require("fs");
const path = require("path");

const packageRoot = path.resolve(__dirname, "..");
const repositoryRoot = path.resolve(packageRoot, "..");
const htmlPath = path.join(repositoryRoot, "index.html");
const iconPath = path.join(
  packageRoot,
  "miniprogram",
  "assets",
  "roller-skill.png"
);
const pinyinMapPath = path.join(
  packageRoot,
  "miniprogram",
  "utils",
  "generated",
  "pinyin-map.js"
);
const typeIconKeys = [
  "grass", "water", "fire", "electric", "poison", "fantasy", "ice",
  "fighting", "cute", "light", "dragon", "mechanical", "ghost",
  "demon", "bug", "normal", "wing", "ground"
];
const statIconKeys = ["hp", "atk", "defense", "spa", "spd", "spe"];
const checkOnly = process.argv.includes("--check");

function extractIcon(html) {
  const match = html.match(
    /class="button-icon roller-icon" src="data:image\/png;base64,([^"]+)"/
  );
  if (!match) throw new Error("Could not find the embedded web roller icon.");
  return Buffer.from(match[1], "base64");
}

function extractPinyinMap(html) {
  const start = html.indexOf("const PINYIN_MAP = ");
  const end = html.indexOf("function normalizeSearchText", start);
  if (start < 0 || end < 0) {
    throw new Error("Could not find the web PINYIN_MAP block.");
  }
  const block = html
    .slice(start, end)
    .trim()
    .replace(/^ {4}/gm, "");
  return [
    "// Generated from index.html by sync-miniprogram-search-assets.js.",
    block,
    "module.exports = PINYIN_MAP;",
    ""
  ].join("\n");
}

function extractStatIcons(html) {
  const start = html.indexOf("const STAT_ICON_DATA_URIS = ");
  const end = html.indexOf("function statIconDataUri", start);
  if (start < 0 || end < 0) {
    throw new Error("Could not find the web STAT_ICON_DATA_URIS block.");
  }
  const block = html.slice(start, end);
  return Object.fromEntries(statIconKeys.map((key) => {
    const match = block.match(new RegExp(`${key}: "data:image/png;base64,([^"]+)"`));
    if (!match) throw new Error(`Could not find stat icon: ${key}`);
    return [key, Buffer.from(match[1], "base64")];
  }));
}

function sameFile(targetPath, expected) {
  if (!fs.existsSync(targetPath)) return false;
  const actual = fs.readFileSync(targetPath);
  const expectedBuffer = Buffer.isBuffer(expected)
    ? expected
    : Buffer.from(expected, "utf8");
  return actual.equals(expectedBuffer);
}

function writeGenerated(targetPath, content) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content);
}

const html = fs.readFileSync(htmlPath, "utf8");
const icon = extractIcon(html);
const pinyinMap = extractPinyinMap(html);
const statIcons = extractStatIcons(html);
const iconCurrent = sameFile(iconPath, icon);
const pinyinCurrent = sameFile(pinyinMapPath, pinyinMap);
const copiedAssets = [
  ...typeIconKeys.map((key) => ({
    source: path.join(repositoryRoot, "assets", "type-icons", `${key}.png`),
    target: path.join(packageRoot, "miniprogram", "assets", "type-icons", `${key}.png`)
  })),
  {
    source: path.join(repositoryRoot, "assets", "bloodline-icons", "boss.png"),
    target: path.join(packageRoot, "miniprogram", "assets", "bloodline-icons", "boss.png")
  }
];
const copiedAssetsCurrent = copiedAssets.every(({ source, target }) => (
  sameFile(target, fs.readFileSync(source))
));
const statIconsCurrent = Object.entries(statIcons).every(([key, buffer]) => (
  sameFile(
    path.join(packageRoot, "miniprogram", "assets", "stat-icons", `${key}.png`),
    buffer
  )
));

if (checkOnly) {
  if (!iconCurrent || !pinyinCurrent || !copiedAssetsCurrent || !statIconsCurrent) {
    throw new Error("Mini Program search assets are not synchronized.");
  }
  console.log("Mini Program search assets are synchronized.");
  process.exit(0);
}

if (!iconCurrent) writeGenerated(iconPath, icon);
if (!pinyinCurrent) writeGenerated(pinyinMapPath, pinyinMap);
for (const { source, target } of copiedAssets) {
  const expected = fs.readFileSync(source);
  if (!sameFile(target, expected)) writeGenerated(target, expected);
}
for (const [key, buffer] of Object.entries(statIcons)) {
  const target = path.join(packageRoot, "miniprogram", "assets", "stat-icons", `${key}.png`);
  if (!sameFile(target, buffer)) writeGenerated(target, buffer);
}

console.log(
  `Synchronized roller icon (${icon.length} bytes), selector icons, and pinyin map.`
);
