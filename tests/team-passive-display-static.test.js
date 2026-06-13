const fs = require("fs");
const path = require("path");
const vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  !/\.passive-line\s+\.readonly-desc\s*\{[^}]*display\s*:\s*none/i.test(html),
  "Team passive descriptions must not be hidden by CSS."
);

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

const sandbox = {
  window: {
    LKWG_PVP_TRAIT_RULES: {
      traitName(monster) {
        return monster?.name === "\u8e66\u5e8a\u677e\u9f20" ? "\u56e4\u79ef" : "";
      }
    }
  },
  passiveById: new Map([
    ["passive-a", { id: "passive-a", name: "\u6d4b\u8bd5\u7279\u6027", description: "\u6d4b\u8bd5\u63cf\u8ff0" }]
  ]),
  escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }
};

vm.createContext(sandbox);
vm.runInContext(`
  ${extractFunction("getMonsterPassives")}
  ${extractFunction("passiveDescription")}
  ${extractFunction("renderMonsterPassiveSummary")}
  this.renderMonsterPassiveSummary = renderMonsterPassiveSummary;
`, sandbox);

const selectedWithoutPassiveIds = sandbox.renderMonsterPassiveSummary({ name: "\u963f\u7c73\u4e9a\u7279", passiveIds: [] });
assert(
  selectedWithoutPassiveIds.includes("\u6682\u65e0\u7279\u6027\u6570\u636e"),
  "Selected monsters without passiveIds should display missing trait data, not unselected monster."
);
assert(
  !selectedWithoutPassiveIds.includes("\u672a\u9009\u62e9\u7cbe\u7075"),
  "Selected monsters without passiveIds must not display 未选择精灵 in the trait row."
);

const ruleTraitFallback = sandbox.renderMonsterPassiveSummary({ name: "\u8e66\u5e8a\u677e\u9f20", passiveIds: [] });
assert(
  ruleTraitFallback.includes("\u56e4\u79ef"),
  "Known PVP trait rules should fill the trait display when passiveIds are missing."
);

const formalPassive = sandbox.renderMonsterPassiveSummary({ name: "\u5df2\u6709\u7279\u6027", passiveIds: ["passive-a"] });
assert(
  formalPassive.includes("\u6d4b\u8bd5\u7279\u6027") && formalPassive.includes("\u6d4b\u8bd5\u63cf\u8ff0"),
  "Formal passiveIds should still render passive names and descriptions."
);

const noMonster = sandbox.renderMonsterPassiveSummary(null);
assert(
  noMonster.includes("\u672a\u9009\u62e9\u7cbe\u7075"),
  "Only empty monster slots should display 未选择精灵 in the trait row."
);

console.log("Team passive display static checks passed.");
