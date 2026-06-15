// Generated from index.html module LKWG_PVP_ENERGY_RULES. Do not edit directly.
(function initPvpEnergyRules(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.LKWG_PVP_ENERGY_RULES = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function buildPvpEnergyRules() {
  const DEFAULT_ENERGY = 10;
  const RESPONSE_NAME_BY_TYPE = {
    "defense-attack": "应对攻击",
    "attack-status": "应对状态",
    "status-defense": "应对防御"
  };

  function compactText(value) {
    return String(value || "").replace(/[\s\u200b\u200c\u200d]+/g, "");
  }

  function actionText(action) {
    return compactText(`${action?.name || ""} ${action?.description || ""} ${action?.effect || ""} ${(action?.effects || []).join(" ")}`);
  }

  function baseSkillCost(action) {
    const value = [action?.energyCost, action?.pp].find((item) => Number.isFinite(Number(item)));
    return Math.max(0, Math.round(Number(value) || 0));
  }

  function currentSkillCost(action, state = {}) {
    const override = state?.skillCostOverrides?.[action?.id];
    return Number.isFinite(Number(override)) ? Math.max(0, Math.round(Number(override))) : baseSkillCost(action);
  }

  function effectiveSkillCost(action, state = {}, context = {}) {
    const reduction = Math.max(0, Math.round(Number(context.weatherCostReduction) || 0))
      + Math.max(0, Math.round(Number(context.traitCostReduction) || 0));
    return Math.max(0, currentSkillCost(action, state) - reduction);
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

  function permanentCostDelta(action, responseType) {
    let delta = 0;
    splitActionClauses(actionText(action), responseType).forEach((segment) => {
      for (const match of segment.matchAll(/本技能能耗永久([+\-])(\d+)/g)) {
        const value = Number(match[2]) || 0;
        delta += match[1] === "-" ? -value : value;
      }
    });
    return delta;
  }

  function resolveActionEnergy(action, context = {}) {
    const state = context.state || {};
    if (!action) {
      return {
        cost: 0,
        nextEnergy: Math.max(0, Math.round(Number(state.energy ?? DEFAULT_ENERGY) || 0)),
        skillCostDelta: 0,
        nextSkillCost: null,
        skillCostOverrides: { ...(state.skillCostOverrides || {}) },
        labels: []
      };
    }
    const cost = effectiveSkillCost(action, state, context);
    const currentEnergy = Math.max(0, Math.round(Number(state.energy ?? DEFAULT_ENERGY) || 0));
    const skillCostDelta = permanentCostDelta(action, context.responseType || "");
    const currentCostBeforePermanent = currentSkillCost(action, state);
    const nextSkillCost = Math.max(0, currentCostBeforePermanent + skillCostDelta);
    const skillCostOverrides = { ...(state.skillCostOverrides || {}) };
    if (skillCostDelta && action.id) {
      skillCostOverrides[action.id] = nextSkillCost;
    }
    const labels = [`能量-${cost}`];
    if (skillCostDelta) labels.push(`本技能能耗永久${skillCostDelta > 0 ? "+" : ""}${skillCostDelta}`);
    return {
      cost,
      nextEnergy: Math.max(0, currentEnergy - cost),
      skillCostDelta,
      nextSkillCost,
      skillCostOverrides,
      labels
    };
  }

  function resolveTurnEnergy(input = {}) {
    const ally = resolveActionEnergy(input.allyAction, {
      state: input.allyState,
      responseType: input.order?.allyResponse?.type || "",
      weatherCostReduction: input.allyWeatherCostReduction,
      traitCostReduction: input.allyTraitCostReduction
    });
    const enemy = resolveActionEnergy(input.enemyAction, {
      state: input.enemyState,
      responseType: input.order?.enemyResponse?.type || "",
      weatherCostReduction: input.enemyWeatherCostReduction,
      traitCostReduction: input.enemyTraitCostReduction
    });
    return { ally, enemy };
  }

  return {
    baseSkillCost,
    currentSkillCost,
    effectiveSkillCost,
    permanentCostDelta,
    resolveActionEnergy,
    resolveTurnEnergy
  };
});
