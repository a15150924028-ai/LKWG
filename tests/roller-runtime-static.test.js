const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const bundle = JSON.parse(fs.readFileSync(path.join(root, "data", "local-bundle.json"), "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`${name} is missing.`);
  const open = html.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < html.length; index += 1) {
    if (html[index] === "{") depth += 1;
    if (html[index] === "}") {
      depth -= 1;
      if (depth === 0) return html.slice(start, index + 1);
    }
  }
  throw new Error(`${name} source is incomplete.`);
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

const initialTeam = Array.from({ length: 6 }, (_, petIndex) => ({
  skills: Array.from({ length: 4 }, (_, skillIndex) => ({
    skillId: petIndex === 0 && skillIndex === 0 ? "skill-demo" : ""
  }))
}));
const sandbox = {
  rollerHistory: [],
  undoRollerBtn: { disabled: true },
  readTeam: () => JSON.parse(JSON.stringify(initialTeam)),
  renderTeam: () => {},
  saveSpecificTeam: () => {},
  renderResults: () => {}
};
vm.createContext(sandbox);
vm.runInContext(`
  ${extractFunction("updateRollerUndoButton")}
  ${extractFunction("rotateSkillsDown")}
  ${extractFunction("undoRoller")}
  this.rotateSkillsDown = rotateSkillsDown;
  this.undoRoller = undoRoller;
`, sandbox);
sandbox.rotateSkillsDown();
assert(!sandbox.undoRollerBtn.disabled, "Using roller must enable the undo button.");
sandbox.undoRoller();
assert(sandbox.undoRollerBtn.disabled, "Undoing the last roller action must disable the undo button.");
assert(
  html.includes("rollerHistory.length = 0; updateRollerUndoButton();"),
  "Clearing the team must clear roller history and disable the undo button."
);

console.log("Roller runtime static checks passed.");
