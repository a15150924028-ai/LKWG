const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const bundle = JSON.parse(fs.readFileSync(path.join(root, "data", "local-bundle.json"), "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  'id="rollerBtn"',
  'id="undoRollerBtn"',
  "使用过山车",
  "撤回过山车",
  "function rotateSkillsDown",
  "function undoRoller",
  "monster.skillIds.map((id) => skillById.get(id)).filter(Boolean)",
  "skillById.get(pet.rollerSkillId)",
].forEach((needle) => assert(html.includes(needle), `Roller runtime must keep: ${needle}`));

const roller = bundle.skills.find((skill) => skill.name === "过山车");
assert(roller, "The formal skill pool must contain 过山车.");
assert(/^skill-/.test(roller.id), "过山车 must use a neutral skill id.");
const learners = bundle.monsters.filter((monster) => monster.skillIds.includes(roller.id));
assert(learners.length > 0, "At least one monster must learn 过山车 through monster.skillIds.");

console.log("Roller runtime static checks passed.");
