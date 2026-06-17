let meta;
let monsters;
let monsterSummaries;
let skills;
let skillSummaries;
let passives;
let monsterById;
let monsterSummaryById;
let skillById;
let skillSummaryById;
let passiveById;
let monsterOptionsCache;
let skillOptionsCache;
let passiveOptionsCache;

function loadMeta() {
  if (!meta) meta = require("./local-meta");
  return meta;
}

function loadMonsters() {
  if (!monsters) monsters = JSON.parse(require("./local-monsters"));
  return monsters;
}

function loadMonsterSummaries() {
  if (!monsterSummaries) monsterSummaries = require("./monster-summaries");
  return monsterSummaries;
}

function loadSkills() {
  if (!skills) skills = JSON.parse(require("./local-skills"));
  return skills;
}

function loadSkillSummaries() {
  if (!skillSummaries) skillSummaries = require("./skill-summaries");
  return skillSummaries;
}

function loadPassives() {
  if (!passives) passives = JSON.parse(require("./local-passives"));
  return passives;
}

function mapById(records) {
  return new Map(records.map((record) => [record.id, record]));
}

function option(record) {
  const item = {
    id: record.id,
    label: record.name,
    aliases: [...(record.aliases || [])]
  };
  if (record.type) {
    item.icon = `/assets/type-icons/${record.type}.png`;
    item.iconClass = "type-icon-image";
  }
  return item;
}

function getMonsterMap() {
  if (!monsterById) monsterById = mapById(loadMonsters());
  return monsterById;
}

function getMonsterSummaryMap() {
  if (!monsterSummaryById) monsterSummaryById = mapById(loadMonsterSummaries());
  return monsterSummaryById;
}

function getSkillMap() {
  if (!skillById) skillById = mapById(loadSkills());
  return skillById;
}

function getSkillSummaryMap() {
  if (!skillSummaryById) skillSummaryById = mapById(loadSkillSummaries());
  return skillSummaryById;
}

function getPassiveMap() {
  if (!passiveById) passiveById = mapById(loadPassives());
  return passiveById;
}

function getMonster(id) {
  if (!id) return null;
  return getMonsterMap().get(id) || null;
}

function getMonsterSummary(id) {
  if (!id) return null;
  return getMonsterSummaryMap().get(id) || null;
}

function hasMonster(id) {
  return Boolean(getMonsterSummary(id));
}

function getSkill(id) {
  if (!id) return null;
  return getSkillMap().get(id) || null;
}

function getSkillSummary(id) {
  if (!id) return null;
  return getSkillSummaryMap().get(id) || null;
}

function getPassive(id) {
  if (!id) return null;
  return getPassiveMap().get(id) || null;
}

function monsterSkillOptions(monsterId) {
  const monster = getMonster(monsterId);
  if (!monster) return [];
  return monster.skillIds
    .map((skillId) => getSkill(skillId))
    .filter(Boolean)
    .map(option);
}

const catalog = {
  get bundle() {
    return {
      ...loadMeta(),
      monsters: loadMonsters(),
      skills: loadSkills(),
      passives: loadPassives()
    };
  },
  get monsterById() {
    return getMonsterMap();
  },
  get monsterSummaryById() {
    return getMonsterSummaryMap();
  },
  get skillById() {
    return getSkillMap();
  },
  get skillSummaryById() {
    return getSkillSummaryMap();
  },
  get passiveById() {
    return getPassiveMap();
  },
  get monsterOptions() {
    if (!monsterOptionsCache) monsterOptionsCache = loadMonsterSummaries().map(option);
    return monsterOptionsCache;
  },
  get skillOptions() {
    if (!skillOptionsCache) skillOptionsCache = loadSkillSummaries().map(option);
    return skillOptionsCache;
  },
  get passiveOptions() {
    if (!passiveOptionsCache) passiveOptionsCache = loadPassives().map(option);
    return passiveOptionsCache;
  },
  getMonster,
  getMonsterSummary,
  hasMonster,
  getSkill,
  getSkillSummary,
  getPassive,
  monsterSkillOptions
};

module.exports = catalog;
