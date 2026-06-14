const fs = require("fs");
const path = require("path");
const vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
const cleanupScript = scripts.find((script) => script.includes("LKWG_PVP_CLEANUP_RULES"));
assert(cleanupScript, "PVP cleanup module is missing.");

const sandbox = {};
vm.runInNewContext(cleanupScript, sandbox);
const cleanupRules = sandbox.LKWG_PVP_CLEANUP_RULES;
assert(cleanupRules, "PVP cleanup rules must be exported.");

const state = {
  action: "skill:1",
  actionMonsterId: "monster-a",
  actionCuteLayers: 2,
  forceImpact: false,
  currentHp: 70,
  energy: 4,
  statusLayers: { freeze: 3 },
  defenseBlockTurns: 1,
  skillCostOverrides: { skillA: 7 },
  skillStatMods: { atk: 0.4, defense: 0, spa: 0, spd: 0, spe: 0, hp: 0 },
  manualStatMods: { atk: 0, defense: 0, spa: 0, spd: 0, spe: 0, hp: 0 },
  manualDamageBonus: 20,
  manualPowerPercentBonus: 0.5,
  manualHitCountBonus: 2,
  supportText: "before"
};

const cleaned = cleanupRules.cleanupSideAfterTurn(state, { consumedAction: true });
assert(cleaned.changed, "Cleanup should report changes when a turn action was consumed.");
assert(state.action === "", "Settled actions must be cleared after the turn.");
assert(state.actionMonsterId === "", "Action monster snapshots must be cleared after the turn.");
assert(state.actionCuteLayers === 0, "Action cute-layer snapshots must be cleared after the turn.");
assert(state.forceImpact === false, "Force Impact selected state must clear after the turn.");
assert(state.manualDamageBonus === 0, "One-shot flat next-attack power must clear after the turn.");
assert(state.manualPowerPercentBonus === 0, "One-shot percent next-attack power must clear after the turn.");
assert(state.manualHitCountBonus === 0, "One-shot hit-count bonus must clear after the turn.");
assert(state.currentHp === 70, "Cleanup must preserve current HP.");
assert(state.energy === 4, "Cleanup must preserve settled energy.");
assert(state.statusLayers.freeze === 3, "Cleanup must preserve freeze layers.");
assert(state.defenseBlockTurns === 1, "Cleanup must preserve defense locks.");
assert(state.skillCostOverrides.skillA === 7, "Cleanup must preserve permanent skill-cost overrides.");
assert(state.skillStatMods.atk === 0.4, "Cleanup must preserve settled skill stat buffs.");

const idle = { action: "", manualDamageBonus: 0, manualPowerPercentBonus: 0, manualHitCountBonus: 0 };
assert(!cleanupRules.cleanupSideAfterTurn(idle, { consumedAction: false }).changed, "Cleanup should be a no-op when no action or one-shot bonus exists.");

const turn = cleanupRules.cleanupTurn({
  allyState: { action: "force", forceImpact: true, manualDamageBonus: 10 },
  enemyState: { action: "skill:0", actionMonsterId: "enemy", manualHitCountBonus: 1 },
  allyConsumedAction: true,
  enemyConsumedAction: true
});
assert(turn.ally.changed && turn.enemy.changed, "Turn cleanup must clean both consumed sides.");

assert(html.includes("function applyPvpTurnCleanup("), "PVP panel must expose cleanup application.");
assert(html.includes("window.LKWG_PVP_CLEANUP_RULES.cleanupTurn"), "PVP panel must use centralized cleanup rules.");
assert(html.includes("applyPvpTurnCleanup(context)"), "Settle-turn flow must apply cleanup.");

console.log("PVP turn cleanup static checks passed.");
