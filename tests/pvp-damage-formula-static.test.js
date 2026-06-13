const fs = require("fs");
const path = require("path");
const vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const damageCoreScript = scripts.find((script) => script.includes("LKWG_PVP_DAMAGE_CORE"));
assert(damageCoreScript, "PVP damage core module is missing.");

const sandbox = { module: { exports: {} } };
vm.runInNewContext(damageCoreScript, sandbox);
const damageCore = sandbox.module.exports;

assert(
  damageCore.abilityLevelMultiplier({ atk: 0.6 }, { defense: -0.7 }, "atk", "defense") === 2.3,
  "Attack increases and enemy defense decreases must add in the ability-level numerator."
);
assert(
  Math.abs(damageCore.abilityLevelMultiplier({ atk: -0.6 }, { defense: 0.7 }, "atk", "defense") - (1 / 2.3)) < 1e-12,
  "Attack decreases and enemy defense increases must add in the ability-level denominator."
);

const baseHit = damageCore.calculateHit({
  attack: 146,
  defense: 178,
  skillPower: 110,
  stabMultiplier: 1.25
});
assert(baseHit.damage === 102, "The damage core must round the final single-hit result upward.");

const responseHit = damageCore.calculateHit({
  attack: 100,
  defense: 100,
  skillPower: 35,
  responseMultiplier: 10,
  flatPowerAdd: 20
});
assert(responseHit.settledPower === 370, "Response multipliers must not multiply flat power additions.");
assert(responseHit.damage === 333, "Response damage must use base power times response multiplier plus flat power.");

const boostedHit = damageCore.calculateHit({
  attack: 100,
  defense: 100,
  skillPower: 100,
  powerBuffPercent: 0.5 + 0.75
});
assert(boostedHit.powerBuffMultiplier === 2.25, "Percentage power buffs must add before becoming a multiplier.");
assert(boostedHit.damage === 203, "Additive power buffs must be included before final upward rounding.");

const multiHit = damageCore.calculateDamage({
  attack: 100,
  defense: 100,
  skillPower: 1,
  hitCount: 3
});
assert(multiHit.singleDamage === 1, "Each positive nonzero hit must have a minimum damage of 1.");
assert(multiHit.damage === 3, "Multi-hit damage must multiply the rounded single-hit value.");

const immuneHit = damageCore.calculateDamage({
  attack: 100,
  defense: 100,
  skillPower: 100,
  typeMultiplier: 0,
  hitCount: 3
});
assert(immuneHit.singleDamage === 0 && immuneHit.damage === 0, "Complete immunity must remain zero damage.");

assert(
  html.includes("window.LKWG_PVP_DAMAGE_CORE.calculateDamage"),
  "The PVP calculator must use the shared damage core."
);
assert(
  html.includes("const defenderSkillMods = normalizeStatMods(defenderState?.skillStatMods);"),
  "Defender skill stat changes must participate in ability-level calculation."
);
assert(
  html.includes("mergeStatMods(defenderPassiveMods, defenderSkillMods, defenderManualMods)"),
  "Defender passive, skill, and manual stat changes must be merged."
);
assert(
  html.includes("const mode = damageMode(battleAction, attackerBaseStats, defenderBaseStats);"),
  "Adaptive damage mode must use displayed stats rather than percentage-modified stats."
);

console.log("PVP damage formula static checks passed.");
