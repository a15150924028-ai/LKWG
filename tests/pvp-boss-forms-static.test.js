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
  ${extractFunction("bossFormDisplayName")}
  ${extractFunction("bossFormSourceMonster")}
  ${extractFunction("createGeneratedBossForm")}
  ${extractFunction("withBossForms")}
  this.withBossForms = withBossForms;
  this.isBossVariant = isBossVariant;
  this.isGeneratedBossForm = isGeneratedBossForm;
`, sandbox);

const monsters = [
  { id: "dimo", name: "\u8fea\u83ab", aliases: [], icon: "dimo.png", types: ["light"], skillIds: ["s1"], raw: { chainId: "chain-dimo", evolutionStage: 1, stats: { hp: 100 } } },
  { id: "guard", name: "\u62a4\u4e3b\u72ac", aliases: [], icon: "guard.png", types: ["normal"], skillIds: ["s2"], raw: { chainId: "chain-dog", evolutionStage: 1 } },
  { id: "sonic", name: "\u97f3\u901f\u72ac", aliases: [], icon: "sonic.png", types: ["normal"], skillIds: ["s3"], raw: { chainId: "chain-dog", evolutionStage: 2 } },
  { id: "storm", name: "\u98ce\u66b4\u6218\u72ac", aliases: [], icon: "storm.png", types: ["normal"], skillIds: ["s4"], raw: { chainId: "chain-dog", evolutionStage: 3 } }
];

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

const generatedAgain = sandbox.withBossForms(withBoss);
assert(
  generatedAgain.filter((monster) => monster.name === "\u98ce\u66b4\u6218\u72ac\uff08\u9996\u9886\uff09").length === 1,
  "Boss form generation should be idempotent and not duplicate generated forms."
);

assert(html.includes("monsters: withBossForms(data.monsters || [])"), "Applied dex data should include generated boss forms.");

console.log("PVP boss form static checks passed.");
