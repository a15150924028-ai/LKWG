const fs = require("fs");
const path = require("path");
const vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  assert(start >= 0, `${name} is missing.`);
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

const sandbox = {
  FORCE_IMPACT_POWER: 80,
  bloodlineById: new Map([
    ["bloodline-fire", { id: "bloodline-fire", type: "fire" }],
    ["bloodline-boss", { id: "bloodline-boss" }]
  ])
};

vm.createContext(sandbox);
vm.runInContext(`
  ${extractFunction("isBossBloodlineId")}
  ${extractFunction("forceImpactLocked")}
  ${extractFunction("forceImpactSkill")}
  this.forceImpactLocked = forceImpactLocked;
  this.forceImpactSkill = forceImpactSkill;
`, sandbox);

assert(sandbox.forceImpactLocked({ bloodlineId: "" }), "Force Impact must be locked when no bloodline is selected.");
assert(sandbox.forceImpactLocked({ bloodlineId: "missing" }), "Force Impact must be locked for an invalid bloodline.");
assert(sandbox.forceImpactLocked({ bloodlineId: "bloodline-boss" }), "Boss bloodline must keep Force Impact locked.");
assert(!sandbox.forceImpactLocked({ bloodlineId: "bloodline-fire" }), "A valid attribute bloodline must unlock Force Impact.");

assert(sandbox.forceImpactSkill({ bloodlineId: "" }, { types: ["water"] }) === null, "Force Impact must not fall back to the monster's first type.");
assert(sandbox.forceImpactSkill({ bloodlineId: "missing" }, { types: ["water"] }) === null, "Invalid bloodlines must not create Force Impact.");
assert(sandbox.forceImpactSkill({ bloodlineId: "bloodline-boss" }, { types: ["water"] }) === null, "Boss bloodline must not create Force Impact.");
assert(sandbox.forceImpactSkill({ bloodlineId: "bloodline-fire" }, { types: ["water"] }).type === "fire", "Force Impact type must come from the selected attribute bloodline.");

console.log("PVP Force Impact bloodline checks passed.");
