const fs = require("fs");
const path = require("path");
const vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
const energyScript = scripts.find((script) => script.includes("LKWG_PVP_ENERGY_RULES"));
assert(energyScript, "PVP energy module is missing.");

const sandbox = {};
vm.runInNewContext(energyScript, sandbox);
const energyRules = sandbox.LKWG_PVP_ENERGY_RULES;
assert(energyRules, "PVP energy rules must be exported.");

const slash = { id: "skill-slash", name: "斩断", type: "demon", category: "special", pp: 2, description: "造成魔伤。" };
const ground = { id: "skill-ground", name: "泥浆", type: "ground", category: "special", pp: 4, description: "造成魔伤。" };
const waterBlade = { id: "skill-water-blade", name: "水刃", type: "water", category: "physical", pp: 4, description: "造成物伤，应对状态：本技能能耗永久-3。" };
const fearless = { id: "skill-fearless", name: "无畏之心", type: "normal", category: "defense", pp: 5, description: "减伤100%，应对攻击：将减免的伤害转化为等量生命恢复，且本技能能耗永久+2。" };
const attack = { id: "skill-attack", name: "攻击", type: "fire", category: "physical", pp: 3, description: "造成物伤。" };

assert(energyRules.baseSkillCost(slash) === 2, "Base skill cost must read pp when energyCost is absent.");
assert(energyRules.currentSkillCost(slash, { skillCostOverrides: { "skill-slash": 5 } }) === 5, "Current skill cost must use per-skill overrides.");
assert(energyRules.effectiveSkillCost(ground, {}, { weatherCostReduction: 2 }) === 2, "Weather reduction must lower effective cost.");
assert(energyRules.effectiveSkillCost(ground, {}, { weatherCostReduction: 9 }) === 0, "Effective cost cannot go below zero.");

const bladeEnergy = energyRules.resolveActionEnergy(waterBlade, {
  state: { energy: 10, skillCostOverrides: {} },
  responseType: "attack-status"
});
assert(bladeEnergy.cost === 4, "Current 水刃 release must pay the pre-change cost.");
assert(bladeEnergy.nextEnergy === 6, "Current energy must subtract the effective cost.");
assert(bladeEnergy.skillCostDelta === -3, "水刃 response must declare permanent cost -3.");
assert(bladeEnergy.nextSkillCost === 1, "水刃 permanent -3 must affect the next release cost.");

const bladeSecondUse = energyRules.resolveActionEnergy(waterBlade, {
  state: { energy: 6, skillCostOverrides: { "skill-water-blade": 1 } },
  responseType: ""
});
assert(bladeSecondUse.cost === 1, "Next 水刃 release must use the stored reduced cost.");
assert(bladeSecondUse.nextSkillCost === 1, "No response means no further permanent cost change.");

const fearlessEnergy = energyRules.resolveActionEnergy(fearless, {
  state: { energy: 10, skillCostOverrides: {} },
  responseType: "defense-attack"
});
assert(fearlessEnergy.cost === 5, "Current 无畏之心 release must pay the pre-change cost.");
assert(fearlessEnergy.nextSkillCost === 7, "无畏之心 response must increase next release cost by 2.");
assert(fearlessEnergy.labels.some((label) => label.includes("能耗永久+2")), "Permanent cost increase must produce a visible label.");

const turnEnergy = energyRules.resolveTurnEnergy({
  allyAction: waterBlade,
  enemyAction: attack,
  order: { allyResponse: { type: "attack-status" }, enemyResponse: { type: "" } },
  allyState: { energy: 10, skillCostOverrides: {} },
  enemyState: { energy: 3, skillCostOverrides: {} }
});
assert(turnEnergy.ally.nextEnergy === 6, "Turn energy settlement must include ally action cost.");
assert(turnEnergy.enemy.nextEnergy === 0, "Turn energy settlement must floor enemy energy at zero.");
assert(turnEnergy.ally.skillCostOverrides["skill-water-blade"] === 1, "Turn energy settlement must carry ally permanent cost overrides.");

assert(html.includes("function applyPvpTurnEnergy("), "PVP panel must apply energy during turn settlement.");
assert(html.includes("data-pvp-energy-value"), "PVP panel must display current energy.");
assert(html.includes("data-pvp-energy="), "PVP panel must expose energy controls.");
assert(html.includes("skillCostOverrides"), "PVP state must store per-skill cost overrides.");
assert(html.includes("window.LKWG_PVP_ENERGY_RULES.resolveTurnEnergy"), "PVP panel must use centralized turn-energy settlement.");

console.log("PVP energy static checks passed.");
