const fs = require("fs");
const path = require("path");
const vm = require("vm");

const htmlFile = fs.readdirSync(path.join(__dirname, ".."))
  .filter((name) => name.endsWith(".html"))
  .sort((a, b) => a.length - b.length)[0];
const html = fs.readFileSync(path.join(__dirname, "..", htmlFile), "utf8");

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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sandbox = {};
vm.runInNewContext(`
  const window = {
    LKWG_PVP_TRAIT_RULES: {
      RULES: [
        { chainIds: ["chain-speeddog"], names: ["\\u62a4\\u4e3b\\u72ac", "\\u97f3\\u901f\\u72ac"] },
        { chainIds: ["chain-speeddog"], names: ["\\u98ce\\u66b4\\u6218\\u72ac"] }
      ],
      resolveTraitRule(monster) {
        const name = monster?.name || "";
        return this.RULES.find((rule) => (rule.names || []).includes(name)) || null;
      }
    }
  };
  const dexData = {
    monsters: [
      { id: "guard-dog", name: "\u62a4\u4e3b\u72ac", aliases: [], raw: { chainId: "dog", evolutionStage: 1 } },
      { id: "sonic-dog", name: "\u97f3\u901f\u72ac", aliases: [], raw: { chainId: "dog", evolutionStage: 2 } },
      { id: "storm-dog", name: "\u98ce\u66b4\u6218\u72ac", aliases: [], raw: { chainId: "dog", evolutionStage: 3 } },
      { id: "legacy-guard-dog", name: "\u62a4\u4e3b\u72ac", aliases: [], raw: {} },
      { id: "legacy-sonic-dog", name: "\u97f3\u901f\u72ac", aliases: [], raw: {} },
      { id: "legacy-storm-dog", name: "\u98ce\u66b4\u6218\u72ac", aliases: [], raw: {} },
      { id: "dimo", name: "\u8fea\u83ab", aliases: [], raw: { chainId: "dimo", evolutionStage: 1 } }
    ]
  };
  let monsterById = new Map(dexData.monsters.map((monster) => [monster.id, monster]));
  function isBossVariant() { return false; }
  function isGeneratedBossForm() { return false; }
  function monsterStatTotal() { return 0; }
  function monsterNoValue(monster) { return Number(monster?.raw?.evolutionStage) || 0; }
  const unique = (values) => [...new Set(values.filter(Boolean))];
  ${extractFunction("evolutionGroupKey")}
  ${extractFunction("evolutionStageValue")}
  ${extractFunction("hasStructuredEvolutionInfo")}
  ${extractFunction("compactMonsterName")}
  ${extractFunction("pvpMonsterNameKeys")}
  ${extractFunction("pvpTraitFallbackEvolutionNames")}
  ${extractFunction("pvpMonsterByFallbackEvolutionName")}
  ${extractFunction("pvpTraitFallbackEvolutionLine")}
  ${extractFunction("pvpEvolutionLine")}
  ${extractFunction("pvpCuteAdjacentMonster")}
  ${extractFunction("canGainPvpCuteLayer")}
  ${extractFunction("normalizePvpCuteLayers")}
  ${extractFunction("applyPvpCuteLayerDelta")}
  this.dexData = dexData;
  this.monsterById = monsterById;
  this.pvpEvolutionLine = pvpEvolutionLine;
  this.pvpCuteAdjacentMonster = pvpCuteAdjacentMonster;
  this.canGainPvpCuteLayer = canGainPvpCuteLayer;
  this.normalizePvpCuteLayers = normalizePvpCuteLayers;
  this.applyPvpCuteLayerDelta = applyPvpCuteLayerDelta;
`, sandbox);

const stormDog = sandbox.monsterById.get("storm-dog");
const sonicDog = sandbox.monsterById.get("sonic-dog");
const guardDog = sandbox.monsterById.get("guard-dog");
const dimo = sandbox.monsterById.get("dimo");

assert(
  sandbox.pvpEvolutionLine(stormDog).map((monster) => monster.name).join(">") === "\u62a4\u4e3b\u72ac>\u97f3\u901f\u72ac>\u98ce\u66b4\u6218\u72ac",
  "PVP evolution line should sort forms from lowest to highest stage."
);
assert(sandbox.pvpCuteAdjacentMonster(stormDog, 1)?.id === "sonic-dog", "Cute +1 should move one form downward.");
assert(sandbox.pvpCuteAdjacentMonster(sonicDog, 1)?.id === "guard-dog", "Cute +1 should keep moving downward until the lowest form.");
assert(!sandbox.pvpCuteAdjacentMonster(guardDog, 1), "The lowest form should not gain another cute layer.");
assert(sandbox.pvpCuteAdjacentMonster(sonicDog, -1)?.id === "storm-dog", "Cute -1 should move one form upward.");
assert(!sandbox.canGainPvpCuteLayer(dimo), "A single-form lowest-stage monster should not gain cute +1.");
assert(sandbox.normalizePvpCuteLayers(-3) === 0, "Cute layers should never become negative.");

const legacySonicDog = sandbox.monsterById.get("legacy-sonic-dog");
assert(
  sandbox.pvpEvolutionLine(legacySonicDog).map((monster) => monster.name).join(">") === "\u62a4\u4e3b\u72ac>\u97f3\u901f\u72ac>\u98ce\u66b4\u6218\u72ac",
  "PVP evolution line should fall back to trait-rule family names when cached data has no chain fields."
);
assert(
  sandbox.pvpCuteAdjacentMonster(legacySonicDog, 1)?.id === "legacy-guard-dog",
  "Cached Sonic Dog without chain fields should still gain cute +1 into Guard Dog."
);

const state = { monsterId: "storm-dog", cuteLayers: 0, natureId: "nature", talentIds: ["a", "b", "c"], skillIds: ["s1", "s2", "", ""] };
assert(sandbox.applyPvpCuteLayerDelta(state, 1), "Applying cute +1 should succeed when a lower form exists.");
assert(state.monsterId === "sonic-dog", "Applying cute +1 should replace the selected monster with the lower form.");
assert(state.cuteLayers === 1, "Applying cute +1 should increment the stored layer count.");
assert(state.natureId === "nature" && state.skillIds[0] === "s1", "Cute form changes should preserve build state.");
assert(sandbox.applyPvpCuteLayerDelta(state, -1), "Applying cute -1 should succeed when an upper form exists.");
assert(state.monsterId === "storm-dog", "Applying cute -1 should replace the selected monster with the upper form.");
assert(state.cuteLayers === 0, "Applying cute -1 should decrement the stored layer count.");

assert(html.includes('data-pvp-buff-stat="cuteLayer"'), "PVP buff UI should render cute controls inside the buff grid.");
assert(html.includes("data-pvp-cute-layer="), "PVP buff UI should expose cute layer controls.");
assert(html.includes("state.cuteLayers"), "PVP state should persist cute layers.");

console.log("PVP cute layer static checks passed.");
