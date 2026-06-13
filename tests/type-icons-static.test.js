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
  "ground",
  "boss",
  "any"
];

const referenceStyleMarkers = {
  grass: "leaf-mark",
  water: "drop-mark",
  fire: "flame-mark",
  electric: "bolt-sharp",
  poison: "poison-bubbles",
  fantasy: "spiral-mark",
  ice: "snowflake-mark",
  fighting: "sigil-star",
  cute: "heart-spark",
  light: "spark-star",
  dragon: "dragon-mask",
  mechanical: "gear-mark",
  ghost: "ghost-body",
  demon: "horned-face",
  bug: "ladybug-shell",
  normal: "ring-star",
  wing: "wing-swirl",
  ground: "mountain-peaks",
  boss: "crown-mark",
  any: "any-star"
};

assert(/const TYPE_ICON_ASSETS = \{/.test(html), "Missing local type icon asset map.");

for (const key of requiredIcons) {
  const assetPath = path.join(root, "assets", "type-icons", `${key}.svg`);
  assert(fs.existsSync(assetPath), `Missing local type icon asset: ${key}.svg`);
  const svg = fs.readFileSync(assetPath, "utf8");
  assert(/<svg\b/.test(svg), `${key}.svg must be an SVG icon.`);
  assert(/viewBox="0 0 64 64"/.test(svg), `${key}.svg must use a clean 64x64 viewBox.`);
  assert(!/<text\b/i.test(svg), `${key}.svg must not use text glyphs as the icon.`);
  assert(!/(?:href|src)=["']https?:\/\//i.test(svg), `${key}.svg must not reference remote assets.`);
  assert(svg.includes('data-style="reference-orbit-v2"'), `${key}.svg must use the closer reference orbit v2 style.`);
  assert(svg.includes('filter="url(#soft-shadow)"'), `${key}.svg must include soft icon depth instead of flat placeholder art.`);
  assert(svg.includes(`data-icon="${referenceStyleMarkers[key]}"`), `${key}.svg must use the reference-style ${referenceStyleMarkers[key]} drawing.`);
  assert(new RegExp(`${key}: "assets/type-icons/${key}\\.svg"`).test(html), `TYPE_ICON_ASSETS must reference ${key}.svg.`);
}

const typeBadgeBody = extractFunctionBody("typeBadgeHtml");
assert(typeBadgeBody.includes("typeIcon(badgeKey)"), "typeBadgeHtml must use the local type icon lookup.");
assert(typeBadgeBody.includes("<img"), "typeBadgeHtml must render image icons.");
assert(typeBadgeBody.includes("type-badge-icon"), "typeBadgeHtml must mark the local icon image.");
assert(!/text-icon type-badge/.test(typeBadgeBody), "typeBadgeHtml must not render old text-only type badges.");

console.log("type-icons-static.test.js passed");
