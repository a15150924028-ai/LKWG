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
  ${extractFunction("pvpSkillDescriptionText")}
  this.repairCachedSkillCategory = repairCachedSkillCategory;
  this.repairCachedSkillPower = repairCachedSkillPower;
  this.pvpSkillDescriptionText = pvpSkillDescriptionText;
`, sandbox);

const directSkill = {
  id: "skill-direct",
  name: "direct skill",
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
  name: "nested skill",
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
assert(
  sandbox.pvpSkillDescriptionText({ description: "\u8017\u80fd" }) === "\u6682\u65e0\u6280\u80fd\u63cf\u8ff0",
  "PVP skill descriptions must ignore stale energy placeholder text."
);
assert(
  sandbox.pvpSkillDescriptionText({ description: "\u80fd\u8017" }) === "\u6682\u65e0\u6280\u80fd\u63cf\u8ff0",
  "PVP skill descriptions must ignore stale cost placeholder text."
);
assert(
  sandbox.pvpSkillDescriptionText({ description: "\u9020\u6210\u7269\u4f24\uff0c\u6bcf\u6b21\u4f7f\u7528\u540e\u5a01\u529b+20\u3002" }) === "\u9020\u6210\u7269\u4f24\uff0c\u6bcf\u6b21\u4f7f\u7528\u540e\u5a01\u529b+20\u3002",
  "PVP skill descriptions must keep real skill descriptions."
);

const damageResultSource = extractFunction("renderPvpDamageResult");
assert(
  damageResultSource.includes("const descriptionText = pvpSkillDescriptionText(damage.action);"),
  "PVP damage results must resolve a sanitized description for the selected skill."
);
assert(
  (damageResultSource.match(/class="pvp-skill-description"/g) || []).length === 3,
  "Normal, response, and non-damage skill results must show the skill description at the bottom."
);
assert(
  /if \(damage\?\.error\) \{[\s\S]*pvpSkillDescriptionText\(action\)[\s\S]*class="pvp-skill-description"/.test(damageResultSource),
  "Defense and status skill error results must still show the selected skill description."
);

console.log("PVP selected skill damage static checks passed.");
