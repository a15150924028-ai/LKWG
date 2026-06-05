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
  normal: { strong: [], weak: ["ground", "ghost", "mechanical"] },
  grass: { strong: ["water", "light", "ground"], weak: ["fire", "dragon", "poison", "bug", "wing", "mechanical"] },
  fire: { strong: ["grass", "ice", "bug", "mechanical"], weak: ["water", "ground", "dragon"] },
  water: { strong: ["fire", "ground", "mechanical"], weak: ["grass", "ice", "dragon"] },
  light: { strong: ["ghost", "demon"], weak: ["grass", "ice"] },
  ground: { strong: ["fire", "ice", "electric", "poison"], weak: ["grass", "fighting"] },
  ice: { strong: ["grass", "ground", "dragon", "wing"], weak: ["fire", "ice", "mechanical"] },
  dragon: { strong: ["dragon"], weak: ["mechanical"] },
  electric: { strong: ["water", "wing"], weak: ["grass", "ground", "dragon", "electric"] },
  poison: { strong: ["grass", "cute"], weak: ["ground", "poison", "ghost", "mechanical"] },
  bug: { strong: ["grass", "demon", "fantasy"], weak: ["fire", "poison", "fighting", "wing", "cute", "ghost", "mechanical"] },
  fighting: { strong: ["normal", "ground", "ice", "demon", "mechanical"], weak: ["poison", "bug", "wing", "cute", "ghost", "fantasy"] },
  wing: { strong: ["grass", "bug", "fighting"], weak: ["ground", "dragon", "electric", "mechanical"] },
  cute: { strong: ["dragon", "fighting", "demon"], weak: ["fire", "poison", "mechanical"] },
  ghost: { strong: ["light", "ghost", "fantasy"], weak: ["normal", "demon"] },
  demon: { strong: ["poison", "cute", "ghost"], weak: ["light", "fighting", "demon"] },
  mechanical: { strong: ["ground", "ice", "cute"], weak: ["fire", "water", "electric", "mechanical"] },
  fantasy: { strong: ["poison", "fighting"], weak: ["light", "mechanical", "fantasy"] }
};

assert.deepEqual(relation, expectedRelation);
assert.equal(relation.grass.strong.includes("light"), true, "grass attacks should be 2x into light defense");
assert.equal(relation.electric.weak.includes("grass"), true, "electric attacks should be 0.5x into grass defense");
assert.equal(relation.mechanical.weak.includes("electric"), true, "mechanical attacks should be 0.5x into electric defense");

function multiplier(attacker, defender) {
  const attackRelation = relation[attacker] || { strong: [], weak: [] };
  if (attackRelation.strong.includes(defender)) return 2;
  if (attackRelation.weak.includes(defender)) return 0.5;
  return 1;
}

assert.equal(multiplier("electric", "grass"), 0.5, "electric into grass follows electric's resisted targets");
assert.equal(multiplier("grass", "electric"), 1, "grass into electric must not be inferred from electric into grass");
assert.equal(multiplier("electric", "water"), 2, "electric into water follows electric's strong targets");
assert.equal(multiplier("water", "electric"), 1, "water into electric must not be inferred from electric into water");

console.log("relation table ok");
