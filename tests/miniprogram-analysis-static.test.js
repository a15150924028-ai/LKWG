const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const packageRoot = path.join(root, "lkwgwechat");
const catalog = require(path.join(packageRoot, "miniprogram", "data", "catalog.js"));
const teamRules = require(path.join(packageRoot, "miniprogram", "domain", "team.js"));
const typeRules = require(path.join(packageRoot, "miniprogram", "domain", "type-rules.js"));
const stats = require(path.join(packageRoot, "miniprogram", "domain", "stats.js"));
const analysis = require(path.join(packageRoot, "miniprogram", "domain", "analysis.js"));

assert.strictEqual(typeRules.relationMultiplier("fire", "grass"), 2);
assert.strictEqual(typeRules.relationMultiplier("fire", "water"), 0.5);
assert.strictEqual(
  typeRules.combinedDefenseMultiplier("fire", ["grass", "mechanical"]),
  4
);
assert.strictEqual(
  typeRules.combinedDefenseMultiplier("water", ["fire", "grass"]),
  1
);

const calculated = stats.calculateFinalStats(
  { stats: { hp: 100, atk: 100, defense: 100, spa: 100, spd: 100, spe: 100 } },
  {
    natureId: "nature-silent",
    talentIds: ["talent-hp", "talent-atk", "talent-spe"]
  }
);
assert.deepStrictEqual(calculated, {
  hp: 449,
  atk: 188,
  defense: 170,
  spa: 170,
  spd: 170,
  spe: 203
});

const monster = catalog.bundle.monsters.find((candidate) => (
  candidate.skillIds.some((skillId) => {
    const skill = catalog.getSkill(skillId);
    return skill && ["physical", "special", "attack"].includes(skill.category);
  })
));
assert(monster, "analysis fixture monster is required");
const attackSkills = monster.skillIds
  .map((skillId) => catalog.getSkill(skillId))
  .filter((skill) => skill && ["physical", "special", "attack"].includes(skill.category))
  .slice(0, 4);
const pet = {
  ...teamRules.emptyPet(0),
  monsterId: monster.id,
  bloodlineId: "bloodline-fire",
  natureId: "nature-practical",
  talentIds: ["talent-hp", "talent-def", "talent-spd"],
  skills: attackSkills.map((skill) => ({ skillId: skill.id }))
};
while (pet.skills.length < 4) pet.skills.push({ skillId: "" });

const result = analysis.analyzeTeam([pet], catalog);
assert.strictEqual(result.configuredCount, 1);
assert.strictEqual(result.monsters.length, 1);
assert(Array.isArray(result.coveredTypes));
assert(Array.isArray(result.missingTypes));
assert.strictEqual(result.coveredTypes.length + result.missingTypes.length, 18);
assert(
  result.monsters[0].typeChips.every((chip) => chip.icon && chip.iconClass === "type-icon-image"),
  "monster type chips must expose type icons"
);
assert(
  result.monsters[0].weaknessChips.every((chip) => chip.icon && chip.iconClass === "type-icon-image"),
  "weakness chips must expose type icons"
);
assert(
  result.monsters[0].resistanceChips.every((chip) => chip.icon && chip.iconClass === "type-icon-image"),
  "resistance chips must expose type icons"
);
assert(
  result.coveredTypeChips.every((chip) => chip.icon && chip.iconClass === "type-icon-image"),
  "coverage chips must expose type icons"
);

const pageJs = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "pages", "analysis", "index.js"),
  "utf8"
);
const pageWxml = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "pages", "analysis", "index.wxml"),
  "utf8"
);
assert(pageJs.includes("onShow()"));
assert(pageJs.includes("storage.loadTeam"));
assert(pageJs.includes("analysis.analyzeTeam"));
assert(pageWxml.includes("当前克制面"));
assert(pageWxml.includes("主要弱点"));
assert(pageWxml.includes("type-chip-list"));
assert(pageWxml.includes("type-chip-icon"));
assert(pageWxml.includes("{{type.icon}}"));
assert(pageWxml.includes("暂无队伍配置"));

console.log("miniprogram analysis checks passed");
