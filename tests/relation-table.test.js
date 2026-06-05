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

const rootDir = path.join(__dirname, "..");
const htmlFile = fs.readdirSync(rootDir).find((file) => file.endsWith(".html"));
assert.ok(htmlFile, "HTML file not found");

const html = fs.readFileSync(path.join(rootDir, htmlFile), "utf8");
const relation = JSON.parse(JSON.stringify(
  vm.runInNewContext(`(${extractConstObject(html, "RELATION")})`)
));

const expectedRelation = {
  normal: { strong: [], weak: ["fighting"] },
  grass: { strong: ["water", "light", "ground"], weak: ["fire", "ice", "poison", "bug", "wing"] },
  fire: { strong: ["grass", "ice", "bug", "mechanical"], weak: ["water", "ground"] },
  water: { strong: ["fire", "ground", "mechanical"], weak: ["grass", "electric"] },
  light: { strong: ["ghost", "demon"], weak: ["grass"] },
  ground: { strong: ["fire", "ice", "electric", "poison"], weak: ["grass", "water", "fighting", "mechanical"] },
  ice: { strong: ["grass", "ground", "dragon", "wing"], weak: ["fire", "fighting", "mechanical"] },
  dragon: { strong: ["dragon"], weak: ["ice", "cute"] },
  electric: { strong: ["water", "wing"], weak: ["ground"] },
  poison: { strong: ["grass", "cute"], weak: ["ground", "demon", "fantasy"] },
  bug: { strong: ["grass", "demon", "fantasy"], weak: ["fire", "wing"] },
  fighting: { strong: ["normal", "ground", "ice", "demon", "mechanical"], weak: ["wing", "cute", "fantasy"] },
  wing: { strong: ["grass", "bug", "fighting"], weak: ["ice", "electric"] },
  cute: { strong: ["dragon", "fighting", "demon"], weak: ["poison", "mechanical"] },
  ghost: { strong: ["light", "ghost", "fantasy"], weak: ["demon"] },
  demon: { strong: ["poison", "cute", "ghost"], weak: ["light", "bug", "fighting"] },
  mechanical: { strong: ["ground", "ice", "cute"], weak: ["fire", "water", "fighting"] },
  fantasy: { strong: ["poison", "fighting"], weak: ["bug", "ghost"] }
};

assert.deepEqual(relation, expectedRelation);
assert.equal(relation.grass.strong.includes("light"), true, "grass attacks should be 2x into light defense");

console.log("relation table ok");
