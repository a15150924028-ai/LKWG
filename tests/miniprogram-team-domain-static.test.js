const assert = require("assert");
const path = require("path");

const root = path.resolve(__dirname, "..");
const catalog = require(path.join(root, "miniprogram", "data", "catalog.js"));
const constants = require(path.join(root, "miniprogram", "domain", "constants.js"));
const teamRules = require(path.join(root, "miniprogram", "domain", "team.js"));
const storageRules = require(path.join(root, "miniprogram", "utils", "storage.js"));

const monster = catalog.bundle.monsters.find(
  (candidate) => candidate.skillIds.length >= 5
);
assert(monster, "fixture monster with at least five skills is required");

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

console.log("miniprogram team domain checks passed");
