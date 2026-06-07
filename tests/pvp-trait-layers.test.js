const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const rules = require("../pvp_trait_rules.js");

function monster(name, chainId) {
  return { name, chainId };
}

const publicApi = [
  "normalizeTraitLayers",
  "resolveTraitRule",
  "defaultTraitLayers",
  "traitName",
  "traitPassiveNames",
  "resolveTraitEffects",
  "RULES",
  "BOSS_TRAIT_NAMES"
];
for (const key of publicApi) {
  assert.ok(key in rules, `missing public API: ${key}`);
}

const browserContext = {};
vm.createContext(browserContext);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, "..", "pvp_trait_rules.js"), "utf8"),
  browserContext
);
assert.ok(browserContext.LKWG_PVP_TRAIT_RULES);

const expectedRegistry = [
  [["season-s2-afec977b0e76"], ["小鼓象", "巨鼓象"], "合拍", []],
  [["049"], [], "囤积", []],
  [["181"], [], "身经百练", ["water", "fighting"]],
  [["165"], [], "乘风连击", []],
  [["239"], [], "洄游", []],
  [["212"], [], "拨浪鼓", ["poison", "cute"]],
  [["216"], ["烈火守护"], "拨浪鼓", ["poison", "cute"]],
  [["085"], [], "嫁祸", []],
  [["102"], [], "自由飘", []],
  [["185"], [], "守护者", []],
  [["096"], [], "咔咔冲刺", []],
  [["221"], [], "定向精炼", ["mechanical", "ground"]],
  [["chain-chicken"], ["可立鸡", "晕晕鸡", "绅士鸡"], "指挥家", []],
  [["chain-chicken"], ["武者鸡"], "斗技", []],
  [["171"], [], "消波块", ["ground"]],
  [["323"], [], "血型吸引", []],
  [["258"], [], "恶魔的晚宴", []],
  [["chain-dimo"], ["迪莫", "圣光迪莫"], "最好的伙伴", []],
  [["327"], [], "搜刮", []],
  [["121"], ["小黑猫", "黑猫巫师"], "预警", []],
  [["121", "chain-blackcat-boss"], ["黑猫密探"], "先知", []],
  [["131"], ["恶魔狼"], "悲悯", []],
  [["131", "chain-devilwolf-boss"], ["恶魔狼王"], "悼亡", []],
  [["108"], ["风铃鲨", "蓝蝶鲨", "彩蝶鲨"], "水翼推进", []],
  [["108", "chain-butterflyshark-boss"], ["神谕鲨"], "水翼飞升", []],
  [["198"], ["逗逗", "气球猫", "梦想三三"], "鼓气", []],
  [["198", "chain-dream-boss"], ["奇梦咪"], "三鼓作气", []],
  [["chain-chess"], ["棋绮后（白子）", "棋绮后（黑子）", "棋绮后·白子", "棋绮后·黑子"], "渗透", []],
  [["chain-chess", "chain-chess-boss"], ["棋契陛下"], "御驾亲征", []],
  [["082"], ["一窝蜂", "黄蜂后", "女王蜂"], "虫群鼓舞", []],
  [["082", "chain-queenbee-boss"], ["花魁蜂后"], "虫群突袭", []],
  [["chain-fire"], ["火花", "焰火", "火神"], "助燃", []],
  [["chain-fire", "chain-fire-boss"], ["烈火战神"], "爆燃", []],
  [["226"], ["电动长颈鹿", "奔乐鹿", "爵士鹿"], "蓄电池", []],
  [["226", "chain-jazzdeer-boss"], ["波普鹿"], "超级电池", []],
  [["chain-speeddog"], ["护主犬", "音速犬"], "专注力", []],
  [["chain-speeddog"], ["风暴战犬"], "全神贯注", []]
];
assert.deepEqual(
  rules.RULES.map((rule) => [
    [...rule.chainIds],
    [...(rule.names || [])],
    rule.traitName,
    [...(rule.actionTypes || [])]
  ]),
  expectedRegistry
);
for (const rule of rules.RULES) {
  for (const [stat, value] of Object.entries(rule.statPerLayer || {})) {
    assert.equal(value, 0.1, `${rule.traitName}.${stat} should be 10% per layer`);
  }
}
assert.equal(rules.resolveTraitRule(monster("蹦蹦松鼠", "049")).traitName, "囤积");
assert.equal(rules.defaultTraitLayers(monster("蹦蹦松鼠", "049")), 10);
assert.equal(rules.defaultTraitLayers(monster("抱枕松鼠", "049")), 10);
assert.equal(rules.defaultTraitLayers(monster("音速犬", "chain-speeddog")), 10);
assert.equal(rules.defaultTraitLayers(monster("护主犬", "chain-speeddog")), 10);
assert.equal(rules.defaultTraitLayers(monster("巨鼓象", "season-s2-afec977b0e76")), 0);

const stormDog = monster("风暴战犬", "chain-speeddog");
assert.equal(rules.resolveTraitRule(stormDog).traitName, "全神贯注");
assert.equal(rules.defaultTraitLayers(stormDog), 10);
assert.equal(rules.traitName(stormDog), "全神贯注");
assert.deepEqual(rules.traitPassiveNames(stormDog), ["全神贯注", "专注力"]);

assert.deepEqual(rules.BOSS_TRAIT_NAMES, {
  "风暴战犬": "全神贯注",
  "黑猫密探": "先知",
  "恶魔狼王": "悼亡",
  "神谕鲨": "水翼飞升",
  "奇梦咪": "三鼓作气",
  "棋契陛下": "御驾亲征",
  "花魁蜂后": "虫群突袭",
  "烈火战神": "爆燃",
  "波普鹿": "超级电池"
});
for (const [name, expectedTraitName] of Object.entries(rules.BOSS_TRAIT_NAMES)) {
  if (name === "风暴战犬") continue;
  const boss = monster(name, "unsupported");
  const effects = rules.resolveTraitEffects(boss, 9, { type: "ground" });
  assert.equal(rules.traitName(boss), expectedTraitName);
  assert.equal(effects.traitName, expectedTraitName);
}

const manuallyLayeredTraits = [
  ["黑猫巫师", "121", "预警"],
  ["黑猫密探", "chain-blackcat-boss", "先知"],
  ["恶魔狼", "131", "悲悯"],
  ["恶魔狼王", "chain-devilwolf-boss", "悼亡"],
  ["彩蝶鲨", "108", "水翼推进"],
  ["神谕鲨", "chain-butterflyshark-boss", "水翼飞升"],
  ["梦想三三", "198", "鼓气"],
  ["奇梦咪", "chain-dream-boss", "三鼓作气"],
  ["棋绮后（白子）", "chain-chess", "渗透"],
  ["棋绮后（黑子）", "chain-chess", "渗透"],
  ["棋契陛下", "chain-chess-boss", "御驾亲征"],
  ["女王蜂", "082", "虫群鼓舞"],
  ["花魁蜂后", "chain-queenbee-boss", "虫群突袭"],
  ["火神", "chain-fire", "助燃"],
  ["烈火战神", "chain-fire-boss", "爆燃"],
  ["爵士鹿", "226", "蓄电池"],
  ["波普鹿", "chain-jazzdeer-boss", "超级电池"]
];
for (const [name, chainId, expectedTraitName] of manuallyLayeredTraits) {
  const rule = rules.resolveTraitRule(monster(name, chainId));
  assert.ok(rule, `${name} should have a manual trait-layer rule`);
  assert.equal(rule.traitName, expectedTraitName);
  assert.equal(rules.defaultTraitLayers(monster(name, chainId)), 0);
}

assert.deepEqual(
  rules.resolveTraitEffects(monster("黑猫巫师", "121"), 2).statFlatMods,
  { hp: 0, atk: 0, defense: 0, spa: 0, spd: 0, spe: 100 }
);
assert.deepEqual(
  rules.resolveTraitEffects(monster("黑猫密探", "chain-blackcat-boss"), 1).statFlatMods,
  { hp: 0, atk: 0, defense: 0, spa: 0, spd: 0, spe: 50 }
);
assert.deepEqual(
  rules.resolveTraitEffects(monster("恶魔狼", "131"), 2).statMods,
  { hp: 0, atk: 0.2, defense: 0, spa: 0.2, spd: 0, spe: 0 }
);
assert.equal(
  rules.resolveTraitEffects(monster("彩蝶鲨", "108"), 3).skillCostReduction,
  3
);
assert.deepEqual(
  rules.resolveTraitEffects(monster("棋绮后（白子）", "chain-chess"), 4).statMods,
  { hp: 0, atk: 0.4, defense: 0.4, spa: 0.4, spd: 0.4, spe: 0 }
);
assert.deepEqual(
  rules.resolveTraitEffects(monster("女王蜂", "082"), 2).statMods,
  { hp: 0, atk: 0.2, defense: 0.2, spa: 0.2, spd: 0.2, spe: 0.2 }
);
assert.deepEqual(
  rules.resolveTraitEffects(monster("花魁蜂后", "chain-queenbee-boss"), 2).statMods,
  { hp: 0, atk: 0.2, defense: 0.2, spa: 0.2, spd: 0.2, spe: 0.2 }
);
assert.deepEqual(
  rules.resolveTraitEffects(monster("火神", "chain-fire"), 3).statMods,
  { hp: 0, atk: 0.3, defense: 0, spa: 0.3, spd: 0, spe: 0 }
);
assert.deepEqual(
  rules.resolveTraitEffects(monster("爵士鹿", "226"), 2).statMods,
  { hp: 0, atk: 0.2, defense: 0, spa: 0.2, spd: 0, spe: 0 }
);

assert.equal(rules.resolveTraitRule(monster("绿耳松鼠", "049")).traitName, "囤积");
assert.equal(rules.resolveTraitRule(monster("小鼓象", "season-s2-afec977b0e76")).traitName, "合拍");
assert.equal(rules.resolveTraitRule(monster("皇家狮鹫（高山地的样子）", "165")).traitName, "乘风连击");
assert.equal(rules.resolveTraitRule(monster("圣光迪莫", "chain-dimo")).traitName, "最好的伙伴");
assert.equal(rules.resolveTraitRule(monster("可立鸡", "chain-chicken")).traitName, "指挥家");
assert.equal(rules.resolveTraitRule(monster("晕晕鸡", "chain-chicken")).traitName, "指挥家");
assert.equal(rules.resolveTraitRule(monster("火尾瓦特", "216")), null);
assert.equal(rules.resolveTraitRule(monster("火尾战士", "216")), null);
assert.equal(rules.resolveTraitRule(monster("烈火守护", "216")).traitName, "拨浪鼓");
assert.equal(
  rules.resolveTraitRule(monster("同链测试象", "season-s2-afec977b0e76")),
  null
);
assert.equal(rules.resolveTraitRule(monster("同链测试迪莫", "chain-dimo")), null);
assert.equal(
  rules.resolveTraitRule({ name: "抱枕松鼠", raw: { chainId: "049" } }).traitName,
  "囤积"
);
assert.equal(
  rules.resolveTraitRule({
    name: "抱枕松鼠",
    chainId: "",
    raw: { chainId: "049" }
  }).traitName,
  "囤积"
);
assert.equal(
  rules.resolveTraitRule({ name: "抱枕松鼠", familyId: "049" }).traitName,
  "囤积"
);
assert.equal(
  rules.resolveTraitRule({ name: "抱枕松鼠", raw: { baseId: "049" } }).traitName,
  "囤积"
);
assert.equal(rules.resolveTraitRule(monster("普通测试精灵", "none")), null);
assert.equal(rules.traitName(monster("普通测试精灵", "none")), "");

assert.equal(rules.normalizeTraitLayers(-1), 0);
assert.equal(rules.normalizeTraitLayers(-9.8), 0);
assert.equal(rules.normalizeTraitLayers(2.49), 2);
assert.equal(rules.normalizeTraitLayers(2.5), 3);
assert.equal(rules.normalizeTraitLayers(37), 37);
assert.equal(rules.normalizeTraitLayers("12.6"), 13);
assert.equal(rules.normalizeTraitLayers("invalid"), 0);

const unsupported = rules.resolveTraitEffects(monster("普通测试精灵", "none"), 7);
assert.equal(unsupported.rule, null);
assert.equal(unsupported.layers, 7);
assert.equal(unsupported.traitName, "");
assert.deepEqual(unsupported.statMods, {
  hp: 0,
  atk: 0,
  defense: 0,
  spa: 0,
  spd: 0,
  spe: 0
});
assert.equal(unsupported.flatPower, 0);
assert.equal(unsupported.powerMultiplier, 1);
assert.equal(unsupported.hitCountAdd, 0);
assert.equal(unsupported.skillCostReduction, 0);
assert.equal(unsupported.energyGain, 0);

assert.deepEqual(
  rules.resolveTraitEffects(monster("巨鼓象", "season-s2-afec977b0e76"), 3).statMods,
  { hp: 0, atk: 0.3, defense: 0.3, spa: 0, spd: 0, spe: 0 }
);
assert.deepEqual(
  rules.resolveTraitEffects(monster("迪莫", "chain-dimo"), 2).statMods,
  { hp: 0, atk: 0.2, defense: 0.2, spa: 0.2, spd: 0.2, spe: 0.2 }
);
assert.equal(
  rules.resolveTraitEffects(monster("海豹船长", "181"), 2, { type: "water" }).powerMultiplier,
  1.4
);
assert.equal(
  rules.resolveTraitEffects(monster("海豹船长", "181"), 2, { type: "fire" }).powerMultiplier,
  1
);
assert.equal(
  rules.resolveTraitEffects(monster("寒音蛇（本来的样子）", "212"), 2, { type: "poison" }).flatPower,
  20
);
assert.equal(
  rules.resolveTraitEffects(monster("烈火守护", "216"), 2, { type: "cute" }).flatPower,
  20
);
assert.equal(
  rules.resolveTraitEffects(monster("波多西", "221"), 3, { type: "water" }).flatPower,
  0
);
assert.equal(
  rules.resolveTraitEffects(monster("波多西", "221"), 3, { type: "mechanical" }).flatPower,
  0
);
assert.equal(
  rules.resolveTraitEffects(monster("波多西", "221"), 3, { type: "mechanical" }).powerMultiplier,
  1.3
);
assert.equal(rules.resolveTraitEffects(monster("武者鸡", "chain-chicken"), 3).flatPower, 60);
assert.equal(
  rules.resolveTraitEffects(monster("皇家狮鹫（嵩间地的样子）", "165"), 4).hitCountAdd,
  4
);
assert.equal(rules.resolveTraitEffects(monster("朔夜伊芙", "085"), 3).hitCountAdd, 6);
assert.equal(rules.resolveTraitEffects(monster("龙鱼", "239"), 3).skillCostReduction, 3);
assert.equal(
  rules.resolveTraitEffects(monster("嗜波螺", "171"), 4, { type: "ground" }).skillCostReduction,
  4
);
assert.equal(
  rules.resolveTraitEffects(monster("嗜波螺", "171"), 4, { type: "water" }).skillCostReduction,
  0
);
assert.equal(rules.resolveTraitEffects(monster("迪莫", "chain-dimo"), 2).energyGain, 4);

const firstStatEffects = rules.resolveTraitEffects(monster("巨鼓象", "season-s2-afec977b0e76"), 2);
const secondStatEffects = rules.resolveTraitEffects(monster("巨鼓象", "season-s2-afec977b0e76"), 2);
assert.notEqual(firstStatEffects.statMods, secondStatEffects.statMods);
firstStatEffects.statMods.atk = 99;
assert.equal(secondStatEffects.statMods.atk, 0.2);
assert.equal(
  rules.resolveTraitEffects(monster("巨鼓象", "season-s2-afec977b0e76"), 2).statMods.atk,
  0.2
);

assert.throws(() => rules.RULES[0].chainIds.push("mutated"));
assert.throws(() => rules.RULES[2].actionTypes.push("fire"));
rules.RULES[0].statPerLayer.atk = 99;
rules.BOSS_TRAIT_NAMES["黑猫密探"] = "mutated";
assert.equal(
  rules.resolveTraitEffects(monster("巨鼓象", "season-s2-afec977b0e76"), 2).statMods.atk,
  0.2
);
assert.equal(rules.traitName(monster("黑猫密探", "unsupported")), "先知");

console.log("pvp trait layer rules ok");
