const fs = require("fs");
const path = require("path");
const vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
const cooldownScript = scripts.find((script) => script.includes("LKWG_PVP_COOLDOWN_RULES"));
assert(cooldownScript, "PVP cooldown module is missing.");

const sandbox = {};
vm.runInNewContext(cooldownScript, sandbox);
const cooldownRules = sandbox.LKWG_PVP_COOLDOWN_RULES;
assert(cooldownRules, "PVP cooldown rules must be exported.");

const defense = { name: "水泡盾", category: "defense", description: "减伤80%，应对攻击：自己获得魔攻+70%。" };
const barrier = { name: "壁垒", category: "defense", description: "减伤90%，应对攻击：防御技能冷却-1。" };
const attack = { name: "攻击", category: "physical", description: "造成物伤。" };

assert(cooldownRules.isDefenseAction(defense), "Defense actions must be recognized.");
assert(!cooldownRules.isDefenseAction(attack), "Attack actions must not be treated as defense actions.");
assert(cooldownRules.baseDefenseCooldown(defense, "") === 1, "Defense skills must default to one settled-turn cooldown.");
assert(cooldownRules.baseDefenseCooldown(barrier, "defense-attack") === 0, "壁垒 response success must remove its default cooldown.");

const normalUse = cooldownRules.resolveTurnCooldowns({
  allyAction: defense,
  enemyAction: attack,
  order: { allyResponse: { type: "defense-attack" }, enemyResponse: { type: "" } },
  allyState: { defenseBlockTurns: 0 },
  enemyState: { defenseBlockTurns: 0 },
  effects: { ally: { defenseBlockTurns: 0 }, enemy: { defenseBlockTurns: 0 } }
});
assert(normalUse.ally.defenseBlockTurns === 1, "A used defense skill must be disabled next settled turn.");

const barrierUse = cooldownRules.resolveTurnCooldowns({
  allyAction: barrier,
  enemyAction: attack,
  order: { allyResponse: { type: "defense-attack" }, enemyResponse: { type: "" } },
  allyState: { defenseBlockTurns: 0 },
  enemyState: { defenseBlockTurns: 0 },
  effects: { ally: { defenseBlockTurns: 0 }, enemy: { defenseBlockTurns: 0 } }
});
assert(barrierUse.ally.defenseBlockTurns === 0, "壁垒 response success should leave defense usable next turn.");

const brokenDefense = cooldownRules.resolveTurnCooldowns({
  allyAction: { name: "破防", category: "status", description: "敌方获得双防-70%，应对防御：额外使被应对技能冷却2回合。" },
  enemyAction: defense,
  order: { allyResponse: { type: "status-defense" }, enemyResponse: { type: "" } },
  allyState: { defenseBlockTurns: 0 },
  enemyState: { defenseBlockTurns: 0 },
  effects: { ally: { defenseBlockTurns: 0 }, enemy: { defenseBlockTurns: 2 } }
});
assert(brokenDefense.enemy.defenseBlockTurns === 2, "破防 response must replace/shared-cooldown enemy defense to two turns.");

const decay = cooldownRules.resolveTurnCooldowns({
  allyAction: attack,
  enemyAction: attack,
  order: { allyResponse: { type: "" }, enemyResponse: { type: "" } },
  allyState: { defenseBlockTurns: 2 },
  enemyState: { defenseBlockTurns: 1 },
  effects: { ally: { defenseBlockTurns: 0 }, enemy: { defenseBlockTurns: 0 } }
});
assert(decay.ally.defenseBlockTurns === 1, "Existing defense disable should decrement by one on settlement.");
assert(decay.enemy.defenseBlockTurns === 0, "One-turn defense disable should expire after settlement.");

assert(html.includes("function defenseSkillLocked("), "PVP panel must expose defense lock checks.");
assert(html.includes("function applyPvpTurnCooldowns("), "PVP panel must apply cooldown settlement.");
assert(html.includes("data-pvp-defense-lock"), "PVP panel must render defense lock text.");
assert(html.includes("window.LKWG_PVP_COOLDOWN_RULES.resolveTurnCooldowns"), "PVP panel must use centralized cooldown settlement.");
assert(html.includes("if (defenseSkillLocked(state, skill)) return;"), "Selecting locked defense skills must be blocked.");

console.log("PVP defense cooldown static checks passed.");
