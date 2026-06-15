const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const source = require(path.join(root, "data", "local-bundle.json"));
const sync = spawnSync(
  process.execPath,
  [path.join(root, "scripts", "sync-miniprogram-data.js"), "--check"],
  { cwd: root, encoding: "utf8" }
);

assert.strictEqual(
  sync.status,
  0,
  `Mini Program data check failed:\n${sync.stdout}\n${sync.stderr}`
);

const generatedPath = path.join(root, "miniprogram", "data", "local-bundle.js");
assert(fs.existsSync(generatedPath), "generated Mini Program data module is missing");
delete require.cache[require.resolve(generatedPath)];
const generated = require(generatedPath);

assert.strictEqual(generated.schemaVersion, 1);
assert.strictEqual(generated.monsters.length, source.monsters.length);
assert.strictEqual(generated.skills.length, source.skills.length);
assert.strictEqual(generated.passives.length, source.passives.length);

const skillIds = new Set(generated.skills.map((skill) => skill.id));
const passiveIds = new Set(generated.passives.map((passive) => passive.id));
for (const monster of generated.monsters) {
  for (const skillId of monster.skillIds) {
    assert(skillIds.has(skillId), `${monster.name} references missing skill ${skillId}`);
  }
  for (const passiveId of monster.passiveIds) {
    assert(passiveIds.has(passiveId), `${monster.name} references missing passive ${passiveId}`);
  }
}

const catalog = require(path.join(root, "miniprogram", "data", "catalog.js"));
assert.strictEqual(catalog.monsterById.size, generated.monsters.length);
assert.strictEqual(catalog.skillById.size, generated.skills.length);
assert.strictEqual(catalog.passiveById.size, generated.passives.length);
assert.strictEqual(catalog.monsterOptions[0].label.length > 0, true);
assert.strictEqual(catalog.getMonster("missing"), null);

console.log("miniprogram data synchronization checks passed");
