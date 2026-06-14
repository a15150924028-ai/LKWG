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
  "function currentPvpTurnDamage(",
  "function pvpTurnOutgoingDamage("
].forEach((needle) => {
  assert(html.includes(needle), `${needle} must remain available for settlement logic.`);
});

assert(
  extractFunction("pvpTurnDamageForSide").includes("calcPvpDamage(attackerState, defenderState, action, { actsBeforeDefender })"),
  "Shared turn damage must keep using the turn-order-aware calcPvpDamage path."
);
assert(
  extractFunction("renderPvpDamageResult").includes("currentPvpTurnDamage(currentPvpTurnContext())[side]"),
  "Visible damage results must read the shared turn damage result instead of calculating separately."
);
assert(
  extractFunction("currentPvpTurnHp").includes("const turnDamage = currentPvpTurnDamage(context)") &&
    extractFunction("currentPvpTurnHp").includes("pvpTurnOutgoingDamage(turnDamage.ally)") &&
    extractFunction("currentPvpTurnHp").includes("pvpTurnOutgoingDamage(turnDamage.enemy)"),
  "Turn settlement HP must read the same shared turn damage result as the visible cards."
);

console.log("PVP hidden turn panel static checks passed.");
