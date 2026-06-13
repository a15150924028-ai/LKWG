const fs = require("fs");
const path = require("path");
const vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
const effectScript = scripts.find((script) => script.includes("LKWG_PVP_EFFECT_RULES"));
assert(effectScript, "PVP turn-effect module is missing.");

const sandbox = {};
vm.runInNewContext(effectScript, sandbox);
const effectRules = sandbox.LKWG_PVP_EFFECT_RULES;
assert(effectRules, "PVP turn-effect rules must be exported.");

const waterShield = { name: "水泡盾", category: "defense", description: "减伤80%，应对攻击：自己获得魔攻+70%。" };
const effectiveGuard = { name: "有效预防", category: "defense", description: "减伤50%，应对攻击：下一次行动获得先手+1。" };
const blizzard = { name: "暴风雪", category: "physical", description: "造成物伤，敌方获得1层冻结。" };
const icePoint = { name: "冰点", category: "status", description: "敌方获得5层冻结，应对防御：额外获得5层。" };
const mudArmor = { name: "泥浆铠甲", category: "status", description: "自己获得物攻和物防+60%，应对防御：额外使自己的增益翻倍。" };
const armorBreak = { name: "破防", category: "status", description: "敌方获得双防-70%，应对防御：额外使被应对技能冷却2回合。" };
const attack = { name: "攻击技能", category: "physical", description: "造成物伤。" };
const defense = { name: "防御技能", category: "defense", description: "减伤50%。" };

const shieldNoResponse = effectRules.resolveActionEffects(waterShield, { responseType: "" });
assert(!shieldNoResponse.self.statMods.spa, "水泡盾 must not grant 魔攻 when 应对攻击 does not trigger.");
const shieldResponse = effectRules.resolveActionEffects(waterShield, { responseType: "defense-attack" });
assert(Math.abs(shieldResponse.self.statMods.spa - 0.7) < 1e-9, "水泡盾 must grant 魔攻+70% after successful 应对攻击.");

const priorityResponse = effectRules.resolveActionEffects(effectiveGuard, { responseType: "defense-attack" });
assert(priorityResponse.self.nextPriority === 1, "有效预防 must grant next-action priority +1 after successful 应对攻击.");

const blizzardEffects = effectRules.resolveActionEffects(blizzard, { responseType: "" });
assert(blizzardEffects.enemy.statusLayers.freeze === 1, "暴风雪 must grant enemy freeze +1.");

const iceBase = effectRules.resolveActionEffects(icePoint, { responseType: "" });
assert(iceBase.enemy.statusLayers.freeze === 5, "冰点 must grant enemy freeze +5 without response.");
const iceResponse = effectRules.resolveActionEffects(icePoint, { responseType: "status-defense" });
assert(iceResponse.enemy.statusLayers.freeze === 10, "冰点 must grant enemy freeze +10 when 应对防御 succeeds.");

const mudResponse = effectRules.resolveActionEffects(mudArmor, {
  responseType: "status-defense",
  selfState: { skillStatMods: { atk: 0.4, defense: 0.2 } }
});
assert(Math.abs(mudResponse.self.statMods.atk - 1.6) < 1e-9, "泥浆铠甲 must double current 物攻 buffs after adding +60%.");
assert(Math.abs(mudResponse.self.statMods.defense - 1.4) < 1e-9, "泥浆铠甲 must double current 物防 buffs after adding +60%.");

const breakResponse = effectRules.resolveActionEffects(armorBreak, { responseType: "status-defense" });
assert(Math.abs(breakResponse.enemy.statMods.defense + 0.7) < 1e-9, "破防 must apply enemy 物防-70%.");
assert(Math.abs(breakResponse.enemy.statMods.spd + 0.7) < 1e-9, "破防 must apply enemy 魔防-70%.");
assert(breakResponse.enemy.defenseBlockTurns === 2, "破防 response must record a two-round defense block.");

const settled = effectRules.resolveTurnEffects({
  allyAction: waterShield,
  enemyAction: attack,
  order: { allyResponse: { type: "defense-attack" }, enemyResponse: { type: "" } },
  allyState: {},
  enemyState: {}
});
assert(Math.abs(settled.ally.statMods.spa - 0.7) < 1e-9, "Turn settlement must apply successful ally defense-response effects to ally.");
assert(settled.ally.labels.some((label) => label.includes("魔攻+70%")), "Turn settlement must expose readable labels.");

const statusDefense = effectRules.resolveTurnEffects({
  allyAction: icePoint,
  enemyAction: defense,
  order: { allyResponse: { type: "status-defense" }, enemyResponse: { type: "" } },
  allyState: {},
  enemyState: {}
});
assert(statusDefense.enemy.statusLayers.freeze === 10, "Turn settlement must pass status-defense response success into effect parsing.");

assert(html.includes("function renderPvpTurnEffectPreview()"), "PVP panel must render a turn-effect preview.");
assert(html.includes("function applyPvpTurnEffects()"), "PVP panel must expose turn-effect application.");
assert(html.includes('data-pvp-turn-effects'), "Turn-effect preview must have a stable data attribute.");
assert(html.includes('data-pvp-settle-turn'), "PVP panel must expose a settle-turn button.");
assert(html.includes("window.LKWG_PVP_EFFECT_RULES.resolveTurnEffects"), "PVP panel must use centralized effect settlement.");
assert(html.includes("shouldSettleAsTurnAction"), "Response-capable status and defense skills must remain selected as turn actions.");

console.log("PVP turn-effect static checks passed.");
