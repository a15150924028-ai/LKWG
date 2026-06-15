const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const packageRoot = path.join(root, "lkwgwechat");
const sync = spawnSync(
  process.execPath,
  [path.join(packageRoot, "scripts", "sync-miniprogram-pvp-rules.js"), "--check"],
  { cwd: packageRoot, encoding: "utf8" }
);
assert.strictEqual(
  sync.status,
  0,
  `Mini Program PVP rule check failed:\n${sync.stdout}\n${sync.stderr}`
);

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1]);

function webModule(marker) {
  const source = scripts.find((script) => script.includes(marker));
  assert(source, `missing web module ${marker}`);
  const sandbox = { module: { exports: {} } };
  vm.runInNewContext(source, sandbox);
  return sandbox.module.exports;
}

const webBuild = webModule("LKWG_PVP_BUILD_RULES");
const webDamage = webModule("LKWG_PVP_DAMAGE_CORE");
const webWeather = webModule("LKWG_PVP_WEATHER_RULES");
const webTurn = webModule("LKWG_PVP_TURN_RULES");

const miniBuild = require(path.join(packageRoot, "miniprogram", "domain", "pvp-build.js"));
const miniDamage = require(path.join(packageRoot, "miniprogram", "domain", "pvp-damage.js"));
const miniTurn = require(path.join(packageRoot, "miniprogram", "domain", "pvp-turn.js"));
const miniEffects = require(path.join(packageRoot, "miniprogram", "domain", "pvp-effects.js"));
const pvpState = require(path.join(packageRoot, "miniprogram", "domain", "pvp-state.js"));

const physical = { stats: { atk: 120, spa: 90 } };
assert.strictEqual(
  JSON.stringify(miniBuild.resolveDefaultBuild("fast", physical)),
  JSON.stringify(webBuild.resolveDefaultBuild("fast", physical))
);

const damageInput = {
  attack: 146,
  defense: 178,
  skillPower: 110,
  stabMultiplier: 1.25,
  hitCount: 3
};
assert.strictEqual(
  JSON.stringify(miniDamage.damageCore.calculateDamage(damageInput)),
  JSON.stringify(webDamage.calculateDamage(damageInput))
);
assert.strictEqual(
  miniTurn.weather.weatherPowerMultiplier("rain", { type: "water" }),
  webWeather.weatherPowerMultiplier("rain", { type: "water" })
);

const attack = { name: "攻击", category: "special" };
const orderInput = {
  allyAction: attack,
  enemyAction: attack,
  allySpeed: 200,
  enemySpeed: 200,
  random: () => 0.25
};
assert.strictEqual(
  JSON.stringify(miniTurn.turn.resolveTurnOrder(orderInput)),
  JSON.stringify(webTurn.resolveTurnOrder(orderInput))
);

for (const key of [
  "trait", "effects"
]) {
  assert(miniEffects[key] && typeof miniEffects[key] === "object");
}
for (const key of [
  "energy", "cooldown", "hp", "cleanup", "history"
]) {
  assert(miniTurn[key] && typeof miniTurn[key] === "object");
}

const normalized = pvpState.normalizePvpState({
  weather: "invalid",
  ally: { energy: 99, talentIds: ["talent-hp"] },
  enemy: { defaultBuildPreset: "fast", energy: -3 }
});
assert.strictEqual(normalized.weather, "");
assert.strictEqual(normalized.ally.energy, 10);
assert.strictEqual(normalized.enemy.energy, 0);
assert.deepStrictEqual(normalized.ally.talentIds, ["talent-hp", "", ""]);
assert.strictEqual(normalized.enemy.defaultBuildPreset, "fast");

console.log("miniprogram PVP domain parity checks passed");
