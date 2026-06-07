const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function extractConstObject(source, name) {
  const marker = `const ${name} = `;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${name} not found`);
  const objectStart = source.indexOf("{", start);
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = objectStart; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }
    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(objectStart, index + 1);
    }
  }
  throw new Error(`${name} object end not found`);
}

const html = fs.readFileSync(path.join(__dirname, "..", "克制面查询.html"), "utf8");
const overrides = vm.runInNewContext(`(${extractConstObject(html, "LATEST_MONSTER_STAT_OVERRIDES")})`);

assert.equal(overrides["皇家狮鹫（崖间地的样子）"].hp, 107);
assert.equal(overrides["皇家狮鹫（高山地的样子）"].atk, 123);
assert.equal(overrides["锤头鹑"].defense, 101);
assert.equal(overrides["龙鱼"].spe, 135);
assert.equal(overrides["黑猫密探"].spd, 129);

assert.match(html, /applyLatestMonsterStatOverrides\(nextData\)/);

console.log("latest monster stat overrides ok");
