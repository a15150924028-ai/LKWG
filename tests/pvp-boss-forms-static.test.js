const fs = require("fs");
const path = require("path");
const vm = require("vm");

const htmlFile = fs.readdirSync(path.join(__dirname, ".."))
  .find((name) => name === "\u514b\u5236\u9762\u67e5\u8be2.html");
const html = fs.readFileSync(path.join(__dirname, "..", htmlFile), "utf8");

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
  const REAL_BOSS_FORM_NAMES = new Set(["\\u5723\\u5149\\u8fea\\u83ab", "\\u98ce\\u66b4\\u6218\\u72ac"]);
  const unique = (values) => [...new Set(values.filter(Boolean))];
  const window = {
    LKWG_PVP_TRAIT_RULES: {
      RULES: [
        { names: ["\\u8fea\\u83ab", "\\u5723\\u5149\\u8fea\\u83ab"] },
        { names: ["\\u62a4\\u4e3b\\u72ac", "\\u97f3\\u901f\\u72ac", "\\u98ce\\u66b4\\u6218\\u72ac"] }
      ]
    }
  };
  ${extractFunction("compactMonsterName")}
  ${extractFunction("pvpMonsterNameKeys")}
  ${extractFunction("isBossVariant")}
  ${extractFunction("isGeneratedBossForm")}
  ${extractFunction("bossFormNamesFromMonsters")}
  ${extractFunction("bossFormDisplayName")}
  ${extractFunction("bossFormSourceMonster")}
  ${extractFunction("createGeneratedBossForm")}
  ${extractFunction("withBossForms")}
  this.bossFormNamesFromMonsters = bossFormNamesFromMonsters;
  this.withBossForms = withBossForms;
  this.isBossVariant = isBossVariant;
  this.isGeneratedBossForm = isGeneratedBossForm;
`, sandbox);

const monsters = [
  { id: "dimo", name: "\u8fea\u83ab", aliases: [], icon: "dimo.png", types: ["light"], skillIds: ["s1"], raw: { chainId: "chain-dimo", evolutionStage: 1, stats: { hp: 100 } } },
  { id: "guard", name: "\u62a4\u4e3b\u72ac", aliases: [], icon: "guard.png", types: ["normal"], skillIds: ["s2"], raw: { chainId: "chain-dog", evolutionStage: 1 } },
  { id: "sonic", name: "\u97f3\u901f\u72ac", aliases: [], icon: "sonic.png", types: ["normal"], skillIds: ["s3"], raw: { chainId: "chain-dog", evolutionStage: 2 } },
  { id: "storm", name: "\u98ce\u66b4\u6218\u72ac", aliases: [], icon: "storm.png", types: ["normal"], skillIds: ["s4"], raw: { chainId: "chain-dog", evolutionStage: 3 } },
  { id: "new-boss-source", name: "\u52a8\u6001\u5f62\u6001\u6e90", aliases: [], icon: "new.png", types: ["water"], skillIds: ["s5"], raw: { bossFormAvailable: true } },
  { id: "listed-boss-source", name: "\u540d\u5355\u5f62\u6001\u6e90", aliases: [], icon: "listed.png", types: ["fire"], skillIds: ["s6"], raw: { bossFormNames: ["\u540d\u5355\u5f62\u6001\u6e90"] } }
];

const bossNames = sandbox.bossFormNamesFromMonsters(monsters);
assert(bossNames.includes("\u52a8\u6001\u5f62\u6001\u6e90"), "Boss-capable forms parsed from BWiki data should be added to the boss form name pool.");
assert(bossNames.includes("\u540d\u5355\u5f62\u6001\u6e90"), "Rendered BWiki boss form name lists should be added to the boss form name pool.");

const withBoss = sandbox.withBossForms(monsters);
assert(withBoss.some((monster) => monster.id === "storm"), "Normal final forms should remain in the PVP monster pool.");
const stormBoss = withBoss.find((monster) => monster.name === "\u98ce\u66b4\u6218\u72ac\uff08\u9996\u9886\uff09");
assert(stormBoss, "PVP monster pool should include a generated boss form for existing boss-capable forms.");
assert(stormBoss.raw.isGeneratedBossForm, "Generated boss forms should be marked as generated boss forms.");
assert(stormBoss.raw.baseMonsterId === "storm", "Generated boss forms should keep their source monster link.");
assert(stormBoss.skillIds.includes("s4"), "Generated boss forms should preserve source skills.");
assert(stormBoss.aliases.includes("\u98ce\u66b4\u6218\u72ac"), "Generated boss forms should remain searchable by the base boss name.");
assert(sandbox.isBossVariant(stormBoss), "Generated boss forms should count as boss variants.");

const dimoBoss = withBoss.find((monster) => monster.name === "\u5723\u5149\u8fea\u83ab\uff08\u9996\u9886\uff09");
assert(dimoBoss, "PVP monster pool should generate missing boss forms from trait-rule family names.");
assert(dimoBoss.raw.baseMonsterId === "dimo", "Missing boss forms should use the available family source monster.");
assert(dimoBoss.types.includes("light"), "Generated missing boss forms should preserve source typing.");

const dynamicBoss = withBoss.find((monster) => monster.name === "\u52a8\u6001\u5f62\u6001\u6e90\uff08\u9996\u9886\uff09");
assert(dynamicBoss, "PVP monster pool should generate boss forms discovered from BWiki rendered monster data.");
assert(dynamicBoss.raw.baseMonsterId === "new-boss-source", "Dynamic boss forms should preserve their discovered source monster.");

const generatedAgain = sandbox.withBossForms(withBoss);
assert(
  generatedAgain.filter((monster) => monster.name === "\u98ce\u66b4\u6218\u72ac\uff08\u9996\u9886\uff09").length === 1,
  "Boss form generation should be idempotent and not duplicate generated forms."
);

assert(html.includes("monsters: withBossForms(data.monsters || [])"), "Applied dex data should include generated boss forms.");

console.log("PVP boss form static checks passed.");
