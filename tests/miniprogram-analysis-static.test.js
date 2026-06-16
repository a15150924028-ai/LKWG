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
  rollerSkillId: attackSkills[0].id,
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
assert.strictEqual(result.rollerSlots.length, 6);
assert.strictEqual(result.rollerSlots[0].targetSkillId, attackSkills[0].id);
assert.strictEqual(result.rollerSlots[0].targetSkillName, attackSkills[0].name);
assert(
  result.rollerSlots[0].learnerNames.includes(monster.name),
  "roller target analysis must expose who can learn the selected target skill"
);
assert(
  result.rollerSlots[0].learnerPreview.includes(monster.name),
  "roller target analysis must provide a compact learner preview"
);
assert.strictEqual(
  result.rollerSlots[0].learnerFullText,
  result.rollerSlots[0].learnerNames.join("、"),
  "roller target analysis must expose the full learner list"
);

const noMonsterRollerPet = {
  ...teamRules.emptyPet(0),
  rollerSkillId: attackSkills[0].id
};
const noMonsterRollerResult = analysis.analyzeTeam([noMonsterRollerPet], catalog);
assert.strictEqual(
  noMonsterRollerResult.rollerSlots[0].targetSkillId,
  attackSkills[0].id,
  "roller target analysis must still resolve a chosen target skill even when no monster is configured"
);
assert.strictEqual(
  noMonsterRollerResult.rollerSlots[0].targetSkillName,
  attackSkills[0].name,
  "roller target analysis must still show the target skill name even when no monster is configured"
);

const learnerCounts = new Map();
for (const bundleMonster of catalog.bundle.monsters) {
  for (const skillId of bundleMonster.skillIds) {
    learnerCounts.set(skillId, (learnerCounts.get(skillId) || 0) + 1);
  }
}
const expandableSkillId = [...learnerCounts.entries()].find(([, count]) => count > 12)?.[0];
assert(expandableSkillId, "analysis fixture requires at least one target skill with more than 12 learners");
const expandableSkillResult = analysis.analyzeTeam([{
  ...teamRules.emptyPet(0),
  rollerSkillId: expandableSkillId
}], catalog);
assert(
  expandableSkillResult.rollerSlots[0].learnerHasMore,
  "roller target analysis must expose when learner preview is truncated"
);

const pageJs = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "pages", "analysis", "index.js"),
  "utf8"
);
const pageWxml = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "pages", "analysis", "index.wxml"),
  "utf8"
);
const pageJson = JSON.parse(fs.readFileSync(
  path.join(packageRoot, "miniprogram", "pages", "analysis", "index.json"),
  "utf8"
));
assert(pageJs.includes("onShow()"));
assert(pageJs.includes("storage.loadTeam"));
assert(pageJs.includes("analysis.analyzeTeam"));
assert.strictEqual(
  pageJson.usingComponents["field-picker"],
  "/components/field-picker/index"
);
assert.strictEqual(
  pageJson.usingComponents["floating-picker"],
  "/components/floating-picker/index"
);
assert(pageWxml.includes("<page-meta"));
assert(pageWxml.includes("pickerScrollLocked"));
assert(pageJs.includes("rollerSlots:"));
assert(pageJs.includes("buildRollerSlots("));
assert(pageJs.includes("catalog.skillOptions"));
assert(!pageJs.includes("catalog.monsterSkillOptions("));
assert(pageJs.includes("onRollerSkillChange("));
assert(pageJs.includes("onPickerOpen("));
assert(pageJs.includes("onFloatingPickerSelect("));
assert(pageJs.includes("expandedLearnerSlots"));
assert(pageJs.includes("onToggleLearners("));
assert(pageWxml.includes("过山车目标"));
assert(pageWxml.includes('wx:for="{{rollerSlots}}"'));
assert(pageWxml.includes('data-picker-handler="onRollerSkillChange"'));
assert(pageWxml.includes("learnerPreview"));
assert(pageWxml.includes("learnerCount"));
assert(pageWxml.includes("learnerFullText"));
assert(pageWxml.includes("learnerHasMore"));
assert(pageWxml.includes('class="roller-learner-card'));
assert(pageWxml.includes('bindtap="onToggleLearners"'));
assert(!pageWxml.includes("roller-learner-toggle"));
assert(!pageWxml.includes("roller-learner-toggle-arrow"));
assert(!pageWxml.includes("展开"));
assert(!pageWxml.includes("收起"));
assert(!pageWxml.includes('disabled="{{!slot.hasMonster}}"'));
assert(pageWxml.includes("<floating-picker"));
assert(pageWxml.includes("当前克制面"));
assert(pageWxml.includes("主要弱点"));
assert(pageWxml.includes("type-chip-list"));
assert(pageWxml.includes("type-chip-icon"));
assert(pageWxml.includes("{{type.icon}}"));
assert(pageWxml.includes("暂无队伍配置"));
assert(pageWxml.includes('wx:if="{{result.configuredCount > 0}}"'));
assert(
  pageWxml.indexOf("roller-target-card") < pageWxml.indexOf('wx:if="{{result.configuredCount > 0}}"'),
  "roller target card must stay visible even when no team monster is configured"
);

console.log("miniprogram analysis checks passed");
