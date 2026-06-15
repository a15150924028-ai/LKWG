// Generated from index.html module LKWG_PVP_EFFECT_RULES. Do not edit directly.
(function initPvpEffectRules(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.LKWG_PVP_EFFECT_RULES = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function buildPvpEffectRules() {
  const STAT_KEYS = ["hp", "atk", "defense", "spa", "spd", "spe"];
  const STAT_LABELS = {
    hp: "生命",
    atk: "物攻",
    defense: "物防",
    spa: "魔攻",
    spd: "魔防",
    spe: "速度"
  };
  const STAT_NAME_TO_KEY = {
    "生命": "hp",
    "物攻": "atk",
    "物防": "defense",
    "魔攻": "spa",
    "魔防": "spd",
    "速度": "spe"
  };
  const RESPONSE_NAME_BY_TYPE = {
    "defense-attack": "应对攻击",
    "attack-status": "应对状态",
    "status-defense": "应对防御"
  };

  function blankStatMods() {
    return Object.fromEntries(STAT_KEYS.map((key) => [key, 0]));
  }

  function blankSideEffects() {
    return {
      statMods: blankStatMods(),
      statusLayers: { freeze: 0 },
      nextPriority: 0,
      defenseBlockTurns: 0,
      labels: []
    };
  }

  function blankEffects() {
    return {
      self: blankSideEffects(),
      enemy: blankSideEffects()
    };
  }

  function compactText(value) {
    return String(value || "").replace(/[\s\u200b\u200c\u200d]+/g, "");
  }

  function actionText(action) {
    return compactText(`${action?.name || ""} ${action?.description || ""} ${action?.effect || ""} ${(action?.effects || []).join(" ")}`);
  }

  function addLabel(side, label) {
    if (label && !side.labels.includes(label)) side.labels.push(label);
  }

  function addStat(side, key, value) {
    if (!key || !Number.isFinite(value) || !value) return;
    side.statMods[key] = Math.round(((Number(side.statMods[key]) || 0) + value) * 1000) / 1000;
  }

  function statNamesFromToken(token) {
    const value = compactText(token);
    if (!value) return [];
    if (value.includes("全属性") || value.includes("所有属性")) return STAT_KEYS;
    if (value.includes("攻防速")) return ["atk", "spa", "defense", "spd", "spe"];
    if (value.includes("双攻")) return ["atk", "spa"];
    if (value.includes("双防")) return ["defense", "spd"];
    const keys = [];
    Object.entries(STAT_NAME_TO_KEY).forEach(([name, key]) => {
      if (value.includes(name)) keys.push(key);
    });
    return [...new Set(keys)];
  }

  function targetSide(segment, fallback = "self") {
    return /敌方|对手|被应对/.test(segment) ? "enemy" : fallback;
  }

  function parseStatMods(segment, effects) {
    const statGroup = "(全属性|所有属性|攻防速|双攻|双防|生命|物攻|物防|魔攻|魔防|速度|物攻和物防|魔攻和魔防|物防和魔防|物攻和魔攻)";
    const patterns = [
      new RegExp(`(?:自己|自身|己方|敌方|对手)?(?:获得|得到|取得|增加|提升|提高|降低)?${statGroup}([+\\-])(\\d+)%`, "g"),
      new RegExp(`(?:自己|自身|己方|敌方|对手)?(?:获得|得到|取得|增加|提升|提高|降低)?${statGroup}(?:增加|提升|提高|降低)(\\d+)%`, "g")
    ];
    for (const pattern of patterns) {
      for (const match of segment.matchAll(pattern)) {
        const token = match[1];
        const explicitSign = match[2] || (segment.slice(Math.max(0, match.index - 8), match.index + match[0].length).includes("降低") ? "-" : "+");
        const rawValue = Number(match[3] || match[2]) || 0;
        const sign = explicitSign === "-" || /降低/.test(match[0]) ? -1 : 1;
        const side = effects[targetSide(match[0])];
        statNamesFromToken(token).forEach((key) => {
          const value = sign * rawValue / 100;
          addStat(side, key, value);
          addLabel(side, `${STAT_LABELS[key]}${value > 0 ? "+" : ""}${Math.round(value * 100)}%`);
        });
      }
    }
  }

  function parseFreeze(segment, effects) {
    const freezePattern = /(?:敌方|对手)?(?:额外)?获得(\d+)层冻结/g;
    for (const match of segment.matchAll(freezePattern)) {
      const side = effects[targetSide(match[0], "enemy")];
      const layers = Math.max(0, Math.round(Number(match[1]) || 0));
      if (!layers) continue;
      side.statusLayers.freeze += layers;
      addLabel(side, `冻结+${layers}层`);
    }
    if (/冻结/.test(segment)) return;
    const extraLayerPattern = /额外获得(\d+)层/g;
    for (const match of segment.matchAll(extraLayerPattern)) {
      const layers = Math.max(0, Math.round(Number(match[1]) || 0));
      if (!layers) continue;
      effects.enemy.statusLayers.freeze += layers;
      addLabel(effects.enemy, `冻结+${layers}层`);
    }
  }

  function parsePriority(segment, effects) {
    const match = segment.match(/(?:下一次|下次)?行动获得先手\+(\d+)/);
    if (!match) return;
    const amount = Math.max(0, Math.round(Number(match[1]) || 0));
    if (!amount) return;
    effects.self.nextPriority += amount;
    addLabel(effects.self, `先手+${amount}`);
  }

  function parseDefenseBlock(segment, effects) {
    const match = segment.match(/被应对技能冷却(\d+)回合/);
    if (!match) return;
    const turns = Math.max(0, Math.round(Number(match[1]) || 0));
    if (!turns) return;
    effects.enemy.defenseBlockTurns = Math.max(Number(effects.enemy.defenseBlockTurns) || 0, turns);
    addLabel(effects.enemy, `防御禁用${turns}回合`);
  }

  function splitActionClauses(text, responseType) {
    const responseName = RESPONSE_NAME_BY_TYPE[responseType] || "";
    const firstResponseIndex = text.search(/应对(?:攻击|状态|防御)：/);
    const base = firstResponseIndex >= 0 ? text.slice(0, firstResponseIndex) : text;
    let response = "";
    if (responseName) {
      const marker = `${responseName}：`;
      const start = text.indexOf(marker);
      if (start >= 0) {
        response = text.slice(start + marker.length);
        const next = response.search(/应对(?:攻击|状态|防御)：/);
        if (next >= 0) response = response.slice(0, next);
      }
    }
    return [base, response].filter(Boolean);
  }

  function normalizeStateStatMods(state) {
    const source = state?.skillStatMods || state?.statMods || {};
    const mods = blankStatMods();
    STAT_KEYS.forEach((key) => {
      mods[key] = Number(source?.[key]) || 0;
    });
    return mods;
  }

  function applyMudArmorDoubling(action, context, effects) {
    if (action?.name !== "泥浆铠甲" || context.responseType !== "status-defense") return;
    const current = normalizeStateStatMods(context.selfState);
    STAT_KEYS.forEach((key) => {
      const added = Number(effects.self.statMods[key]) || 0;
      const finalValue = (current[key] + added) * 2;
      effects.self.statMods[key] = Math.round((finalValue - current[key]) * 1000) / 1000;
    });
    addLabel(effects.self, "当前增益翻倍");
  }

  function resolveActionEffects(action, context = {}) {
    const effects = blankEffects();
    const text = actionText(action);
    const clauses = splitActionClauses(text, context.responseType);
    clauses.forEach((segment) => {
      parseStatMods(segment, effects);
      parseFreeze(segment, effects);
      parsePriority(segment, effects);
      parseDefenseBlock(segment, effects);
    });
    applyMudArmorDoubling(action, context, effects);
    return effects;
  }

  function mergeSideEffects(target, source) {
    STAT_KEYS.forEach((key) => addStat(target, key, Number(source?.statMods?.[key]) || 0));
    target.statusLayers.freeze += Math.max(0, Math.round(Number(source?.statusLayers?.freeze) || 0));
    target.nextPriority += Math.max(0, Math.round(Number(source?.nextPriority) || 0));
    target.defenseBlockTurns = Math.max(Number(target.defenseBlockTurns) || 0, Number(source?.defenseBlockTurns) || 0);
    (source?.labels || []).forEach((label) => addLabel(target, label));
  }

  function resolveTurnEffects(input = {}) {
    const result = {
      ally: blankSideEffects(),
      enemy: blankSideEffects()
    };
    const allyEffects = resolveActionEffects(input.allyAction, {
      responseType: input.order?.allyResponse?.type || "",
      selfState: input.allyState,
      enemyState: input.enemyState
    });
    const enemyEffects = resolveActionEffects(input.enemyAction, {
      responseType: input.order?.enemyResponse?.type || "",
      selfState: input.enemyState,
      enemyState: input.allyState
    });
    mergeSideEffects(result.ally, allyEffects.self);
    mergeSideEffects(result.enemy, allyEffects.enemy);
    mergeSideEffects(result.enemy, enemyEffects.self);
    mergeSideEffects(result.ally, enemyEffects.enemy);
    return result;
  }

  return {
    blankStatMods,
    blankSideEffects,
    resolveActionEffects,
    resolveTurnEffects
  };
});
