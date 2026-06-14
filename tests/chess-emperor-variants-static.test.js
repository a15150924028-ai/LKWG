const fs = require("fs");
const path = require("path");

const bundle = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "local-bundle.json"), "utf8")
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function monster(name) {
  const item = bundle.monsters.find((entry) => entry.name === name);
  assert(item, `Missing monster ${name}.`);
  return item;
}

const expectedSkillIds = [
  "寸拳", "魔法增效", "防御", "气波", "缠丝劲", "力量增效", "跺地", "化劲",
  "猛烈撞击", "影袭", "钧势", "石肤术", "陨石", "提气", "蓄势待发", "岩脉崩毁",
  "破绽", "休息回复", "徒长", "引燃", "蓄水", "虹光冲击", "扬沙", "霜降",
  "升龙咆哮", "麻痹", "毒孢子", "假寐", "贯手", "羽化加速", "甜心续航", "灵媒",
  "贪婪", "啮合传递", "超维投射", "鸣沙陷阱", "听桥", "预备势", "叠势", "气沉丹田",
  "一拳", "抛石", "透射", "天光", "漫反射", "放晴", "热身运动", "迫近攻击",
  "先发制人", "触底强击", "借用", "晒太阳", "摇篮曲", "防御反击", "有效预防", "扫尾"
].map((name) => `skill-${name}`);

const variants = [
  {
    name: "棋契陛下（棋骑士白子）",
    middle: "棋骑士（白子）",
    root: "棋棋（白子）",
    stats: { hp: 90, atk: 200, defense: 140, spa: 91, spd: 115, spe: 125 }
  },
  {
    name: "棋契陛下（棋骑士黑子）",
    middle: "棋骑士（黑子）",
    root: "棋棋（黑子）",
    stats: { hp: 83, atk: 194, defense: 135, spa: 88, spd: 111, spe: 125 }
  },
  {
    name: "棋契陛下（棋齐垒白子）",
    middle: "棋齐垒（白子）",
    root: "棋棋（白子）",
    stats: { hp: 93, atk: 143, defense: 133, spa: 143, spd: 123, spe: 90 }
  },
  {
    name: "棋契陛下（棋齐垒黑子）",
    middle: "棋齐垒（黑子）",
    root: "棋棋（黑子）",
    stats: { hp: 93, atk: 143, defense: 133, spa: 143, spd: 123, spe: 90 }
  },
  {
    name: "棋契陛下（棋祈督白子）",
    middle: "棋祈督（白子）",
    root: "棋棋（白子）",
    stats: { hp: 89, atk: 157, defense: 179, spa: 80, spd: 125, spe: 75 }
  },
  {
    name: "棋契陛下（棋祈督黑子）",
    middle: "棋祈督（黑子）",
    root: "棋棋（黑子）",
    stats: { hp: 89, atk: 157, defense: 179, spa: 80, spd: 125, spe: 75 }
  },
  {
    name: "棋契陛下（棋绮后白子）",
    middle: "棋绮后（白子）",
    root: "棋棋（白子）",
    stats: { hp: 126, atk: 147, defense: 143, spa: 147, spd: 118, spe: 85 }
  },
  {
    name: "棋契陛下（棋绮后黑子）",
    middle: "棋绮后（黑子）",
    root: "棋棋（黑子）",
    stats: { hp: 126, atk: 147, defense: 143, spa: 147, spd: 118, spe: 85 }
  }
];

assert(!bundle.monsters.some((entry) => entry.name === "棋契陛下"), "Merged 棋契陛下 record must be removed.");

const ids = new Set();
const chainIds = new Set();
const skillArrayReferences = new Set();

for (const expected of variants) {
  const finalForm = monster(expected.name);
  const middleForm = monster(expected.middle);
  const line = [expected.root, expected.middle, expected.name];

  assert(!ids.has(finalForm.id), `${expected.name} must have a unique monster id.`);
  ids.add(finalForm.id);
  assert(JSON.stringify(finalForm.stats) === JSON.stringify(expected.stats), `${expected.name} stats are incorrect.`);
  assert(finalForm.passiveIds.includes("passive-御驾亲征"), `${expected.name} must keep 御驾亲征.`);
  assert(
    JSON.stringify(finalForm.skillIds) === JSON.stringify(expectedSkillIds),
    `${expected.name} must carry the exact 56 rendered-page skills.`
  );
  assert(!skillArrayReferences.has(finalForm.skillIds), `${expected.name} must own an independent skillIds array.`);
  skillArrayReferences.add(finalForm.skillIds);

  assert(finalForm.raw?.chainId, `${expected.name} must have a chainId.`);
  assert(!chainIds.has(finalForm.raw.chainId), `${expected.name} must have a unique chainId.`);
  chainIds.add(finalForm.raw.chainId);
  assert(finalForm.raw.evolutionChainId === finalForm.raw.chainId, `${expected.name} must mirror evolutionChainId.`);
  assert(finalForm.raw.evolutionStage === 3, `${expected.name} must be evolution stage 3.`);
  assert(JSON.stringify(finalForm.raw.evolutionLine) === JSON.stringify(line), `${expected.name} evolutionLine is incorrect.`);

  assert(middleForm.raw?.chainId === finalForm.raw.chainId, `${expected.middle} must share ${expected.name}'s chainId.`);
  assert(middleForm.raw?.evolutionStage === 2, `${expected.middle} must be evolution stage 2.`);
  assert(JSON.stringify(middleForm.raw?.evolutionLine) === JSON.stringify(line), `${expected.middle} evolutionLine is incorrect.`);

  const rootLines = monster(expected.root).raw?.evolutionLines || [];
  assert(
    rootLines.some((candidate) => JSON.stringify(candidate) === JSON.stringify(line)),
    `${expected.root} must retain branch ${line.join(" > ")}.`
  );
}

for (const [whiteName, blackName] of [
  ["棋契陛下（棋齐垒白子）", "棋契陛下（棋齐垒黑子）"],
  ["棋契陛下（棋祈督白子）", "棋契陛下（棋祈督黑子）"],
  ["棋契陛下（棋绮后白子）", "棋契陛下（棋绮后黑子）"]
]) {
  assert(
    JSON.stringify(monster(whiteName).skillIds) === JSON.stringify(monster(blackName).skillIds),
    `${whiteName} and ${blackName} should temporarily have equal skill contents.`
  );
}

console.log("Chess emperor variant data checks passed.");
