(function initPvpTraitRules(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.LKWG_PVP_TRAIT_RULES = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function buildPvpTraitRules() {
  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  const RULES = deepFreeze([
    {
      chainIds: ["season-s2-afec977b0e76"],
      names: ["巨鼓象"],
      traitName: "合拍",
      statPerLayer: { atk: 0.2, defense: 0.2 }
    },
    {
      chainIds: ["049"],
      traitName: "囤积",
      defaultLayers: 10,
      statPerLayer: { defense: 0.1, spd: 0.1 }
    },
    {
      chainIds: ["181"],
      traitName: "身经百练",
      powerPercentPerLayer: 0.2,
      actionTypes: ["water", "fighting"]
    },
    { chainIds: ["165"], traitName: "乘风连击", hitCountPerLayer: 1 },
    { chainIds: ["239"], traitName: "洄游", costReductionPerLayer: 1 },
    {
      chainIds: ["212", "216"],
      traitName: "拨浪鼓",
      flatPowerPerLayer: 10,
      actionTypes: ["poison", "cute"]
    },
    { chainIds: ["085"], traitName: "嫁祸", hitCountPerLayer: 2 },
    { chainIds: ["102"], traitName: "自由飘", hitCountPerLayer: 2 },
    { chainIds: ["185"], traitName: "守护者", costReductionPerLayer: 1 },
    { chainIds: ["096"], traitName: "咔咔冲刺", hitCountPerLayer: 1 },
    {
      chainIds: ["221"],
      traitName: "定向精炼",
      flatPowerPerLayer: 10,
      actionTypes: ["mechanical", "ground"]
    },
    {
      chainIds: ["chain-chicken"],
      names: ["绅士鸡"],
      traitName: "指挥家",
      statPerLayer: { atk: 0.2, spa: 0.2 }
    },
    {
      chainIds: ["chain-chicken"],
      names: ["武者鸡"],
      traitName: "斗技",
      flatPowerPerLayer: 20
    },
    {
      chainIds: ["171"],
      traitName: "消波块",
      costReductionPerLayer: 1,
      actionTypes: ["ground"]
    },
    { chainIds: ["323"], traitName: "血型吸引", flatPowerPerLayer: 10 },
    {
      chainIds: ["258"],
      traitName: "恶魔的晚宴",
      statPerLayer: { atk: 0.5, spa: 0.5 }
    },
    {
      chainIds: ["chain-dimo"],
      names: ["迪莫", "圣光迪莫"],
      traitName: "最好的伙伴",
      statPerLayer: {
        atk: 0.2,
        defense: 0.2,
        spa: 0.2,
        spd: 0.2,
        spe: 0.2
      },
      energyPerLayer: 2
    },
    { chainIds: ["327"], traitName: "搜刮", statPerLayer: { spa: 0.2 } },
    {
      chainIds: ["chain-speeddog"],
      names: ["护主犬", "音速犬"],
      traitName: "专注力",
      defaultLayers: 10,
      statPerLayer: { atk: 0.1 }
    },
    {
      chainIds: ["chain-speeddog"],
      names: ["风暴战犬"],
      traitName: "全神贯注",
      defaultLayers: 10,
      statPerLayer: { atk: 0.1 }
    }
  ]);

  const BOSS_TRAIT_NAMES = deepFreeze({
    "风暴战犬": "全神贯注",
    "黑猫密探": "先知",
    "恶魔狼王": "悼亡",
    "神谕鲨": "水翼飞升",
    "奇梦咪": "三鼓作气",
    "棋契陛下": "御驾亲征",
    "花魁蜂后": "虫群突袭",
    "烈火战神": "爆燃",
    "波普鹿": "超级电池"
  });

  const STAT_KEYS = ["hp", "atk", "defense", "spa", "spd", "spe"];

  function normalizeTraitLayers(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0;
  }

  function monsterName(monster) {
    return String(monster?.name || "");
  }

  function monsterChainId(monster) {
    const candidates = [
      monster?.chainId,
      monster?.evolutionChainId,
      monster?.familyId,
      monster?.baseId,
      monster?.raw?.chainId,
      monster?.raw?.evolutionChainId,
      monster?.raw?.familyId,
      monster?.raw?.baseId,
      monster?.evolution_chain_id,
      monster?.family_id,
      monster?.base_id,
      monster?.raw?.evolution_chain_id,
      monster?.raw?.family_id,
      monster?.raw?.base_id
    ];
    const chainId = candidates.find((value) => value != null && String(value) !== "");
    return chainId == null ? "" : String(chainId);
  }

  function matchesName(name, expected) {
    return name === expected || name.startsWith(`${expected}（`);
  }

  function matchesRule(monster, rule) {
    const chainId = monsterChainId(monster);
    if (!rule.chainIds.includes(chainId)) return false;
    if (!rule.names?.length) return true;
    const name = monsterName(monster);
    return rule.names.some((expected) => matchesName(name, expected));
  }

  function resolveTraitRule(monster) {
    return RULES.find((rule) => matchesRule(monster, rule)) || null;
  }

  function defaultTraitLayers(monster) {
    return normalizeTraitLayers(resolveTraitRule(monster)?.defaultLayers);
  }

  function traitName(monster) {
    const name = monsterName(monster);
    return BOSS_TRAIT_NAMES[name] || resolveTraitRule(monster)?.traitName || "";
  }

  function scaledValue(value, layers) {
    return Math.round(Number(value || 0) * layers * 1e12) / 1e12;
  }

  function resolveTraitEffects(monster, layers, action = null) {
    const rule = resolveTraitRule(monster);
    const normalizedLayers = normalizeTraitLayers(layers);
    const statMods = Object.fromEntries(STAT_KEYS.map((key) => [key, 0]));
    const actionAllowed = !rule?.actionTypes?.length || rule.actionTypes.includes(action?.type);

    for (const [key, value] of Object.entries(rule?.statPerLayer || {})) {
      if (Object.hasOwn(statMods, key)) {
        statMods[key] = scaledValue(value, normalizedLayers);
      }
    }

    return {
      rule,
      layers: normalizedLayers,
      traitName: traitName(monster),
      statMods,
      flatPower: actionAllowed ? scaledValue(rule?.flatPowerPerLayer, normalizedLayers) : 0,
      powerMultiplier: actionAllowed
        ? 1 + scaledValue(rule?.powerPercentPerLayer, normalizedLayers)
        : 1,
      hitCountAdd: actionAllowed ? scaledValue(rule?.hitCountPerLayer, normalizedLayers) : 0,
      skillCostReduction: actionAllowed
        ? scaledValue(rule?.costReductionPerLayer, normalizedLayers)
        : 0,
      energyGain: scaledValue(rule?.energyPerLayer, normalizedLayers)
    };
  }

  return {
    RULES,
    BOSS_TRAIT_NAMES,
    normalizeTraitLayers,
    resolveTraitRule,
    defaultTraitLayers,
    traitName,
    resolveTraitEffects
  };
});
