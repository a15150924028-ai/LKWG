const assert = require("assert");
const fs = require("fs");
const path = require("path");

const bundle = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "local-bundle.json"), "utf8")
);
const skillsByName = new Map(bundle.skills.map((skill) => [skill.name, skill]));

const expectedDescriptions = {
  "偷袭": "造成物伤，应对状态：本次技能威力变为3倍。",
  "技巧打击": "造成物伤，应对状态：本次技能威力变为10倍。",
  "有效预防": "减伤50%，应对攻击：下一次行动获得先手+1。",
  "无畏之心": "减伤100%，应对攻击：将减免的伤害转化为等量生命恢复，且本技能能耗永久+2。"
};

for (const [name, description] of Object.entries(expectedDescriptions)) {
  assert.equal(
    skillsByName.get(name)?.description,
    description,
    `${name} description should be repaired`
  );
}

for (const name of ["水星水", "冰荆棘", "冰刺", "极速冷冻"]) {
  assert.equal(skillsByName.has(name), false, `${name} should be removed`);
  assert.equal(
    bundle.monsters.some((monster) => monster.skillIds.includes(`skill-${name}`)),
    false,
    `${name} should not remain in a monster skill pool`
  );
}

console.log("PVP skill data cleanup static test passed.");
