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

const sideSource = extractFunction("renderPvpSide");

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

console.log("PVP compact side layout static checks passed.");
