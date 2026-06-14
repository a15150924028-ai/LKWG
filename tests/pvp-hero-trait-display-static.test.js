const fs = require("fs");
const path = require("path");
const vm = require("vm");

const htmlFile = "index.html";
const html = fs.readFileSync(path.join(__dirname, "..", htmlFile), "utf8");
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sandbox = { console, module: { exports: {} }, globalThis: {} };
sandbox.window = sandbox.globalThis;
vm.runInNewContext(scripts.find((script) => script.includes("LKWG_PVP_TRAIT_RULES") && script.includes("module.exports = api")), sandbox);
const traitRules = sandbox.module.exports;

const expectedTraits = new Map([
  ["\u97f3\u901f\u72ac", "\u4e13\u6ce8\u529b"],
  ["\u706b\u795e", "\u52a9\u71c3"],
  ["\u8e66\u5e8a\u677e\u9f20", "\u56e4\u79ef"],
  ["\u6ce2\u666e\u9e7f", "\u8d85\u7ea7\u7535\u6c60"],
  ["\u98ce\u66b4\u6218\u72ac", "\u5168\u795e\u8d2f\u6ce8"],
  ["\u68a6\u60f3\u4e09\u4e09", "\u9f13\u6c14"]
]);

for (const [name, expectedTrait] of expectedTraits) {
  const monster = { name, raw: {} };
  assert(
    traitRules.traitName(monster) === expectedTrait,
    `PVP hero trait should display ${expectedTrait} for ${name} without requiring chain id.`
  );
}

const bossVariant = { name: "\u98ce\u66b4\u6218\u72ac\uff08\u9996\u9886\uff09", raw: {} };
assert(
  traitRules.traitName(bossVariant) === "\u5168\u795e\u8d2f\u6ce8",
  "PVP hero trait should match named boss/form variants without requiring chain id."
);

const passiveOnlyMonster = { name: "\u672a\u5efa\u7acb\u94feID\u7684\u7cbe\u7075", raw: { "\u7279\u6027": "\u6d04\u6e38" } };
assert(
  traitRules.traitName(passiveOnlyMonster) === "\u6d04\u6e38",
  "PVP hero trait should match generic passive names when chain id is missing."
);

const nestedPassiveOnlyMonster = { name: "\u65e7\u7f13\u5b58\u7cbe\u7075", raw: { raw: { "\u7279\u6027": "\u56e4\u79ef" } } };
assert(
  traitRules.traitName(nestedPassiveOnlyMonster) === "\u56e4\u79ef",
  "PVP hero trait should match nested cached passive names when chain id is missing."
);

const dimoEffects = traitRules.resolveTraitEffects({ name: "\u8fea\u83ab", raw: {} }, 1);
assert(
  dimoEffects.traitName === "\u6700\u597d\u7684\u4f19\u4f34",
  "Dimo should resolve the 最好的伙伴 PVP trait."
);
["atk", "defense", "spa", "spd", "spe"].forEach((statKey) => {
  assert(
    Math.abs(dimoEffects.statMods[statKey] - 0.2) < 1e-9,
    `Dimo 最好的伙伴 should add 20% ${statKey} per layer.`
  );
});

const expectedLayerEffects = [
  {
    name: "\u7535\u52a8\u957f\u9888\u9e7f",
    trait: "\u84c4\u7535\u6c60",
    layers: 1,
    stats: { atk: 0.3, spa: 0.3 }
  },
  {
    name: "\u6ce2\u666e\u9e7f",
    trait: "\u8d85\u7ea7\u7535\u6c60",
    layers: 1,
    stats: { atk: 0.4, spa: 0.4 }
  },
  {
    name: "\u68a6\u60f3\u4e09\u4e09",
    trait: "\u9f13\u6c14",
    layers: 1,
    stats: { atk: 0.2, defense: 0.2, spa: 0.2, spd: 0.2 }
  },
  {
    name: "\u5947\u68a6\u54aa",
    trait: "\u4e09\u9f13\u4f5c\u6c14",
    layers: 1,
    stats: { atk: 0.2, defense: 0.2, spa: 0.2, spd: 0.2 },
    persists: true
  },
  {
    name: "\u9ed1\u732b\u5bc6\u63a2",
    trait: "\u5148\u77e5",
    layers: 1,
    stats: { atk: 0.5, spa: 0.5 },
    flatStats: { spe: 50 }
  },
  {
    name: "\u9ec4\u8702\u540e",
    trait: "\u866b\u7fa4\u9f13\u821e",
    layers: 1,
    stats: { atk: 0.1, defense: 0.1, spa: 0.1, spd: 0.1, spe: 0.1 }
  },
  {
    name: "\u82b1\u9b41\u8702\u540e",
    trait: "\u866b\u7fa4\u7a81\u88ad",
    layers: 1,
    stats: { atk: 0.15, defense: 0.15, spa: 0.15, spd: 0.15, spe: 0.15 }
  },
  {
    name: "\u5c0f\u9f13\u8c61",
    trait: "\u5408\u62cd",
    layers: 1,
    stats: { atk: 0.2, defense: 0.2 },
    persists: true
  },
  {
    name: "\u68cb\u7eee\u540e\uff08\u767d\u5b50\uff09",
    trait: "\u6e17\u900f",
    layers: 1,
    stats: { atk: 0.05, defense: 0.05, spa: 0.05, spd: 0.05 }
  },
  {
    name: "\u68cb\u5951\u965b\u4e0b\uff08\u68cb\u7eee\u540e\u767d\u5b50\uff09",
    trait: "\u5fa1\u9a7e\u4eb2\u5f81",
    layers: 1,
    stats: { atk: 0.05, defense: 0.05, spa: 0.05, spd: 0.05 }
  },
  {
    name: "\u68cb\u5951\u965b\u4e0b\uff08\u68cb\u7eee\u540e\u9ed1\u5b50\uff09",
    trait: "\u5fa1\u9a7e\u4eb2\u5f81",
    layers: 1,
    stats: { atk: 0.05, defense: 0.05, spa: 0.05, spd: 0.05 }
  },
  {
    name: "\u6b66\u8005\u9e21",
    trait: "\u6597\u6280",
    layers: 1,
    flatPower: 30,
    persists: true
  },
  {
    name: "\u7ec5\u58eb\u9e21",
    trait: "\u6307\u6325\u5bb6",
    layers: 1,
    stats: { atk: 0.3, spa: 0.3 },
    persists: true
  }
];

for (const expected of expectedLayerEffects) {
  const monster = { name: expected.name, raw: {} };
  const effects = traitRules.resolveTraitEffects(monster, expected.layers);
  assert(effects.traitName === expected.trait, `${expected.name} should resolve ${expected.trait}.`);
  for (const [statKey, value] of Object.entries(expected.stats || {})) {
    assert(
      Math.abs(effects.statMods[statKey] - value) < 1e-9,
      `${expected.trait} should add ${value * 100}% ${statKey} per layer.`
    );
  }
  for (const [statKey, value] of Object.entries(expected.flatStats || {})) {
    assert(
      effects.statFlatMods[statKey] === value,
      `${expected.trait} should add ${value} flat ${statKey} per layer.`
    );
  }
  if (expected.flatPower != null) {
    assert(effects.flatPower === expected.flatPower, `${expected.trait} should add ${expected.flatPower} flat power per layer.`);
  }
  if (expected.persists) {
    assert(traitRules.traitPersistsOnSwitch(monster), `${expected.trait} layers should persist when switching monsters.`);
  }
}

const chessEmperorFormsWithoutLayerBuff = [
  "\u68cb\u5951\u965b\u4e0b\uff08\u68cb\u9a91\u58eb\u767d\u5b50\uff09",
  "\u68cb\u5951\u965b\u4e0b\uff08\u68cb\u9a91\u58eb\u9ed1\u5b50\uff09",
  "\u68cb\u5951\u965b\u4e0b\uff08\u68cb\u9f50\u5792\u767d\u5b50\uff09",
  "\u68cb\u5951\u965b\u4e0b\uff08\u68cb\u9f50\u5792\u9ed1\u5b50\uff09",
  "\u68cb\u5951\u965b\u4e0b\uff08\u68cb\u7948\u7763\u767d\u5b50\uff09",
  "\u68cb\u5951\u965b\u4e0b\uff08\u68cb\u7948\u7763\u9ed1\u5b50\uff09"
];

for (const name of chessEmperorFormsWithoutLayerBuff) {
  const effects = traitRules.resolveTraitEffects({ name, raw: {} }, 1);
  assert(effects.rule === null, `${name} must not expose a trait-layer buff.`);
  ["atk", "defense", "spa", "spd", "spe"].forEach((statKey) => {
    assert(effects.statMods[statKey] === 0, `${name} must not gain ${statKey} from trait layers.`);
  });
}

const warningEffects = traitRules.resolveTraitEffects({ name: "\u5c0f\u9ed1\u732b", raw: {} }, 2);
assert(warningEffects.statFlatMods.spe === 100, "预警 should add 50 speed per layer.");
assert(
  !html.includes("预警") || !html.includes("data-pvp-buff-stat=\"spe\""),
  "预警 speed should not be rendered as a normal buff-state row."
);

assert(
  html.includes("${traitRule ? `"),
  "PVP trait layer row should still be gated by resolved trait rules."
);

assert(
  html.includes("traitPersistsOnSwitch"),
  "PVP monster switching must consult trait persistence rules before resetting trait layers."
);

console.log("PVP hero trait display static checks passed.");
