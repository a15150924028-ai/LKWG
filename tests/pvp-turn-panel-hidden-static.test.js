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

const renderSource = extractFunction("renderPvpDamageSimulation");

assert(!renderSource.includes("renderPvpTurnPreview()"), "PVP damage simulator must not render the turn-order preview panel.");
assert(!renderSource.includes("renderPvpTurnEffectPreview()"), "PVP damage simulator must not render the turn settlement preview panel.");
assert(!renderSource.includes("renderPvpTurnHistory()"), "PVP damage simulator must not render the turn history panel.");

[
  "function currentPvpTurnHp(",
  "function applyPvpTurnEffects(",
  "function recordPvpTurnSettlement(",
  "function undoPvpTurnSettlement(",
  "function clearPvpTurnHistory(",
  "function pvpTurnOutgoingDamage("
].forEach((needle) => {
  assert(html.includes(needle), `${needle} must remain available for settlement logic.`);
});

assert(
  extractFunction("pvpTurnOutgoingDamage").includes("calcPvpDamage(attackerState, defenderState, action)"),
  "Turn settlement damage must keep using the same calcPvpDamage path as the visible damage result."
);
assert(
  extractFunction("renderPvpDamageResult").includes("const damage = calcPvpDamage(state, opponentState, action);"),
  "Visible damage results must keep using calcPvpDamage."
);

console.log("PVP hidden turn panel static checks passed.");
