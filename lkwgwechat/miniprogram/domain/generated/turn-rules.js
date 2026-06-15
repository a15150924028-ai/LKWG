// Generated from index.html module LKWG_PVP_TURN_RULES. Do not edit directly.
(function initPvpTurnRules(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.LKWG_PVP_TURN_RULES = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function buildPvpTurnRules() {
  function compactTurnText(value) {
    return String(value || "").replace(/\s+/g, "");
  }

  function actionCategory(action) {
    if (!action) return "";
    if (action.id === "pvp-force-impact") return "attack";
    if (action.category === "physical" || action.category === "special" || action.category === "attack") return "attack";
    if (action.category === "defense") return "defense";
    if (action.category === "status") return "status";
    return String(action.category || "");
  }

  function actionText(action) {
    return compactTurnText(`${action?.name || ""} ${action?.description || ""} ${action?.effect || ""} ${(action?.effects || []).join(" ")}`);
  }

  function canRespondToAction(action, targetAction) {
    const category = actionCategory(action);
    const targetCategory = actionCategory(targetAction);
    const text = actionText(action);
    if (!action || !targetAction) return { success: false, type: "", reason: "" };
    if (action?.id === "pvp-force-impact" && targetCategory === "status") {
      return { success: true, type: "attack-status", reason: "应对状态" };
    }
    if (category === "attack" && targetCategory === "status" && /应对状态/.test(text)) {
      return { success: true, type: "attack-status", reason: "应对状态" };
    }
    if (category === "defense" && targetCategory === "attack") {
      return { success: true, type: "defense-attack", reason: "应对攻击" };
    }
    if (category === "status" && targetCategory === "defense" && /应对防御/.test(text)) {
      return { success: true, type: "status-defense", reason: "应对防御" };
    }
    return { success: false, type: "", reason: "" };
  }

  function priorityValue(action, state) {
    const actionPriority = Number(action?.priority ?? action?.priorityLevel ?? 0);
    const statePriority = Number(state?.priority ?? state?.priorityLevel ?? state?.nextPriority ?? 0);
    return (Number.isFinite(actionPriority) ? actionPriority : 0)
      + (Number.isFinite(statePriority) ? statePriority : 0);
  }

  function resolveTurnOrder(input = {}) {
    const allyAction = input.allyAction;
    const enemyAction = input.enemyAction;
    if (!allyAction || !enemyAction) {
      return { first: "", reason: "missing-action", allyResponse: { success: false }, enemyResponse: { success: false } };
    }
    const allyResponse = canRespondToAction(allyAction, enemyAction);
    const enemyResponse = canRespondToAction(enemyAction, allyAction);
    if (allyResponse.type === "attack-status") {
      return { first: "ally", reason: "ally-response-status", allyResponse, enemyResponse, simultaneous: true };
    }
    if (enemyResponse.type === "attack-status") {
      return { first: "enemy", reason: "enemy-response-status", allyResponse, enemyResponse, simultaneous: true };
    }
    if (allyResponse.type === "status-defense") {
      return { first: "ally", reason: "ally-response-defense", allyResponse, enemyResponse, simultaneous: true };
    }
    if (enemyResponse.type === "status-defense") {
      return { first: "enemy", reason: "enemy-response-defense", allyResponse, enemyResponse, simultaneous: true };
    }
    if (allyResponse.type === "defense-attack" || enemyResponse.type === "defense-attack") {
      return {
        first: allyResponse.type === "defense-attack" ? "enemy" : "ally",
        reason: "defense-response",
        allyResponse,
        enemyResponse,
        defenseSide: allyResponse.type === "defense-attack" ? "ally" : "enemy"
      };
    }
    const allyPriority = priorityValue(allyAction, input.allyState);
    const enemyPriority = priorityValue(enemyAction, input.enemyState);
    if (allyPriority !== enemyPriority) {
      return { first: allyPriority > enemyPriority ? "ally" : "enemy", reason: "priority", allyPriority, enemyPriority, allyResponse, enemyResponse };
    }
    const allySpeed = Number(input.allySpeed) || 0;
    const enemySpeed = Number(input.enemySpeed) || 0;
    if (allySpeed !== enemySpeed) {
      return { first: allySpeed > enemySpeed ? "ally" : "enemy", reason: "speed", allyPriority, enemyPriority, allySpeed, enemySpeed, allyResponse, enemyResponse };
    }
    const randomFn = typeof input.random === "function" ? input.random : Math.random;
    const roll = Number(randomFn());
    const normalizedRoll = Number.isFinite(roll) ? Math.max(0, Math.min(0.999999, roll)) : 0;
    return {
      first: normalizedRoll < 0.5 ? "ally" : "enemy",
      reason: "tie",
      random: true,
      roll: normalizedRoll,
      allyPriority,
      enemyPriority,
      allySpeed,
      enemySpeed,
      allyResponse,
      enemyResponse
    };
  }

  return {
    actionCategory,
    canRespondToAction,
    priorityValue,
    resolveTurnOrder
  };
});
