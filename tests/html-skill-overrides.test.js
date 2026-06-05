const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function extractConstObject(source, name) {
  const marker = `const ${name} = `;
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, `${name} not found`);

  const objectStart = source.indexOf("{", markerIndex);
  assert.notEqual(objectStart, -1, `${name} object start not found`);

  let depth = 0;
  let quote = "";
  let escaped = false;

  for (let i = objectStart; i < source.length; i += 1) {
    const char = source[i];

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
      if (depth === 0) {
        return source.slice(objectStart, i + 1);
      }
    }
  }

  throw new Error(`${name} object end not found`);
}

const htmlPath = path.join(__dirname, "..", "克制面查询.html");
const html = fs.readFileSync(htmlPath, "utf8");
const overrides = vm.runInNewContext(
  `(${extractConstObject(html, "S2_SKILL_OVERRIDES")})`
);

const lightGather = overrides["光能聚集"];
assert.ok(lightGather, "光能聚集 should have a local S2 skill override");
assert.equal(lightGather.type, "grass");
assert.equal(lightGather.category, "special");
assert.equal(lightGather.power, 100);
assert.match(lightGather.description, /其他草系技能/);

console.log("html skill overrides ok");
