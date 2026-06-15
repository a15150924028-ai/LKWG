const fs = require("fs");
const path = require("path");

const bundle = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "local-bundle.json"), "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const skill = bundle.skills.find((entry) => entry.name === "微型斥候");
assert(skill, "Local bundle must include 微型斥候.");
assert(skill.id === "skill-微型斥候", "微型斥候 must use the neutral skill id.");
assert(skill.type === "mechanical", "微型斥候 must be mechanical type.");
assert(skill.category === "special", "微型斥候 must be a magic attack skill.");
assert(skill.power === 75, "微型斥候 must use BWiki power 75.");
assert(skill.pp === 3, "微型斥候 must use BWiki energy cost 3.");
assert(
  skill.description === "造成魔伤，自己每受到一次抵抗伤害，本技能威力永久+20。",
  "微型斥候 description must match the BWiki skill page."
);

const arkLine = ["钨丝贝贝", "辉光幕机", "机幕方舟"];
const monsters = arkLine.map((name) => {
  const monster = bundle.monsters.find((entry) => entry.name === name);
  assert(monster, `Missing 方舟 evolution monster ${name}.`);
  return monster;
});
const chainIds = new Set(monsters.map((monster) => monster.raw?.chainId));
assert(chainIds.size === 1 && [...chainIds][0], "方舟 evolution line must share one chainId.");
monsters.forEach((monster, index) => {
  assert(Number(monster.raw?.evolutionStage) === index + 1, `${monster.name} must keep its 方舟 evolution stage.`);
  assert(
    monster.skillIds.includes("skill-微型斥候"),
    `${monster.name} must be able to learn 微型斥候.`
  );
});

console.log("Ark evolution skill pool checks passed.");
