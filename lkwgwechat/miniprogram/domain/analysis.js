const { TYPES } = require("./constants");
const { calculateFinalStats } = require("./stats");
const typeRules = require("./type-rules");
const teamRules = require("./team");

const attackCategories = new Set(["physical", "special", "attack"]);
const typeMetaById = new Map(TYPES.map((type) => [type.id, type]));

function typeChip(id) {
  const type = typeMetaById.get(id);
  return {
    id,
    name: typeRules.typeName(id),
    icon: type?.icon || "",
    iconClass: type?.iconClass || ""
  };
}

function analyzeMonster(pet, catalog) {
  const monster = catalog.getMonster(pet.monsterId);
  if (!monster) return null;
  const profile = typeRules.defensiveProfile(monster.types);
  const stats = calculateFinalStats(monster, pet);
  const typeLabels = monster.types.map(typeRules.typeName);
  const weaknessLabels = profile.weaknesses.map(typeRules.typeName);
  const resistanceLabels = profile.resistances.map(typeRules.typeName);
  const immunityLabels = profile.immunities.map(typeRules.typeName);
  return {
    id: monster.id,
    name: monster.name,
    types: monster.types,
    typeChips: monster.types.map(typeChip),
    typeLabels,
    typeText: typeLabels.join(" / "),
    complete: teamRules.isPetComplete(pet),
    weaknesses: profile.weaknesses,
    weaknessChips: profile.weaknesses.map(typeChip),
    weaknessLabels,
    weaknessText: weaknessLabels.join("、") || "无",
    resistances: profile.resistances,
    resistanceChips: profile.resistances.map(typeChip),
    resistanceLabels,
    resistanceText: resistanceLabels.join("、") || "无",
    immunities: profile.immunities,
    immunityChips: profile.immunities.map(typeChip),
    immunityLabels,
    immunityText: immunityLabels.join("、") || "无",
    stats,
    statRows: [
      ["生命", stats.hp], ["物攻", stats.atk], ["物防", stats.defense],
      ["魔攻", stats.spa], ["魔防", stats.spd], ["速度", stats.spe]
    ].map(([label, value]) => ({ label, value }))
  };
}

function learnerSummaryForSkill(skillId, catalog) {
  const skill = catalog.getSkill(skillId);
  if (!skill) {
    return {
      targetSkillId: "",
      targetSkillName: "",
      learnerNames: [],
      learnerCount: 0,
      learnerPreview: "先选择目标技能"
    };
  }
  const learnerNames = catalog.bundle.monsters
    .filter((monster) => monster.skillIds.includes(skill.id))
    .map((monster) => monster.name);
  return {
    targetSkillId: skill.id,
    targetSkillName: skill.name,
    learnerNames,
    learnerCount: learnerNames.length,
    learnerPreview: learnerNames.length
      ? learnerNames.slice(0, 12).join("、")
      : "暂无可学习精灵"
  };
}

function analyzeRollerSlot(pet, slot, catalog) {
  const monster = catalog.getMonster(pet.monsterId);
  return {
    slot,
    monsterId: monster?.id || "",
    monsterName: monster?.name || "未选择精灵",
    hasMonster: Boolean(monster),
    ...learnerSummaryForSkill(pet.rollerSkillId, catalog)
  };
}

function analyzeTeam(team, catalog) {
  const normalized = teamRules.normalizeTeam(team, catalog);
  const attackTypes = [];
  for (const pet of normalized) {
    for (const selected of pet.skills) {
      const skill = catalog.getSkill(selected.skillId);
      if (skill && attackCategories.has(skill.category)) attackTypes.push(skill.type);
    }
  }
  const uniqueAttackTypes = [...new Set(attackTypes)];
  const coveredTypes = typeRules.coverageOfTypes(uniqueAttackTypes);
  const covered = new Set(coveredTypes);
  const coveredTypeLabels = coveredTypes.map(typeRules.typeName);
  const missingTypes = TYPES.map((type) => type.id).filter((id) => !covered.has(id));
  const missingTypeLabels = missingTypes.map(typeRules.typeName);
  return {
    configuredCount: normalized.filter((pet) => Boolean(pet.monsterId)).length,
    completeCount: normalized.filter(teamRules.isPetComplete).length,
    attackTypes: uniqueAttackTypes,
    attackTypeLabels: uniqueAttackTypes.map(typeRules.typeName),
    coveredTypes,
    coveredTypeChips: coveredTypes.map(typeChip),
    coveredTypeLabels,
    coveredTypeText: coveredTypeLabels.join("、") || "暂无",
    missingTypes,
    missingTypeChips: missingTypes.map(typeChip),
    missingTypeLabels,
    missingTypeText: missingTypeLabels.join("、") || "无",
    rollerSlots: normalized.map((pet, slot) => analyzeRollerSlot(pet, slot, catalog)),
    monsters: normalized.map((pet) => analyzeMonster(pet, catalog)).filter(Boolean)
  };
}

module.exports = {
  analyzeMonster,
  analyzeRollerSlot,
  analyzeTeam
};
