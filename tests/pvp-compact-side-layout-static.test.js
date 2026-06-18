const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function mediaBlock(query) {
  const marker = `@media ${query} {`;
  const start = html.indexOf(marker);
  assert(start !== -1, `Missing media query: ${query}`);
  const bodyStart = start + marker.length;
  let depth = 1;
  for (let index = bodyStart; index < html.length; index += 1) {
    if (html[index] === "{") depth += 1;
    if (html[index] === "}") depth -= 1;
    if (depth === 0) return html.slice(bodyStart, index);
  }
  throw new Error(`Unclosed media query: ${query}`);
}

const sideSource = extractFunction("renderPvpSide");
const phoneBlock = mediaBlock("(max-width: 760px)");
const narrowPhoneBlock = mediaBlock("(max-width: 430px)");

assert(
  sideSource.includes('class="pvp-compact-row pvp-identity-row"'),
  "PVP side forms must group monster and bloodline into one compact row."
);
assert(
  sideSource.includes('class="field pvp-compact-field pvp-compact-field-single"') &&
    sideSource.includes('data-pvp-combo="${side}-monster"') &&
    sideSource.includes('data-pvp-combo="${side}-bloodline"'),
  "PVP monster and bloodline controls must use inset compact fields."
);
assert(
  sideSource.includes('class="pvp-compact-row pvp-build-row"'),
  "PVP side forms must group nature and talents into a compact build row."
);
assert(
  sideSource.includes('data-pvp-combo="${side}-nature"') &&
    sideSource.includes('class="field pvp-compact-field pvp-compact-field-group"'),
  "PVP nature, talents, and stats must use inset compact fields."
);
assert(
  sideSource.includes('class="pvp-build-presets"') &&
    sideSource.includes('data-pvp-build-preset="${preset.id}"'),
  "Enemy PVP default-build presets must render in one compact control row."
);
assert(
  /\.pvp-build-presets\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s.test(html) &&
    /\.pvp-build-preset\s*\{[^}]*min-height:\s*28px;[^}]*border-radius:\s*var\(--radius-pill\);/s.test(html),
  "PVP default-build presets must use three equal compact Liquid Glass pill buttons."
);
assert(
  /\.pvp-side-form\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/s.test(html),
  "PVP side form should use a single vertical stack of compact rows."
);
assert(
  /\.pvp-compact-row\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s.test(html),
  "PVP compact rows must be two equal columns so bloodline sits beside monster."
);
assert(
  /\.pvp-side-form\s+\.pvp-compact-field\s*>\s*label\s*\{[^}]*position:\s*absolute;/s.test(html),
  "PVP compact labels must be inset into their field borders."
);
assert(
  sideSource.includes('class="field pvp-compact-field pvp-compact-field-group pvp-stats-field"') &&
    /\.pvp-side-form\s+\.pvp-stats-field\s*>\s*label\s*\{[^}]*position:\s*static;[^}]*background:\s*transparent;/s.test(html),
  "PVP stats labels must sit inside the stats frame instead of floating into the preset row."
);
assert(
  /\.pvp-sim-grid\s*\{[\s\S]*?grid-template-columns:\s*1fr;/.test(phoneBlock),
  "Phone-width PVP simulator must stack ally and enemy panels into one column."
);
assert(
  /\.pvp-build-row\s*\{[\s\S]*?grid-template-columns:\s*1fr;[\s\S]*?align-items:\s*start;/.test(phoneBlock),
  "Phone-width PVP build rows must stack nature above talents to avoid stretched empty fields."
);
assert(
  /\.pvp-side-form\s+\.pvp-build-row\s+\.talent-picks\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/.test(phoneBlock),
  "Phone-width PVP talent picks must stay in one compact three-column row."
);
assert(
  /\.pvp-build-presets\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/.test(phoneBlock),
  "Phone-width enemy build presets must remain in one three-button row."
);
assert(
  /\.pvp-buff-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/.test(phoneBlock),
  "Phone-width PVP buff controls must show two items per row."
);
assert(
  /\.pvp-buff-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/.test(narrowPhoneBlock),
  "Very narrow PVP buff controls must still keep two items per row."
);

console.log("PVP compact side layout static checks passed.");
