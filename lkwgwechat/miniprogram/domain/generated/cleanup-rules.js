// Generated from index.html module LKWG_PVP_CLEANUP_RULES. Do not edit directly.
(function initPvpCleanupRules(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.LKWG_PVP_CLEANUP_RULES = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function buildPvpCleanupRules() {
  function clearAction(state) {
    let changed = false;
    if (state.action) {
      state.action = "";
      changed = true;
    }
    if (state.actionMonsterId) {
      state.actionMonsterId = "";
      changed = true;
    }
    if (Math.max(0, Math.round(Number(state.actionCuteLayers) || 0))) {
      state.actionCuteLayers = 0;
      changed = true;
    }
    if (state.forceImpact) {
      state.forceImpact = false;
      changed = true;
    }
    return changed;
  }

  function clearOneShotAttackBonuses(state) {
    let changed = false;
    ["manualDamageBonus", "manualPowerPercentBonus", "manualHitCountBonus"].forEach((key) => {
      if (Math.abs(Number(state[key]) || 0) > 0.0001) {
        state[key] = 0;
        changed = true;
      }
    });
    return changed;
  }

  function cleanupSideAfterTurn(state, options = {}) {
    if (!state || typeof state !== "object") return { changed: false, labels: [] };
    const labels = [];
    let changed = false;
    if (options.consumedAction && clearAction(state)) {
      labels.push("行动已结算");
      changed = true;
    }
    if (clearOneShotAttackBonuses(state)) {
      labels.push("下次攻击增益已清除");
      changed = true;
    }
    return { changed, labels };
  }

  function cleanupTurn(input = {}) {
    return {
      ally: cleanupSideAfterTurn(input.allyState, { consumedAction: input.allyConsumedAction }),
      enemy: cleanupSideAfterTurn(input.enemyState, { consumedAction: input.enemyConsumedAction })
    };
  }

  return {
    cleanupSideAfterTurn,
    cleanupTurn
  };
});
