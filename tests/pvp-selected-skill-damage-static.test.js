const fs = require("fs");
const path = require("path");
const vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sandbox = {};
vm.runInNewContext(`
  ${extractFunction("repairCachedSkillCategory")}
  ${extractFunction("repairCachedSkillPower")}
  this.repairCachedSkillCategory = repairCachedSkillCategory;
  this.repairCachedSkillPower = repairCachedSkillPower;
`, sandbox);

const directSkill = {
  id: "skill-direct",
  name: "直接技能",
  type: "fire",
  category: "physical",
  mode: "attack",
  power: 80,
  raw: {}
};
assert(sandbox.repairCachedSkillCategory(directSkill) === "physical", "Selected skills must keep their direct category.");
assert(sandbox.repairCachedSkillPower(directSkill) === 80, "Selected skills must keep their direct numeric power.");

const nestedSkill = {
  id: "skill-nested",
  name: "嵌套技能",
  type: "fighting",
  category: "",
  power: null,
  raw: {
    rendered: { category: "attack", power: null },
    raw: { category: "physical", power: 25 }
  }
};
assert(sandbox.repairCachedSkillCategory(nestedSkill) === "attack", "Normalized nested skill data must recover an attack category.");
assert(sandbox.repairCachedSkillPower(nestedSkill) === 25, "Normalized nested skill data must recover numeric power.");

assert(
  html.includes("skill.category = repairCachedSkillCategory(skill);"),
  "Data application must repair selected skill category before PVP use."
);
assert(
  html.includes("skill.power = repairCachedSkillPower(skill);"),
  "Data application must repair selected skill power before PVP use."
);
assert(
  html.includes("skillIndex: battleAction.pvpSkillIndex"),
  "PVP variable damage rules must receive the selected skill slot from the action."
);
assert(
  html.includes("const skill = skillById.get(state.skillIds?.[skillIndex]);"),
  "PVP damage must resolve the selected skill through skillById."
);

console.log("PVP selected skill damage static checks passed.");
