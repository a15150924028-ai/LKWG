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

const sideFormSource = extractFunction("renderPvpSide");

assert(
  !sideFormSource.includes("renderMonsterPreview("),
  "PVP side forms should not render the large monster preview block."
);
assert(
  sideFormSource.includes("renderPvpDamageResult(side)"),
  "PVP side forms must keep the skill damage result output."
);
assert(
  html.includes('data-pvp-damage-result="${side}"'),
  "PVP damage result nodes must remain available for calculation updates."
);

console.log("No PVP monster preview static checks passed.");
