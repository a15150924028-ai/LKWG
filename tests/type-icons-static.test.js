const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extractFunctionBody(name) {
  const start = html.indexOf(`function ${name}`);
  assert(start !== -1, `Missing function ${name}.`);
  const braceStart = html.indexOf("{", start);
  let depth = 0;
  for (let index = braceStart; index < html.length; index += 1) {
    if (html[index] === "{") depth += 1;
    if (html[index] === "}") depth -= 1;
    if (depth === 0) return html.slice(braceStart + 1, index);
  }
  throw new Error(`Unclosed function ${name}.`);
}

const requiredIcons = [
  "grass",
  "water",
  "fire",
  "electric",
  "poison",
  "fantasy",
  "ice",
  "fighting",
  "cute",
  "light",
  "dragon",
  "mechanical",
  "ghost",
  "demon",
  "bug",
  "normal",
  "wing",
  "ground"
];

const fallbackIcons = [
  "boss",
  "any"
];

function pngInfo(buffer) {
  assert(buffer.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), "Invalid PNG signature.");
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    bitDepth: buffer.readUInt8(24),
    colorType: buffer.readUInt8(25)
  };
}

assert(/const TYPE_ICON_ASSETS = \{/.test(html), "Missing local type icon asset map.");

for (const key of requiredIcons) {
  const assetPath = path.join(root, "assets", "type-icons", `${key}.png`);
  const staleSvgPath = path.join(root, "assets", "type-icons", `${key}.svg`);
  assert(!fs.existsSync(staleSvgPath), `${key}.svg must not remain as the active/generated attribute icon asset.`);
  assert(fs.existsSync(assetPath), `Missing screenshot-cropped local type icon asset: ${key}.png`);
  const info = pngInfo(fs.readFileSync(assetPath));
  assert(info.width === 96 && info.height === 96, `${key}.png must be a 96x96 safe-crop image.`);
  assert(info.bitDepth === 8 && info.colorType === 6, `${key}.png must be an RGBA PNG with transparency.`);
  assert(new RegExp(`${key}: "assets/type-icons/${key}\\.png"`).test(html), `TYPE_ICON_ASSETS must reference ${key}.png.`);
}

for (const key of fallbackIcons) {
  const assetPath = path.join(root, "assets", "type-icons", `${key}.svg`);
  assert(fs.existsSync(assetPath), `Missing local fallback type icon asset: ${key}.svg`);
  const svg = fs.readFileSync(assetPath, "utf8");
  assert(/<svg\b/.test(svg), `${key}.svg must remain a local SVG fallback icon.`);
  assert(!/(?:href|src)=["']https?:\/\//i.test(svg), `${key}.svg must not reference remote assets.`);
  assert(new RegExp(`${key}: "assets/type-icons/${key}\\.svg"`).test(html), `TYPE_ICON_ASSETS must reference ${key}.svg.`);
}

const typeBadgeBody = extractFunctionBody("typeBadgeHtml");
assert(typeBadgeBody.includes("typeIcon(badgeKey)"), "typeBadgeHtml must use the local type icon lookup.");
assert(typeBadgeBody.includes("<img"), "typeBadgeHtml must render image icons.");
assert(typeBadgeBody.includes("type-badge-icon"), "typeBadgeHtml must mark the local icon image.");
assert(!/text-icon type-badge/.test(typeBadgeBody), "typeBadgeHtml must not render old text-only type badges.");

console.log("type-icons-static.test.js passed");
