const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

const helperStart = html.indexOf("const PINYIN_MAP = {");
const helperEnd = html.indexOf("function getMonsterPassives", helperStart);
assert(helperStart >= 0 && helperEnd > helperStart, "Search helper block must be extractable.");

const sandbox = {
  dexData: {
    skills: [
      { id: "skill-火云车", name: "火云车", aliases: [] },
      { id: "skill-隐藏条款", name: "隐藏条款", aliases: [] }
    ],
    monsters: [
      { id: "monster-烈火战神", name: "烈火战神", aliases: [] },
      { id: "monster-隐藏条款", name: "隐藏条款", aliases: [] }
    ]
  }
};

vm.runInNewContext(`
  ${html.slice(helperStart, helperEnd)}
  this.normalizeSearchText = normalizeSearchText;
  this.pinyinText = pinyinText;
  this.pinyinInitials = pinyinInitials;
  this.fuzzyItemScore = fuzzyItemScore;
  this.fuzzySkillScore = fuzzySkillScore;
  this.fuzzySkillItems = fuzzySkillItems;
  this.fuzzyMonsterScore = fuzzyMonsterScore;
  this.fuzzyMonsterItems = fuzzyMonsterItems;
`, sandbox);

assert.strictEqual(sandbox.pinyinText("隐藏条款"), "yincangtiaokuan");
assert.strictEqual(sandbox.pinyinInitials("隐藏条款"), "yctk");
assert(
  sandbox.fuzzySkillScore({ name: "隐藏条款", aliases: [] }, "yctk") > 0,
  "Web skill fuzzy search must match Chinese names by pinyin initials."
);
assert.strictEqual(
  sandbox.fuzzySkillItems("yctk")[0].id,
  "skill-隐藏条款",
  "Web skill option ranking must put exact pinyin-initial matches first."
);
assert(
  sandbox.fuzzyMonsterScore({ name: "隐藏条款", aliases: [] }, "yctk") > 0,
  "Web monster fuzzy search must match Chinese names by pinyin initials."
);
assert.strictEqual(
  sandbox.fuzzyMonsterItems("yctk")[0].id,
  "monster-隐藏条款",
  "Web monster option ranking must put exact pinyin-initial matches first."
);
assert(
  sandbox.fuzzyItemScore({ name: "隐藏条款", aliases: [] }, "yctk") > 0,
  "Generic web combo filtering must match Chinese option names by pinyin initials."
);

const renderComboStart = html.indexOf("function renderComboOptions");
const renderComboEnd = html.indexOf("function itemMeta", renderComboStart);
assert(renderComboStart >= 0 && renderComboEnd > renderComboStart, "Combo renderer must be extractable.");
const renderComboSource = html.slice(renderComboStart, renderComboEnd);
assert(
  renderComboSource.includes("fuzzyItemScore(item, q) > 0"),
  "Generic combo filtering must use the shared pinyin-initial fuzzy score."
);

console.log("web pinyin-initial search static checks passed");
