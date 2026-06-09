const fs = require("fs");
const path = require("path");
const vm = require("vm");

const htmlFile = fs.readdirSync(path.join(__dirname, ".."))
  .filter((name) => name.endsWith(".html"))
  .sort((a, b) => a.length - b.length)[0];
const html = fs.readFileSync(path.join(__dirname, "..", htmlFile), "utf8");
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sandbox = { console, module: { exports: {} }, globalThis: {} };
sandbox.window = sandbox.globalThis;
vm.runInNewContext(scripts[2], sandbox);
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
  "PVP hero trait should match generic BWiki passive names when chain id is missing."
);

const nestedPassiveOnlyMonster = { name: "\u65e7\u7f13\u5b58\u7cbe\u7075", raw: { raw: { "\u7279\u6027": "\u56e4\u79ef" } } };
assert(
  traitRules.traitName(nestedPassiveOnlyMonster) === "\u56e4\u79ef",
  "PVP hero trait should match nested cached BWiki passive names when chain id is missing."
);

assert(
  html.includes("${traitRule ? `"),
  "PVP trait layer row should still be gated by resolved trait rules."
);

console.log("PVP hero trait display static checks passed.");
