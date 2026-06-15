// Generated from index.html module LKWG_PVP_BUILD_RULES. Do not edit directly.
(function initPvpBuildRules(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.LKWG_PVP_BUILD_RULES = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function buildPvpBuildRules() {
  const DEFAULT_PRESET = "durable";
  const PRESETS = [
    { id: "durable", label: "最肉" },
    { id: "fast", label: "最速" },
    { id: "attack", label: "最高攻击" }
  ];
  const PRESET_IDS = new Set(PRESETS.map((preset) => preset.id));

  function normalizePreset(presetId) {
    return PRESET_IDS.has(presetId) ? presetId : DEFAULT_PRESET;
  }

  function resolveDefaultBuild(presetId, monster) {
    const normalizedPreset = normalizePreset(presetId);
    const physicalAttack = Number(monster?.stats?.atk ?? monster?.raw?.stats?.atk) || 0;
    const specialAttack = Number(monster?.stats?.spa ?? monster?.raw?.stats?.spa) || 0;
    const usesPhysicalBranch = physicalAttack >= specialAttack;
    if (normalizedPreset === "fast") {
      return {
        presetId: normalizedPreset,
        natureId: usesPhysicalBranch ? "nature-jolly" : "nature-timid",
        talentIds: ["talent-hp", usesPhysicalBranch ? "talent-atk" : "talent-spa", "talent-spe"]
      };
    }
    if (normalizedPreset === "attack") {
      return {
        presetId: normalizedPreset,
        natureId: usesPhysicalBranch ? "nature-brave" : "nature-quiet",
        talentIds: ["talent-hp", "talent-atk", "talent-spa"]
      };
    }
    return {
      presetId: DEFAULT_PRESET,
      natureId: "nature-practical",
      talentIds: ["talent-hp", "talent-def", "talent-spd"]
    };
  }

  function resolveEffectiveBuild(input = {}) {
    const side = input.side === "enemy" ? "enemy" : "ally";
    const presetId = side === "enemy" ? normalizePreset(input.presetId) : DEFAULT_PRESET;
    const defaults = resolveDefaultBuild(presetId, input.monster);
    const manualNatureId = String(input.natureId || "");
    const manualTalentIds = Array.from({ length: 3 }, (_, index) => String(input.talentIds?.[index] || ""));
    const talentIds = manualTalentIds.slice();
    const usedTalentIds = new Set();
    talentIds.forEach((talentId, index) => {
      if (!talentId || usedTalentIds.has(talentId)) {
        talentIds[index] = "";
        return;
      }
      usedTalentIds.add(talentId);
    });
    talentIds.forEach((talentId, index) => {
      if (talentId) return;
      const fallbackTalentId = defaults.talentIds.find((candidateId) => !usedTalentIds.has(candidateId));
      if (!fallbackTalentId) return;
      talentIds[index] = fallbackTalentId;
      usedTalentIds.add(fallbackTalentId);
    });
    const allManual = Boolean(manualNatureId)
      && manualTalentIds.every(Boolean)
      && new Set(manualTalentIds).size === manualTalentIds.length;
    return {
      presetId,
      natureId: manualNatureId || defaults.natureId,
      talentIds,
      defaultNatureId: defaults.natureId,
      defaultTalentIds: defaults.talentIds.slice(),
      allManual,
      usesDefaults: !allManual
    };
  }

  return {
    DEFAULT_PRESET,
    PRESETS,
    normalizePreset,
    resolveDefaultBuild,
    resolveEffectiveBuild
  };
});
