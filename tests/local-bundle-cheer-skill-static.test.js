const fs = require("fs");
const path = require("path");

const bundle = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "local-bundle.json"), "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const cheerSkillName = "\u52a0\u6cb9";
const cheerSkillId = "skill-\u52a0\u6cb9";
const cheerDescription = "\u81ea\u5df1\u83b7\u5f971\u5c42\u840c\u82bd\u5370\u8bb0\u3002";

const skill = bundle.skills.find((entry) => entry.name === cheerSkillName);
assert(skill, "Local bundle must include the BWiki skill 加油.");
assert(skill.id === cheerSkillId, "加油 must use the neutral skill id.");
assert(skill.type === "cute", "加油 must be cute type.");
assert(skill.category === "status", "加油 must be a status skill.");
assert(skill.mode === "", "加油 status skill must not have a damage mode.");
assert(skill.power === 0, "加油 must use 0 power for the BWiki dash-power value.");
assert(skill.pp === 2, "加油 must use BWiki energy cost 2.");
assert(skill.energyCost === null, "加油 must keep the local null energyCost shape.");
assert(skill.accuracy === null, "加油 must keep the local null accuracy shape.");
assert(skill.priority === 0, "加油 must use default priority.");
assert(skill.description === cheerDescription, "加油 description must match the BWiki skill page.");

const learnerNames = [
  "\u52a0\u6cb9\u6d77\u8475",
  "\u52a0\u6cb9\u87f9",
  "\u7535\u54a9\u54a9",
  "\u83ca\u82b1\u68a8",
  "\u91cc\u62c9\u9cd0",
  "\u6cbb\u6108\u5154",
];

learnerNames.forEach((name) => {
  const monster = bundle.monsters.find((entry) => entry.name === name);
  assert(monster, `Missing 加油 learner ${name}.`);
  assert(monster.skillIds.includes(cheerSkillId), `${name} must be able to learn 加油.`);
});

console.log("Cheer skill local bundle checks passed.");
