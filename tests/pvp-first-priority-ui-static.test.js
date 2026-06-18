const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`${name} is missing.`);
  const open = html.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < html.length; index += 1) {
    if (html[index] === "{") depth += 1;
    if (html[index] === "}") {
      depth -= 1;
      if (depth === 0) return html.slice(start, index + 1);
    }
  }
  throw new Error(`${name} source is incomplete.`);
}

const buffSource = extractFunction("renderPvpManualBuffPanel");
const refreshSource = extractFunction("refreshPvpManualBuffPanel");
const damageSource = extractFunction("renderPvpDamageResult");
const damageHeroSource = extractFunction("renderPvpDamageHero");

assert(
  buffSource.includes('<details class="pvp-advanced" data-pvp-advanced="${side}">'),
  "PVP advanced modifiers must render inside a details element."
);
assert(
  !/<details class="pvp-advanced"[^>]*\sopen\b/.test(buffSource),
  "PVP advanced modifiers must be collapsed by default."
);
assert(
  buffSource.includes("高级修正") && buffSource.includes('data-pvp-advanced-count="${side}"'),
  "PVP advanced summary must show the current modifier count."
);
assert(
  html.includes("function pvpAdvancedAdjustmentCount") &&
    refreshSource.includes('data-pvp-advanced-count="${side}"'),
  "PVP advanced modifier count must update when values change."
);
assert(
  /\.pvp-advanced\s*>\s*summary\s*\{[^}]*cursor:\s*pointer;/s.test(html) &&
    /\.pvp-advanced\[open\]\s+\.pvp-advanced-chevron\s*\{[^}]*transform:\s*rotate\(180deg\);/s.test(html),
  "PVP advanced details summary must have dedicated collapsed/expanded styling."
);
assert(
  damageHeroSource.includes('class="pvp-damage-hero"') &&
    damageHeroSource.includes('class="pvp-damage-number"') &&
    damageHeroSource.includes('class="pvp-damage-percent"') &&
    damageSource.includes("renderPvpDamageHero(damage") &&
    damageSource.includes('class="pvp-damage-meta"'),
  "PVP damage output must separate hero damage, percent loss, and rule metadata."
);
assert(
  /\.pvp-damage-number\s*\{[^}]*font-size:\s*32px;[^}]*font-weight:\s*900;[^}]*linear-gradient\(135deg,\s*#6C63FF,\s*#4DA3FF\)/s.test(html),
  "PVP damage number must be large gradient text."
);

console.log("PVP first-priority UI static checks passed.");
