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
  const REAL_BOSS_FORM_NAMES = new Set(["\\u5f69\\u8679\\u72ec\\u89d2\\u517d", "\\u98ce\\u66b4\\u6218\\u72ac"]);
  ${extractFunction("supplementalBwikiMonsterTitles")}
  this.supplementalBwikiMonsterTitles = supplementalBwikiMonsterTitles;
`, sandbox);

const monsterIndex = new Map([["\u98ce\u66b4\u6218\u72ac", { title: "\u98ce\u66b4\u6218\u72ac" }]]);
assert(
  sandbox.supplementalBwikiMonsterTitles(monsterIndex).join(">") === "\u5f69\u8679\u72ec\u89d2\u517d",
  "BWiki update should fetch known boss pages such as Rainbow Unicorn even when they are missing from the monster index."
);
assert(
  html.includes("const monsterTitles = unique([...monsterIndex.keys(), ...supplementalBwikiMonsterTitles(monsterIndex)]);"),
  "BWiki update should include supplemental boss monster titles in the base monster page fetch."
);
assert(
  html.includes("fetchBwikiRenderedMonsterProfileMap(monsterTitles, monsterRevisionByTitle)"),
  "BWiki update should render supplemental boss monster pages so icons and rendered fields are applied."
);

console.log("BWiki supplemental boss monster static checks passed.");
