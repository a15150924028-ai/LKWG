const fs = require("fs");
const path = require("path");
const vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
const hpScript = scripts.find((script) => script.includes("LKWG_PVP_HP_RULES"));
assert(hpScript, "PVP HP settlement module is missing.");

const sandbox = {};
vm.runInNewContext(hpScript, sandbox);
const hpRules = sandbox.LKWG_PVP_HP_RULES;
assert(hpRules, "PVP HP rules must be exported.");

assert(hpRules.clampHp(120, 100) === 100, "HP must clamp to max HP.");
assert(hpRules.clampHp(-5, 100) === 0, "HP must not go below zero.");

const normalDamage = hpRules.settleIncomingDamage({
  state: { currentHp: 80 },
  maxHp: 100,
  incomingDamage: 30,
  defenderAction: null
});
assert(normalDamage.nextHp === 50, "Normal incoming damage must subtract current HP.");
assert(normalDamage.damageTaken === 30, "Normal incoming damage should be recorded as taken damage.");
assert(normalDamage.heal === 0, "Normal incoming damage should not heal.");

const lethalDamage = hpRules.settleIncomingDamage({
  state: { currentHp: 20 },
  maxHp: 100,
  incomingDamage: 50,
  defenderAction: null
});
assert(lethalDamage.nextHp === 0, "Damage must clamp at zero HP.");
assert(lethalDamage.damageTaken === 20, "Taken damage should clamp to available HP.");

const fearless = {
  name: "无畏之心",
  category: "defense",
  description: "减伤100%，应对攻击：将减免的伤害转化为等量生命恢复，且本技能能耗永久+2。"
};
assert(hpRules.actionHasFearlessHeart(fearless), "无畏之心 must be recognized as damage-to-heal defense.");
const fearlessResult = hpRules.settleIncomingDamage({
  state: { currentHp: 40 },
  maxHp: 100,
  incomingDamage: 30,
  defenderAction: fearless,
  responseType: "defense-attack"
});
assert(fearlessResult.nextHp === 70, "无畏之心 should heal by the prevented final damage.");
assert(fearlessResult.damageTaken === 0, "无畏之心 should take zero actual damage.");
assert(fearlessResult.heal === 30, "无畏之心 heal should equal the pre-skill-reduction incoming damage.");

const turnHp = hpRules.resolveTurnHp({
  allyState: { currentHp: 40 },
  enemyState: { currentHp: 90 },
  allyMaxHp: 100,
  enemyMaxHp: 120,
  allyOutgoingDamage: 30,
  enemyOutgoingDamage: 25,
  allyAction: fearless,
  enemyAction: { name: "攻击", category: "physical" },
  order: { allyResponse: { type: "defense-attack" }, enemyResponse: { type: "" } }
});
assert(turnHp.ally.nextHp === 65, "Enemy outgoing damage should be converted into ally healing by 无畏之心.");
assert(turnHp.enemy.nextHp === 60, "Ally outgoing damage should subtract enemy HP.");

assert(html.includes("currentHp"), "PVP side state must store current HP.");
assert(html.includes("function currentPvpTurnHp("), "PVP panel must compute turn HP settlement.");
assert(html.includes("function applyPvpTurnHp("), "PVP panel must apply turn HP settlement.");
assert(
  !html.includes("data-pvp-current-hp"),
  "The buff panel must not contain current HP controls or their UI event bindings."
);
assert(html.includes("window.LKWG_PVP_HP_RULES.resolveTurnHp"), "PVP panel must use centralized HP settlement.");
assert(html.includes("applyPvpTurnHp(context)"), "The settle-turn flow must apply HP changes.");

console.log("PVP HP settlement static checks passed.");
