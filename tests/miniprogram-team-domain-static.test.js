const assert = require("assert");
const path = require("path");

const root = path.resolve(__dirname, "..");
const packageRoot = path.join(root, "lkwgwechat");
const catalog = require(path.join(packageRoot, "miniprogram", "data", "catalog.js"));
const constants = require(path.join(packageRoot, "miniprogram", "domain", "constants.js"));
const teamRules = require(path.join(packageRoot, "miniprogram", "domain", "team.js"));
const storageRules = require(path.join(packageRoot, "miniprogram", "utils", "storage.js"));

const monster = catalog.bundle.monsters.find(
  (candidate) => candidate.skillIds.length >= 5
);
assert(monster, "fixture monster with at least five skills is required");
const offPoolSkill = catalog.bundle.skills.find(
  (skill) => !monster.skillIds.includes(skill.id)
);
assert(offPoolSkill, "fixture skill outside the monster's native pool is required");

const valid = {
  name: "测试精灵",
  monsterId: monster.id,
  bloodlineId: constants.BLOODLINES[0].id,
  natureId: constants.NATURES[0].id,
  talentIds: constants.TALENTS.slice(0, 3).map((talent) => talent.id),
  rollerSkillId: monster.skillIds[4],
  skills: monster.skillIds.slice(0, 4).map((skillId) => ({ skillId }))
};

const normalized = teamRules.normalizeTeam([valid], catalog);
assert.strictEqual(normalized.length, 6);
assert.strictEqual(normalized[0].name, "测试精灵");
assert.strictEqual(teamRules.isPetComplete(normalized[0]), true);

const withoutRoller = teamRules.normalizePet(
  { ...valid, rollerSkillId: "" },
  0,
  catalog
);
assert.strictEqual(
  teamRules.isPetComplete(withoutRoller),
  true,
  "roller target must not be required for completion"
);

const withAnyCatalogSkill = teamRules.normalizePet(
  {
    ...valid,
    skills: [
      { skillId: offPoolSkill.id },
      ...monster.skillIds.slice(1, 4).map((skillId) => ({ skillId }))
    ]
  },
  0,
  catalog
);
assert.strictEqual(
  withAnyCatalogSkill.skills[0].skillId,
  offPoolSkill.id,
  "team skill configuration must preserve any valid catalog skill, even when the selected monster cannot naturally learn it"
);

const invalid = teamRules.normalizePet({
  monsterId: "monster-missing",
  bloodlineId: "bloodline-missing",
  natureId: "nature-missing",
  talentIds: ["talent-hp", "talent-hp", "talent-missing"],
  rollerSkillId: "skill-missing",
  skills: [{ skillId: "skill-missing" }]
}, 0, catalog);
assert.strictEqual(invalid.monsterId, "");
assert.strictEqual(invalid.bloodlineId, "");
assert.strictEqual(invalid.natureId, "");
assert.deepStrictEqual(invalid.talentIds, ["talent-hp", "", ""]);
assert.deepStrictEqual(invalid.skills, [
  { skillId: "" },
  { skillId: "" },
  { skillId: "" },
  { skillId: "" }
]);

const rotationTeam = teamRules.defaultTeam();
let number = 1;
for (const pet of rotationTeam) {
  for (const skill of pet.skills) {
    skill.skillId = `skill-${number}`;
    number += 1;
  }
}
const snapshot = teamRules.cloneTeam(rotationTeam);
const rotated = teamRules.rotateSkillsDown(rotationTeam);
assert.strictEqual(rotated[0].skills[0].skillId, "skill-24");
assert.strictEqual(rotated[0].skills[1].skillId, "skill-1");
assert.deepStrictEqual(rotationTeam, snapshot, "rotation must not mutate its input");
assert.deepStrictEqual(teamRules.cloneTeam(snapshot), snapshot);

const memory = new Map();
const adapter = storageRules.createStorageAdapter({
  get(key) {
    return memory.get(key);
  },
  set(key, value) {
    memory.set(key, value);
  },
  remove(key) {
    memory.delete(key);
  }
});
adapter.saveTeam(normalized);
adapter.savePvp({ weather: "rain" });
assert.strictEqual(adapter.loadTeam(catalog).length, 6);
assert.deepStrictEqual(adapter.loadPvp((value) => value), { weather: "rain" });
adapter.clearTeam();
assert.strictEqual(memory.has(storageRules.PVP_STORAGE_KEY), true);
assert.strictEqual(memory.has(storageRules.TEAM_STORAGE_KEY), false);

const timeoutAdapter = storageRules.createStorageAdapter({
  get() {
    throw new Error("timeout");
  },
  set() {},
  remove() {}
});
assert.doesNotThrow(
  () => timeoutAdapter.loadTeam(catalog),
  "a WeChat storage timeout must not abort Mini Program startup"
);
assert.strictEqual(
  timeoutAdapter.loadTeam(catalog).length,
  6,
  "a WeChat storage timeout should fall back to an empty normalized team"
);
assert.strictEqual(
  timeoutAdapter.loadPvp((value) => value),
  null,
  "a WeChat storage timeout should fall back to no saved PVP state"
);

console.log("miniprogram team domain checks passed");
