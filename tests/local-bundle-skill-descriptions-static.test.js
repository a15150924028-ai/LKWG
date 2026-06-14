const assert = require("assert");
const fs = require("fs");
const path = require("path");

const bundle = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "local-bundle.json"), "utf8")
);

const placeholderPattern = /^(?:耗能|能耗|能量|pp|PP)\s*[:：]?\s*\d*$/;
const skills = bundle.skills || [];
const staleDescriptions = skills.filter((skill) => {
  const description = String(skill.description || "").trim();
  return !description || placeholderPattern.test(description);
});

assert.deepEqual(
  staleDescriptions.map((skill) => skill.name),
  [],
  "Local skill descriptions must be filled from BWiki instead of keeping empty or energy placeholders."
);

const skillsByName = new Map(skills.map((skill) => [skill.name, skill]));
const expectedDescriptions = {
  "暗突袭": "造成物伤，吸血50%，应对状态：本次技能威力翻倍。",
  "隐藏条款": "与敌方交换携带的技能。",
  "冲撞": "造成物伤，回合结束时，本技能能耗永久-1。",
  "超级糖果": "造成物伤，自己获得萌化：本次技能威力+60。"
};

for (const [name, description] of Object.entries(expectedDescriptions)) {
  assert.equal(
    skillsByName.get(name)?.description,
    description,
    `${name} description must match BWiki 技能图鉴.`
  );
}

console.log("Local bundle skill description checks passed.");
