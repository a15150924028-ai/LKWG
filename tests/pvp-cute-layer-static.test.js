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
      { id: "storm-dog-boss", name: "\u98ce\u66b4\u6218\u72ac\uff08\u9996\u9886\uff09", aliases: ["\u98ce\u66b4\u6218\u72ac"], raw: { isGeneratedBossForm: true, baseMonsterId: "storm-dog", chainId: "dog-boss", evolutionStage: 3 } },
      { id: "cheer-anemone", name: "\u52a0\u6cb9\u6d77\u8475", aliases: [], raw: { evolutionLine: ["\u52a0\u6cb9\u6d77\u8475", "\u52a0\u6cb9\u87f9"] } },
      { id: "cheer-crab", name: "\u52a0\u6cb9\u87f9", aliases: [], raw: { evolutionLine: ["\u52a0\u6cb9\u6d77\u8475", "\u52a0\u6cb9\u87f9"] } },
      { id: "dimo", name: "\u8fea\u83ab", aliases: [], raw: { chainId: "dimo", evolutionStage: 1 } },
      { id: "chrysanthemum-pear", name: "\u83ca\u82b1\u68a8", aliases: ["\u83ca\u82b1\u91cc"], raw: {} }
    ]
  };
  let monsterById = new Map(dexData.monsters.map((monster) => [monster.id, monster]));
  const BOSS_FORM_SUFFIX = "__boss_form";
  const REAL_BOSS_FORM_NAMES = new Set(["\\u98ce\\u66b4\\u6218\\u72ac"]);
  ${extractFunction("isBossVariant")}
  ${extractFunction("isGeneratedBossForm")}
  function monsterStatTotal() { return 0; }
  function monsterNoValue(monster) { return Number(monster?.raw?.evolutionStage) || 0; }
  const unique = (values) => [...new Set(values.filter(Boolean))];
  function blankStatMods() {
    return { hp: 0, atk: 0, defense: 0, spa: 0, spd: 0, spe: 0 };
  }
  function normalizeStatMods(mods = {}) {
    const next = blankStatMods();
    Object.keys(next).forEach((key) => { next[key] = Number(mods?.[key]) || 0; });
    return next;
  }
  function mergeStatMods(...modsList) {
    const next = blankStatMods();
    modsList.forEach((mods) => {
      const normalized = normalizeStatMods(mods);
      Object.keys(next).forEach((key) => { next[key] += normalized[key]; });
    });
    return next;
  }
  ${extractFunction("evolutionGroupKey")}
  ${extractFunction("evolutionStageValue")}
  ${extractFunction("hasStructuredEvolutionInfo")}
  ${extractFunction("pvpEvolutionSourceMonster")}
  ${extractFunction("compactMonsterName")}
  ${extractFunction("pvpMonsterNameKeys")}
  ${extractFunction("rawEvolutionLineNames")}
  ${extractFunction("pvpRawEvolutionLine")}
  ${extractFunction("pvpTraitFallbackEvolutionNames")}
  ${extractFunction("pvpMonsterByFallbackEvolutionName")}
  ${extractFunction("pvpTraitFallbackEvolutionLine")}
  ${extractFunction("pvpEvolutionLine")}
  ${extractFunction("canGainInfinitePvpCuteLayer")}
  ${extractFunction("pvpCuteAdjacentMonster")}
  ${extractFunction("canGainPvpCuteLayer")}
  ${extractFunction("normalizePvpCuteLayers")}
  ${extractFunction("applyPvpCuteLayerDelta")}
  ${extractFunction("pvpActionSnapshotMatchesCurrentMonster")}
  ${extractFunction("pvpPostUseEffects")}
  ${extractFunction("applyPvpPostUseSkillEffects")}
  window.LKWG_PVP_DAMAGE_RULES = {
    resolvePvpPostUseEffects(skill, context) {
      if (!/\\u840c\\u5316\\+1/.test(skill?.description || "") || !context.canGainCuteLayer) return { requiresSuccessfulCuteLayer: true };
      return {
        cuteLayerDelta: 1,
        statFlatMods: { spe: 150 },
        labels: ["\\u83b7\\u5f97\\u840c\\u5316+1", "\\u901f\\u5ea6+150"],
        requiresSuccessfulCuteLayer: true
      };
    }
  };
  this.dexData = dexData;
  this.monsterById = monsterById;
  this.pvpEvolutionLine = pvpEvolutionLine;
  this.pvpCuteAdjacentMonster = pvpCuteAdjacentMonster;
  this.canGainPvpCuteLayer = canGainPvpCuteLayer;
  this.normalizePvpCuteLayers = normalizePvpCuteLayers;
  this.applyPvpCuteLayerDelta = applyPvpCuteLayerDelta;
  this.applyPvpPostUseSkillEffects = applyPvpPostUseSkillEffects;
`, sandbox);

const stormDog = sandbox.monsterById.get("storm-dog");
const sonicDog = sandbox.monsterById.get("sonic-dog");
const guardDog = sandbox.monsterById.get("guard-dog");
const stormDogBoss = sandbox.monsterById.get("storm-dog-boss");
const dimo = sandbox.monsterById.get("dimo");
const chrysanthemumPear = sandbox.monsterById.get("chrysanthemum-pear");

assert(
  sandbox.pvpEvolutionLine(stormDog).map((monster) => monster.name).join(">") === "\u62a4\u4e3b\u72ac>\u97f3\u901f\u72ac>\u98ce\u66b4\u6218\u72ac",
  "PVP evolution line should sort forms from lowest to highest stage."
);
assert(sandbox.pvpCuteAdjacentMonster(stormDog, 1)?.id === "sonic-dog", "Cute +1 should move one form downward.");
assert(sandbox.pvpCuteAdjacentMonster(stormDogBoss, 1)?.id === "sonic-dog", "Manual cute +1 should work when the selected high form is a generated boss form.");
assert(sandbox.pvpCuteAdjacentMonster(sonicDog, 1)?.id === "guard-dog", "Cute +1 should keep moving downward until the lowest form.");
assert(!sandbox.pvpCuteAdjacentMonster(guardDog, 1), "The lowest form should not gain another cute layer.");
assert(sandbox.pvpCuteAdjacentMonster(sonicDog, -1)?.id === "storm-dog", "Cute -1 should move one form upward.");
assert(!sandbox.canGainPvpCuteLayer(dimo), "A single-form lowest-stage monster should not gain cute +1.");
assert(sandbox.canGainPvpCuteLayer(chrysanthemumPear), "Chrysanthemum Pear should be the special case that can gain cute +1 without a lower form.");
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

const cheerCrab = sandbox.monsterById.get("cheer-crab");
assert(
  sandbox.pvpEvolutionLine(cheerCrab).map((monster) => monster.name).join(">") === "\u52a0\u6cb9\u6d77\u8475>\u52a0\u6cb9\u87f9",
  "PVP evolution line should use raw rendered evolution names when no structured chain fields or trait-rule fallback exists."
);
assert(
  sandbox.pvpCuteAdjacentMonster(cheerCrab, 1)?.id === "cheer-anemone",
  "Cheer Crab should gain cute +1 into Cheer Anemone from raw evolution-line data."
);

const state = { monsterId: "storm-dog", cuteLayers: 0, natureId: "nature", talentIds: ["a", "b", "c"], skillIds: ["s1", "s2", "", ""] };
assert(sandbox.applyPvpCuteLayerDelta(state, 1), "Applying cute +1 should succeed when a lower form exists.");
assert(state.monsterId === "sonic-dog", "Applying cute +1 should replace the selected monster with the lower form.");
assert(state.cuteLayers === 1, "Applying cute +1 should increment the stored layer count.");
assert(state.natureId === "nature" && state.skillIds[0] === "s1", "Cute form changes should preserve build state.");
assert(sandbox.applyPvpCuteLayerDelta(state, -1), "Applying cute -1 should succeed when an upper form exists.");
assert(state.monsterId === "storm-dog", "Applying cute -1 should replace the selected monster with the upper form.");
assert(state.cuteLayers === 0, "Applying cute -1 should decrement the stored layer count.");

const weakStatusSkill = { name: "\u793a\u5f31", category: "status", description: "\u83b7\u5f97\u840c\u5316+1\uff0c\u82e5\u6210\u529f\u83b7\u5f97\u840c\u5316\uff0c\u901f\u5ea6+150\u3002" };
const cheerState = { monsterId: "cheer-crab", cuteLayers: 0, skillFlatStatMods: {} };
assert(
  sandbox.applyPvpPostUseSkillEffects(cheerState, weakStatusSkill),
  "Status skills that grant cute +1 should run through the PVP post-use cute effect path."
);
assert(cheerState.monsterId === "cheer-anemone", "Successful cute status skills should switch high forms to the lower form.");
assert(cheerState.cuteLayers === 1, "Successful cute status skills should increase cute layers.");
assert(cheerState.skillFlatStatMods.spe === 150, "Successful cute status skills should apply their flat speed bonus.");

const chrysanthemumState = { monsterId: "chrysanthemum-pear", cuteLayers: 3, skillFlatStatMods: {} };
assert(sandbox.applyPvpCuteLayerDelta(chrysanthemumState, 1), "Chrysanthemum Pear should gain cute +1 even without a lower form.");
assert(chrysanthemumState.monsterId === "chrysanthemum-pear", "Infinite cute +1 should not switch to a missing lower form.");
assert(chrysanthemumState.cuteLayers === 4, "Infinite cute +1 should still increment cute layers.");

const actedState = {
  monsterId: "sonic-dog",
  cuteLayers: 0,
  action: "skill:0",
  actionMonsterId: "sonic-dog",
  actionCuteLayers: 0,
  forceImpact: false
};
assert(sandbox.applyPvpCuteLayerDelta(actedState, 1), "Post-use cute +1 should switch Sonic Dog into Guard Dog.");
assert(actedState.monsterId === "guard-dog", "Post-use cute +1 should leave the panel on the lower form.");
assert(actedState.action === "", "Cute form changes should clear the selected action instead of reusing a stale pre-use skill.");
assert(actedState.actionMonsterId === "", "Cute form changes should clear the pre-use action monster snapshot.");
assert(actedState.actionCuteLayers === 0, "Cute form changes should clear the pre-use cute-layer snapshot.");

assert(html.includes('data-pvp-buff-stat="cuteLayer"'), "PVP buff UI should render cute controls inside the buff grid.");
assert(html.includes("data-pvp-cute-layer="), "PVP buff UI should expose cute layer controls.");
assert(html.includes("state.cuteLayers"), "PVP state should persist cute layers.");
assert(html.includes("skillFlatStatMods"), "PVP state should persist flat post-use stat bonuses such as speed +150.");
assert(
  html.includes("const skillFlatMods = normalizeStatMods(state?.skillFlatStatMods);"),
  "PVP final stats should include flat post-use stat bonuses."
);

console.log("PVP cute layer static checks passed.");
