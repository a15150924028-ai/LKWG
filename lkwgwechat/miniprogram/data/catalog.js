const bundle = require("./local-bundle");

const monsterById = new Map(bundle.monsters.map((monster) => [monster.id, monster]));
const skillById = new Map(bundle.skills.map((skill) => [skill.id, skill]));
const passiveById = new Map(bundle.passives.map((passive) => [passive.id, passive]));

function option(record) {
  return { id: record.id, label: record.name };
}

const monsterOptions = bundle.monsters.map(option);
const skillOptions = bundle.skills.map(option);
const passiveOptions = bundle.passives.map(option);

function getMonster(id) {
  return monsterById.get(id) || null;
}

function getSkill(id) {
  return skillById.get(id) || null;
}

function getPassive(id) {
  return passiveById.get(id) || null;
}

function monsterSkillOptions(monsterId) {
  const monster = getMonster(monsterId);
  if (!monster) return [];
  return monster.skillIds
    .map((skillId) => getSkill(skillId))
    .filter(Boolean)
    .map(option);
}

module.exports = {
  bundle,
  monsterById,
  skillById,
  passiveById,
  monsterOptions,
  skillOptions,
  passiveOptions,
  getMonster,
  getSkill,
  getPassive,
  monsterSkillOptions
};
