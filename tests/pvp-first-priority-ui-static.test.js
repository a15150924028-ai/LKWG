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
const renderResultsSource = extractFunction("renderResults");

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
  buffSource.includes('class="pvp-advanced-hint"') &&
    buffSource.includes("点开修改层数、能量和临时加成"),
  "PVP advanced summary must include a clear click hint."
);
assert(
  buffSource.includes('class="pvp-advanced-action-open">调整') &&
    buffSource.includes('class="pvp-advanced-action-close">收起'),
  "PVP advanced summary must expose an adjustment CTA that changes when expanded."
);
assert(
  html.includes("function pvpAdvancedAdjustmentCount") &&
    refreshSource.includes('data-pvp-advanced-count="${side}"'),
  "PVP advanced modifier count must update when values change."
);
assert(
  html.includes("function capturePvpAdvancedOpenState") &&
    html.includes("function restorePvpAdvancedOpenState") &&
    renderResultsSource.includes("const advancedOpenState = capturePvpAdvancedOpenState();") &&
    renderResultsSource.includes("restorePvpAdvancedOpenState(advancedOpenState);"),
  "PVP advanced modifiers must stay open across panel rerenders such as cute +1 form changes."
);
assert(
  /\.pvp-advanced\s*>\s*summary\s*\{[^}]*cursor:\s*pointer;/s.test(html) &&
    /\.pvp-advanced-action\s*\{[^}]*border-radius:\s*var\(--radius-pill\);[^}]*linear-gradient\(135deg, rgba\(108, 99, 255, 0\.16\), rgba\(77, 163, 255, 0\.18\)\)/s.test(html) &&
    /\.pvp-advanced\[open\]\s+\.pvp-advanced-action-open\s*\{[^}]*display:\s*none;/s.test(html) &&
    /\.pvp-advanced\[open\]\s+\.pvp-advanced-action-close\s*\{[^}]*display:\s*inline;/s.test(html) &&
    /\.pvp-advanced\[open\]\s+\.pvp-advanced-chevron\s*\{[^}]*transform:\s*rotate\(180deg\);/s.test(html),
  "PVP advanced details summary must look clickable and have collapsed/expanded CTA styling."
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
