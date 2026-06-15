// Generated from index.html module LKWG_PVP_COOLDOWN_RULES. Do not edit directly.
(function initPvpCooldownRules(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.LKWG_PVP_COOLDOWN_RULES = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function buildPvpCooldownRules() {
  function compactText(value) {
    return String(value || "").replace(/[\s\u200b\u200c\u200d]+/g, "");
  }

  function actionText(action) {
    return compactText(`${action?.name || ""} ${action?.description || ""} ${action?.effect || ""} ${(action?.effects || []).join(" ")}`);
  }

  function isDefenseAction(action) {
    return action?.category === "defense";
  }

  function baseDefenseCooldown(action, responseType = "") {
    if (!isDefenseAction(action)) return 0;
    let turns = 1;
    if (responseType === "defense-attack") {
      for (const match of actionText(action).matchAll(/防御技能冷却-(\d+)/g)) {
        turns -= Number(match[1]) || 0;
      }
    }
    return Math.max(0, turns);
  }

  function decayedDefenseTurns(state) {
    return Math.max(0, Math.round(Number(state?.defenseBlockTurns) || 0) - 1);
  }

  function settleDefenseCounter(state, action, responseType, incomingBlockTurns = 0) {
    return Math.max(
      decayedDefenseTurns(state),
      baseDefenseCooldown(action, responseType),
      Math.max(0, Math.round(Number(incomingBlockTurns) || 0))
    );
  }

  function resolveTurnCooldowns(input = {}) {
    return {
      ally: {
        defenseBlockTurns: settleDefenseCounter(
          input.allyState,
          input.allyAction,
          input.order?.allyResponse?.type || "",
          input.effects?.ally?.defenseBlockTurns
        )
      },
      enemy: {
        defenseBlockTurns: settleDefenseCounter(
          input.enemyState,
          input.enemyAction,
          input.order?.enemyResponse?.type || "",
          input.effects?.enemy?.defenseBlockTurns
        )
      }
    };
  }

  return {
    isDefenseAction,
    baseDefenseCooldown,
    settleDefenseCounter,
    resolveTurnCooldowns
  };
});
