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
  const BOSS_FORM_SUFFIX = "__boss_form";
  const REAL_BOSS_FORM_NAMES = new Set(["\\u5723\\u5149\\u8fea\\u83ab", "\\u98ce\\u66b4\\u6218\\u72ac", "\\u5f69\\u8679\\u72ec\\u89d2\\u517d", "\\u9ed1\\u732b\\u5bc6\\u63a2"]);
  const unique = (values) => [...new Set(values.filter(Boolean))];
  const window = {
    LKWG_PVP_TRAIT_RULES: {
      RULES: [
        { names: ["\\u8fea\\u83ab", "\\u5723\\u5149\\u8fea\\u83ab"] },
        { names: ["\\u62a4\\u4e3b\\u72ac", "\\u97f3\\u901f\\u72ac", "\\u98ce\\u66b4\\u6218\\u72ac"] },
        { names: ["\\u5c0f\\u9ed1\\u732b", "\\u9ed1\\u732b\\u5bc6\\u63a2"] }
      ]
    }
  };
  ${extractFunction("compactMonsterName")}
  ${extractFunction("pvpMonsterNameKeys")}
  ${extractFunction("isBossVariant")}
  ${extractFunction("isGeneratedBossForm")}
  ${extractFunction("bossOptionBaseName")}
  ${extractFunction("visibleMonsterOptions")}
  ${extractFunction("bossFormNamesFromMonsters")}
  ${extractFunction("bossFormDisplayName")}
  ${extractFunction("bossFormSourceMonster")}
  ${extractFunction("createGeneratedBossForm")}
  ${extractFunction("withBossForms")}
  this.bossFormNamesFromMonsters = bossFormNamesFromMonsters;
  this.withBossForms = withBossForms;
  this.isBossVariant = isBossVariant;
  this.isGeneratedBossForm = isGeneratedBossForm;
  this.visibleMonsterOptions = visibleMonsterOptions;
`, sandbox);

const monsters = [
  { id: "dimo", name: "\u8fea\u83ab", aliases: [], icon: "dimo.png", types: ["light"], skillIds: ["s1"], raw: { chainId: "chain-dimo", evolutionStage: 1, stats: { hp: 100 } } },
  { id: "guard", name: "\u62a4\u4e3b\u72ac", aliases: [], icon: "guard.png", types: ["normal"], skillIds: ["s2"], raw: { chainId: "chain-dog", evolutionStage: 1 } },
  { id: "sonic", name: "\u97f3\u901f\u72ac", aliases: [], icon: "sonic.png", types: ["normal"], skillIds: ["s3"], raw: { chainId: "chain-dog", evolutionStage: 2 } },
  { id: "storm", name: "\u98ce\u66b4\u6218\u72ac", aliases: [], icon: "storm.png", types: ["normal"], skillIds: ["s4"], raw: { chainId: "chain-dog", evolutionStage: 3 } },
  { id: "rainbow-boss", name: "\u5f69\u8679\u72ec\u89d2\u517d", aliases: [], icon: "rainbow.png", types: ["light"], skillIds: ["s7"], raw: { "\u7cbe\u7075\u5f62\u6001": "\u9996\u9886\u5f62\u6001" } },
  { id: "black-cat-base", name: "\u5c0f\u9ed1\u732b", aliases: [], icon: "black-base.png", types: ["normal"], skillIds: ["s8"], raw: { chainId: "chain-black-cat", evolutionStage: 1 } },
  { id: "black-cat-boss", name: "\u9ed1\u732b\u5bc6\u63a2", aliases: [], icon: "black-boss.png", types: ["normal"], skillIds: ["s9"], raw: { "\u7cbe\u7075\u5f62\u6001": "\u9996\u9886\u5f62\u6001" } },
  { id: "new-boss-source", name: "\u52a8\u6001\u5f62\u6001\u6e90", aliases: [], icon: "new.png", types: ["water"], skillIds: ["s5"], raw: { bossFormAvailable: true } },
  { id: "listed-boss-source", name: "\u540d\u5355\u5f62\u6001\u6e90", aliases: [], icon: "listed.png", types: ["fire"], skillIds: ["s6"], raw: { bossFormNames: ["\u540d\u5355\u5f62\u6001\u6e90"] } },
  { id: "direct-suffix-base", name: "\u4f0a\u5170\u9f99", aliases: [], icon: "yilan.png", types: ["dragon"], skillIds: ["s10"], raw: {} },
  { id: "direct-suffix-boss", name: "\u4f0a\u5170\u9f99\uff08\u9996\u9886\uff09", aliases: [], icon: "yilan-boss.png", types: ["dragon"], skillIds: ["s11"], raw: {} }
];

const bossNames = sandbox.bossFormNamesFromMonsters(monsters);
assert(bossNames.includes("\u52a8\u6001\u5f62\u6001\u6e90"), "Boss-capable forms from local package data should be added to the boss form name pool.");
assert(bossNames.includes("\u540d\u5355\u5f62\u6001\u6e90"), "Local boss form name lists should be added to the boss form name pool.");

const withBoss = sandbox.withBossForms(monsters);
assert(withBoss.some((monster) => monster.id === "storm"), "Normal final forms should remain in the PVP monster pool.");
const stormBoss = withBoss.find((monster) => monster.name === "\u98ce\u66b4\u6218\u72ac\uff08\u9996\u9886\uff09");
assert(stormBoss, "PVP monster pool should include a generated boss form for existing boss-capable forms.");
assert(stormBoss.raw.isGeneratedBossForm, "Generated boss forms should be marked as generated boss forms.");
assert(stormBoss.raw.baseMonsterId === "storm", "Generated boss forms should keep their source monster link.");
assert(stormBoss.skillIds.includes("s4"), "Generated boss forms should preserve source skills.");
assert(stormBoss.aliases.includes("\u98ce\u66b4\u6218\u72ac"), "Generated boss forms should remain searchable by the base boss name.");
assert(sandbox.isBossVariant(stormBoss), "Generated boss forms should count as boss variants.");
const visibleBossOptions = sandbox.visibleMonsterOptions(withBoss);
assert(
  visibleBossOptions.some((monster) => monster.id === "storm"),
  "Normal source monsters should remain visible in monster dropdowns."
);
assert(
  !visibleBossOptions.some((monster) => monster.id === stormBoss.id),
  "Generated suffixed boss forms should be hidden from monster dropdowns to avoid duplicate choices."
);
assert(
  visibleBossOptions.some((monster) => monster.id === "direct-suffix-base"),
  "The normal record should remain visible when a direct suffixed boss duplicate exists."
);
assert(
  !visibleBossOptions.some((monster) => monster.id === "direct-suffix-boss"),
  "Direct suffixed boss duplicates should be hidden when their normal record exists."
);

const directRainbowBoss = withBoss.find((monster) => monster.id === "rainbow-boss");
assert(sandbox.isBossVariant(directRainbowBoss), "Local monsters whose form field is boss form should count directly as boss variants.");
assert(
  visibleBossOptions.some((monster) => monster.id === "rainbow-boss"),
  "Direct boss records from the data package should remain visible instead of being removed."
);
assert(
  !withBoss.some((monster) => monster.name === "\u5f69\u8679\u72ec\u89d2\u517d\uff08\u9996\u9886\uff09"),
  "Direct boss monsters should not generate duplicate suffixed boss forms."
);
assert(
  !withBoss.some((monster) => monster.name === "\u9ed1\u732b\u5bc6\u63a2\uff08\u9996\u9886\uff09"),
  "Direct boss records should not generate duplicate suffixed boss forms even when a trait-rule family source exists."
);

const dimoBoss = withBoss.find((monster) => monster.name === "\u5723\u5149\u8fea\u83ab\uff08\u9996\u9886\uff09");
assert(dimoBoss, "PVP monster pool should generate missing boss forms from trait-rule family names.");
assert(dimoBoss.raw.baseMonsterId === "dimo", "Missing boss forms should use the available family source monster.");
assert(dimoBoss.types.includes("light"), "Generated missing boss forms should preserve source typing.");

const dynamicBoss = withBoss.find((monster) => monster.name === "\u52a8\u6001\u5f62\u6001\u6e90\uff08\u9996\u9886\uff09");
assert(dynamicBoss, "PVP monster pool should generate boss forms discovered from local monster data.");
assert(dynamicBoss.raw.baseMonsterId === "new-boss-source", "Dynamic boss forms should preserve their discovered source monster.");

const generatedAgain = sandbox.withBossForms(withBoss);
assert(
  generatedAgain.filter((monster) => monster.name === "\u98ce\u66b4\u6218\u72ac\uff08\u9996\u9886\uff09").length === 1,
  "Boss form generation should be idempotent and not duplicate generated forms."
);

assert(html.includes("monsters: withBossForms(dexSourceData.monsters || [])"), "Applied dex data should include generated boss forms.");
assert(html.includes("items: visibleMonsterOptions(dexData.monsters)"), "Team monster dropdowns should hide generated duplicate boss forms.");
assert(html.includes("fuzzyMonsterItems(query, visibleMonsterOptions(dexData.monsters))"), "Monster search should query the visible de-duplicated monster list.");

console.log("PVP boss form static checks passed.");
