const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const htmlPath = path.join(__dirname, "..", "克制面查询.html");
const html = fs.readFileSync(htmlPath, "utf8");

function extractFunction(source, name) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${name} not found`);

  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  let quote = "";
  let escaped = false;

  for (let index = bodyStart; index < source.length; index += 1) {
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
      if (depth === 0) return source.slice(start, index + 1);
    }
  }

  throw new Error(`${name} body end not found`);
}

const dataScript = html.indexOf('<script src="./lcx_skill_pools.js"></script>');
const damageScript = html.indexOf('<script src="./pvp_damage_rules.js"></script>');
const traitScript = html.indexOf('<script src="./pvp_trait_rules.js"></script>');
const inlineScript = html.indexOf("<script>", damageScript);
assert.ok(dataScript >= 0 && damageScript > dataScript, "existing rules scripts should load in order");
assert.ok(traitScript > damageScript, "trait rules should load after existing data/rules scripts");
assert.ok(inlineScript > traitScript, "trait rules should load before the inline app script");

const initialState = html.slice(
  html.indexOf("const pvpSimState ="),
  html.indexOf("let dexData")
);
assert.equal(
  (initialState.match(/traitLayers:\s*0/g) || []).length,
  2,
  "ally and enemy state should both start with zero trait layers"
);

const sideState = extractFunction(html, "pvpSideState");
assert.match(
  sideState,
  /LKWG_PVP_TRAIT_RULES\.normalizeTraitLayers\(state\.traitLayers\)/,
  "side state should normalize trait layers through the rules module"
);

const clearState = extractFunction(html, "clearPvpSideState");
assert.match(clearState, /state\.traitLayers\s*=\s*0/, "clearing a side should clear trait layers");

const resetLayers = extractFunction(html, "resetPvpTraitLayers");
assert.match(
  resetLayers,
  /state\.traitLayers\s*=\s*window\.LKWG_PVP_TRAIT_RULES\.defaultTraitLayers\(monster\)/,
  "monster reset should use the registered default layer count"
);
assert.equal(
  (html.match(/resetPvpTraitLayers\(/g) || []).length,
  2,
  "trait layers should only be reset by the helper definition and monster-selection path"
);

const hydration = extractFunction(html, "hydratePvpDamageSimulation");
assert.match(
  hydration,
  /const monsterChanged\s*=\s*state\.monsterId\s*!==\s*item\.id/,
  "monster selection should detect actual monster changes"
);
assert.match(
  hydration,
  /if\s*\(monsterChanged\)\s*resetPvpTraitLayers\(state,\s*item\)/,
  "monster selection, including team auto-fill, should reset trait layers"
);

const passiveStats = extractFunction(html, "passiveStatMods");
assert.equal(
  (passiveStats.match(/resolveTraitEffects\(/g) || []).length,
  1,
  "passive stat calculation should resolve trait effects exactly once"
);
assert.match(passiveStats, /mergeStatMods\(mods,\s*traitEffects\.statMods\)/);
assert.match(
  passiveStats,
  /const isResolvedTraitPassive[\s\S]*!isResolvedTraitPassive && passiveStatBoostIsCurrent/,
  "the resolved cumulative trait should not also flow through the generic passive stat parser"
);
assert.match(
  passiveStats,
  /traitEffects\.rule\?\.traitName\s*!==\s*"专注力"[\s\S]*?\/专注力\//,
  "registered 专注力 should bypass the legacy automatic boost"
);
assert.match(
  passiveStats,
  /traitEffects\.rule\?\.traitName\s*!==\s*"囤积"[\s\S]*?\/囤积\//,
  "registered 囤积 should bypass the legacy energy-derived boost"
);

const damage = extractFunction(html, "calcPvpDamage");
assert.equal(
  (damage.match(/resolveTraitEffects\(/g) || []).length,
  1,
  "damage calculation should resolve action trait effects exactly once"
);
assert.ok(
  damage.indexOf("resolveTraitEffects(") < damage.indexOf("resolvePvpVariableDamage("),
  "trait effects should resolve before variable damage"
);
assert.match(
  damage,
  /Math\.max\(0,\s*currentSkillCost\s*-\s*traitEffects\.skillCostReduction\)/,
  "trait-adjusted skill cost should have a zero floor"
);
assert.match(damage, /attackerEnergy:\s*traitAdjustedEnergy/);
assert.match(damage, /currentSkillCost:\s*traitAdjustedSkillCost/);
assert.match(
  damage,
  /const traitAdjustedPower[\s\S]*traitEffects\.flatPower[\s\S]*traitEffects\.powerMultiplier/
);
assert.match(damage, /const variablePower\s*=\s*traitAdjustedPower\(variableDamage\.power\)/);
assert.match(damage, /hitCount[\s\S]*traitEffects\.hitCountAdd/);

assert.doesNotMatch(
  html,
  /addDamageLabel\([^)]*traitEffects|variableDamageLabels[^;]*traitEffects|traitEffects\.traitName/,
  "trait-layer effects should not add visible damage labels"
);

const inlineMatch = html.match(
  /<script src="\.\/pvp_trait_rules\.js"><\/script>\s*<script>([\s\S]*?)<\/script>\s*<\/body>/
);
assert.ok(inlineMatch, "inline app script should follow the trait rules module");
assert.doesNotThrow(() => new Function(inlineMatch[1]), "inline app script should compile");

console.log("html pvp trait layer integration ok");
