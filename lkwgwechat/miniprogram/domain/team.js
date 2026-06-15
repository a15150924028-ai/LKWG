const { BLOODLINES, NATURES, TALENTS } = require("./constants");

const bloodlineIds = new Set(BLOODLINES.map((item) => item.id));
const natureIds = new Set(NATURES.map((item) => item.id));
const talentIds = new Set(TALENTS.map((item) => item.id));

function emptyPet(index = 0) {
  return {
    name: `精灵${index + 1}`,
    monsterId: "",
    bloodlineId: "",
    natureId: "",
    talentIds: ["", "", ""],
    rollerSkillId: "",
    skills: Array.from({ length: 4 }, () => ({ skillId: "" }))
  };
}

function defaultTeam() {
  return Array.from({ length: 6 }, (_, index) => emptyPet(index));
}

function uniqueValidTalents(values) {
  const used = new Set();
  return Array.from({ length: 3 }, (_, index) => {
    const talentId = values?.[index] || "";
    if (!talentIds.has(talentId) || used.has(talentId)) return "";
    used.add(talentId);
    return talentId;
  });
}

function normalizePet(pet, index = 0, catalog) {
  const source = pet && typeof pet === "object" ? pet : {};
  const monster = catalog?.getMonster(source.monsterId);
  const allowedSkills = new Set(monster?.skillIds || []);
  const monsterId = monster?.id || "";

  function validSkillId(value) {
    if (!monsterId || !allowedSkills.has(value) || !catalog?.getSkill(value)) return "";
    return value;
  }

  return {
    name: String(source.name || `精灵${index + 1}`),
    monsterId,
    bloodlineId: bloodlineIds.has(source.bloodlineId) ? source.bloodlineId : "",
    natureId: natureIds.has(source.natureId) ? source.natureId : "",
    talentIds: uniqueValidTalents(source.talentIds),
    rollerSkillId: validSkillId(source.rollerSkillId),
    skills: Array.from({ length: 4 }, (_, skillIndex) => {
      const skill = source.skills?.[skillIndex] || {};
      return { skillId: validSkillId(skill.skillId || skill.id || "") };
    })
  };
}

function normalizeTeam(team, catalog) {
  return Array.from({ length: 6 }, (_, index) => (
    normalizePet(team?.[index], index, catalog)
  ));
}

function isPetComplete(pet) {
  return Boolean(pet?.monsterId)
    && Boolean(pet?.bloodlineId)
    && Boolean(pet?.natureId)
    && pet.talentIds?.length === 3
    && pet.talentIds.every(Boolean)
    && new Set(pet.talentIds).size === 3
    && pet.skills?.length === 4
    && pet.skills.every((skill) => Boolean(skill?.skillId));
}

function cloneTeam(team) {
  return JSON.parse(JSON.stringify(team));
}

function rotateSkillsDown(team) {
  const next = cloneTeam(team);
  const skills = next.flatMap((pet) => pet.skills.map((skill) => ({ ...skill })));
  if (!skills.length) return next;
  skills.unshift(skills.pop());
  let cursor = 0;
  for (const pet of next) {
    pet.skills = pet.skills.map(() => ({ ...skills[cursor++] }));
  }
  return next;
}

module.exports = {
  emptyPet,
  defaultTeam,
  normalizePet,
  normalizeTeam,
  isPetComplete,
  cloneTeam,
  rotateSkillsDown
};
