const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const htmlPath = path.join(__dirname, "..", "克制面查询.html");
const html = fs.readFileSync(htmlPath, "utf8");

function extractFunction(source, name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${name} not found`);

  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  let quote = "";
  let escaped = false;

  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }
    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }

  throw new Error(`${name} body end not found`);
}

const attacker = {
  id: "attacker",
  name: "攻击方",
  types: ["fire"],
  stats: { hp: 500, atk: 200, defense: 100, spa: 200, spd: 100, spe: 100 }
};
const defender = {
  id: "defender",
  name: "防御方",
  types: ["water"],
  stats: { hp: 500, atk: 100, defense: 100, spa: 100, spd: 100, spe: 100 }
};
const attackSkill = {
  id: "attack",
  name: "攻击",
  type: "electric",
  category: "physical",
  power: 100,
  pp: 2,
  description: "造成物伤。"
};
const comboSkill = {
  ...attackSkill,
  id: "combo",
  name: "连击",
  description: "造成物伤，2连击。"
};
const defenseSkill = {
  id: "guard70",
  name: "防御",
  type: "normal",
  category: "defense",
  power: null,
  pp: 2,
  description: "减伤70%。应对攻击。"
};

const skillById = new Map([
  [attackSkill.id, attackSkill],
  [comboSkill.id, comboSkill],
  [defenseSkill.id, defenseSkill]
]);

let traitEffects = {};
const context = {
  console,
  window: {
    LKWG_PVP_TRAIT_RULES: {
      resolveTraitEffects: () => ({
        skillCostReduction: 0,
        energyGain: 0,
        flatPower: 0,
        powerMultiplier: 1,
        hitCountAdd: 0,
        ...traitEffects
      })
    },
    LKWG_PVP_DAMAGE_RULES: {
      resolvePvpVariableDamage: (action) => ({
        power: action.power,
        hitCount: /(\d+)连击/.test(action.description || "") ? Number(RegExp.$1) : 1,
        damageMultiplier: 1,
        labels: []
      })
    }
  },
  monsterById: new Map([
    [attacker.id, attacker],
    [defender.id, defender]
  ]),
  skillById,
  DEFAULT_PVP_ENERGY: 10,
  FORCE_IMPACT_RESPONSE_MULTIPLIER: 2.5,
  PVP_DAMAGE_CORE_FACTOR: 0.9,
  effectiveActionForPassives: (action) => ({ action, labels: [] }),
  isAttackSkill: (skill) => ["physical", "special", "attack"].includes(skill?.category),
  passiveStatMods: () => ({}),
  normalizeStatMods: (mods) => mods || {},
  mergeStatMods: (...mods) => Object.assign({}, ...mods),
  finalBattleStats: (monster, state) => state?.stats || monster.stats,
  damageMode: (skill) => skill.category === "special"
    ? { attackKey: "spa", defenseKey: "spd", label: "魔攻" }
    : { attackKey: "atk", defenseKey: "defense", label: "物攻" },
  selectedPvpSkills: (state) => (state?.skillIds || []).map((id) => skillById.get(id)).filter(Boolean),
  pvpActionFromState: (state) => {
    const match = String(state?.action || "").match(/^skill:(\d)$/);
    return match ? skillById.get(state.skillIds?.[Number(match[1])]) || null : null;
  },
  bloodlineMatchesName: () => false,
  combinedDefenseMultiplier: () => 1,
  sameTypeAttackBonus: () => 1,
  passiveDamageEffects: () => ({
    powerAdd: 0,
    powerMultiplier: 1,
    damageMultiplier: 1,
    attackerLabels: [],
    defenderLabels: []
  }),
  passiveModLabels: () => []
};

const calcPvpDamage = vm.runInNewContext(
  `${extractFunction(html, "defenseReductionMultiplier")}\n${extractFunction(html, "calcPvpDamage")}; calcPvpDamage;`,
  context
);

function calc(action, overrides = {}) {
  traitEffects = overrides.traitEffects || {};
  return calcPvpDamage(
    {
      monsterId: attacker.id,
      skillIds: [action.id, "", "", ""],
      action: "skill:0",
      manualDamageBonus: overrides.manualDamageBonus || 0
    },
    {
      monsterId: defender.id,
      skillIds: overrides.defenderSkillIds || ["", "", "", ""],
      action: overrides.defenderAction || ""
    },
    action
  );
}

assert.equal(
  calc(attackSkill, { manualDamageBonus: 10 }).estimate,
  198,
  "manual skill damage should add to settled power before attack/defense and multipliers"
);

assert.equal(
  calc(attackSkill, {
    defenderSkillIds: [defenseSkill.id, "", "", ""],
    defenderAction: "skill:0"
  }).estimate,
  54,
  "enemy defense skill with 70% reduction should multiply damage by 0.3"
);

assert.equal(
  calc(attackSkill, { traitEffects: { hitCountAdd: 2 } }).hitCount,
  1,
  "non-combo attacks should not receive hit-count bonuses"
);

assert.equal(
  calc(comboSkill, { traitEffects: { hitCountAdd: 1 } }).hitCount,
  3,
  "combo attacks should receive hit-count bonuses"
);

console.log("pvp damage formula ok");
