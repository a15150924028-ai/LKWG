const assert = require("assert");
const fs = require("fs");
const path = require("path");

const bundle = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "local-bundle.json"), "utf8")
);

const expectedStats = {
  "凡雀": { hp: 71, atk: 55, defense: 52, spa: 53, spd: 66, spe: 75 },
  "紫翎鹰": { hp: 94, atk: 74, defense: 69, spa: 71, spd: 88, spe: 100 },
  "凡鹰": { hp: 118, atk: 92, defense: 86, spa: 89, spd: 110, spe: 125 },
};

const expectedSkills = [
  "鸣叫",
  "防御",
  "乘风",
  "音波弹",
  "疾风刺",
  "锐利眼神",
  "先发制人",
  "翼击",
  "羽化加速",
  "能量炮",
  "见招拆招",
  "暴风眼",
  "吞噬",
  "飞箭",
  "俯冲",
  "星星撞击",
  "花香",
  "火焰冲锋",
  "泡沫",
  "透射",
  "扬沙",
  "冰爪",
  "升龙咆哮",
  "球状闪电",
  "毒沼",
  "噬心",
  "贯手",
  "风矢",
  "碰爪",
  "灵媒",
  "恶能量",
  "金属噪音",
  "星云漩涡",
  "晒太阳",
  "伺机而动",
  "热身运动",
  "三连破",
  "乱打",
  "埋伏",
  "龙卷风",
  "突袭",
  "复写",
  "光之矛",
  "水花四溅",
  "缠丝劲",
  "快速移动",
  "天光",
  "潮涌",
  "叠势",
  "连续爪击",
  "疾风涡轮",
].map((name) => `skill-${name}`);

const expectedSkillDetails = {
  "飞箭": {
    type: "wing",
    category: "special",
    power: 40,
    pp: 3,
    description: "造成魔伤，3连击。巧变：翼系防御技能。",
  },
  "俯冲": {
    type: "wing",
    category: "physical",
    power: 170,
    pp: 7,
    description: "造成物伤，先手+1。",
  },
};

for (const [name, stats] of Object.entries(expectedStats)) {
  const monster = bundle.monsters.find((entry) => entry.name === name);
  assert(monster, `Missing BWiki monster ${name}.`);
  assert.deepEqual(monster.types, ["wing"], `${name} must be wing type.`);
  assert.deepEqual(monster.stats, stats, `${name} stats must match the BWiki rendered page.`);
  assert.deepEqual(monster.passiveIds, ["passive-展翅"], `${name} must keep 展翅.`);
  assert.deepEqual(monster.skillIds, expectedSkills, `${name} must carry the complete 51-skill pool.`);
}

const line = ["凡雀", "紫翎鹰", "凡鹰"].map((name) => bundle.monsters.find((entry) => entry.name === name));
const chainIds = new Set(line.map((monster) => monster.raw?.chainId));
assert.equal(chainIds.size, 1, "凡雀 evolution line must share one chainId.");
line.forEach((monster, index) => {
  assert.equal(monster.raw?.evolutionChainId, monster.raw?.chainId, `${monster.name} must mirror evolutionChainId.`);
  assert.equal(Number(monster.raw?.evolutionStage), index + 1, `${monster.name} must keep its BWiki evolution stage.`);
});

for (const [name, expected] of Object.entries(expectedSkillDetails)) {
  const skill = bundle.skills.find((entry) => entry.name === name);
  assert(skill, `Missing BWiki skill ${name}.`);
  for (const [key, value] of Object.entries(expected)) {
    assert.deepEqual(skill[key], value, `${name}.${key} must match BWiki.`);
  }
  assert.equal(skill.energyCost, null, `${name} must keep the local null energyCost shape.`);
  assert.equal(skill.accuracy, null, `${name} must keep the local null accuracy shape.`);
  assert.equal(skill.priority, 0, `${name} must use default priority.`);
}

console.log("Fanque evolution line local bundle checks passed.");
