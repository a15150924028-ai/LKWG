const fs = require("fs");
const path = require("path");

const htmlPath = path.join(__dirname, "..", "克制面查询.html");
const html = fs.readFileSync(htmlPath, "utf8");

function assertIncludes(needle, message) {
  if (!html.includes(needle)) {
    throw new Error(message);
  }
}

assertIncludes('const DEFAULT_DAMAGE_TALENTS = ["talent-hp", "talent-def", "talent-spd"];', "Default talents must be life, physical defense, and magic defense.");
assertIncludes('const DEFAULT_DAMAGE_NATURE_TEXT = "踏实性格";', "Default nature text must be 踏实性格.");
assertIncludes('const DEFAULT_DAMAGE_TALENT_TEXT = "生命、物防、魔防";', "Default talent text must list 生命、物防、魔防.");
assertIncludes("function defaultDamageTalentEmptyText", "Talent combo empty states must show their default stat.");
assertIncludes('emptyText: `默认${DEFAULT_DAMAGE_NATURE_TEXT}`', "Nature empty state must show the default nature.");
assertIncludes("emptyText: defaultDamageTalentEmptyText(talentIndex)", "Talent empty states must show the default stat by slot.");

console.log("Default build static checks passed.");
