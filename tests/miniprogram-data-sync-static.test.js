const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const packageRoot = path.join(root, "lkwgwechat");
const source = require(path.join(root, "data", "local-bundle.json"));
const sync = spawnSync(
  process.execPath,
  [path.join(packageRoot, "scripts", "sync-miniprogram-data.js"), "--check"],
  { cwd: packageRoot, encoding: "utf8" }
);

assert.strictEqual(
  sync.status,
  0,
  `Mini Program data check failed:\n${sync.stdout}\n${sync.stderr}`
);

const dataDir = path.join(packageRoot, "miniprogram", "data");
const oldBundlePath = path.join(dataDir, "local-bundle.js");
assert(
  !fs.existsSync(oldBundlePath),
  "Mini Program must not keep the old monolithic local-bundle.js startup module"
);

const generatedPaths = {
  meta: path.join(dataDir, "local-meta.js"),
  monsters: path.join(dataDir, "local-monsters.js"),
  monsterSummaries: path.join(dataDir, "monster-summaries.js"),
  skills: path.join(dataDir, "local-skills.js"),
  passives: path.join(dataDir, "local-passives.js")
};
for (const [name, generatedPath] of Object.entries(generatedPaths)) {
  assert(fs.existsSync(generatedPath), `generated Mini Program ${name} module is missing`);
  delete require.cache[require.resolve(generatedPath)];
}
const generated = {
  ...require(generatedPaths.meta),
  monsters: require(generatedPaths.monsters),
  monsterSummaries: require(generatedPaths.monsterSummaries),
  skills: require(generatedPaths.skills),
  passives: require(generatedPaths.passives)
};

assert.strictEqual(generated.schemaVersion, 1);
assert.strictEqual(generated.monsters.length, source.monsters.length);
assert.strictEqual(generated.monsterSummaries.length, source.monsters.length);
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

delete require.cache[require.resolve(generatedPaths.monsters)];
const catalog = require(path.join(packageRoot, "miniprogram", "data", "catalog.js"));
assert.strictEqual(catalog.monsterOptions.length, generated.monsterSummaries.length);
assert(
  !require.cache[require.resolve(generatedPaths.monsters)],
  "catalog.monsterOptions must use lightweight summaries without loading full monster data"
);
assert.strictEqual(catalog.getMonsterSummary(generated.monsters[0].id).id, generated.monsters[0].id);
assert(
  !require.cache[require.resolve(generatedPaths.monsters)],
  "catalog.getMonsterSummary must not load full monster data"
);
assert.strictEqual(catalog.monsterById.size, generated.monsters.length);
assert.strictEqual(catalog.skillById.size, generated.skills.length);
assert.strictEqual(catalog.passiveById.size, generated.passives.length);
assert.strictEqual(catalog.getMonster("missing"), null);

console.log("miniprogram data synchronization checks passed");
