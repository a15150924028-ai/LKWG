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

assert.ok(rules.RULES.length >= 20);
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
assert.equal(rules.traitName(monster("黑猫密探", "unsupported")), "先知");
assert.equal(rules.resolveTraitRule(monster("黑猫密探", "unsupported")), null);

assert.equal(rules.resolveTraitRule(monster("绿耳松鼠", "049")).traitName, "囤积");
assert.equal(rules.resolveTraitRule(monster("皇家狮鹫（高山地的样子）", "165")).traitName, "乘风连击");
assert.equal(rules.resolveTraitRule(monster("圣光迪莫", "chain-dimo")).traitName, "最好的伙伴");
assert.equal(
  rules.resolveTraitRule({ name: "抱枕松鼠", raw: { chainId: "049" } }).traitName,
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
  { hp: 0, atk: 0.6, defense: 0.6, spa: 0, spd: 0, spe: 0 }
);
assert.deepEqual(
  rules.resolveTraitEffects(monster("迪莫", "chain-dimo"), 2).statMods,
  { hp: 0, atk: 0.4, defense: 0.4, spa: 0.4, spd: 0.4, spe: 0.4 }
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

console.log("pvp trait layer rules ok");
