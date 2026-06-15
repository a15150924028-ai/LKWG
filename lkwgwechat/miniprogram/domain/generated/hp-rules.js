// Generated from index.html module LKWG_PVP_HP_RULES. Do not edit directly.
(function initPvpHpRules(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.LKWG_PVP_HP_RULES = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function buildPvpHpRules() {
  function compactText(value) {
    return String(value || "").replace(/[\s\u200b\u200c\u200d]+/g, "");
  }

  function clampHp(value, maxHp) {
    const max = Math.max(1, Math.round(Number(maxHp) || 1));
    return Math.max(0, Math.min(max, Math.round(Number(value) || 0)));
  }

  function actionHasFearlessHeart(action) {
    const text = compactText(`${action?.name || ""} ${action?.description || ""} ${action?.effect || ""} ${(action?.effects || []).join(" ")}`);
    return /无畏之心/.test(text) || (/减伤100%/.test(text) && /伤害转化为等量生命恢复/.test(text));
  }

  function settleIncomingDamage(input = {}) {
    const maxHp = Math.max(1, Math.round(Number(input.maxHp) || 1));
    const currentHp = clampHp(input.state?.currentHp ?? maxHp, maxHp);
    const incomingDamage = Math.max(0, Math.round(Number(input.incomingDamage) || 0));
    const preventedDamage = Math.max(0, Math.round(Number(input.preventedDamage ?? incomingDamage) || 0));
    const fearless = input.responseType === "defense-attack" && actionHasFearlessHeart(input.defenderAction);
    if (fearless) {
      const nextHp = clampHp(currentHp + preventedDamage, maxHp);
      return {
        nextHp,
        damageTaken: 0,
        heal: nextHp - currentHp,
        preventedDamage,
        labels: preventedDamage ? [`无畏之心回复${nextHp - currentHp}`] : []
      };
    }
    const nextHp = clampHp(currentHp - incomingDamage, maxHp);
    return {
      nextHp,
      damageTaken: currentHp - nextHp,
      heal: 0,
      preventedDamage: 0,
      labels: incomingDamage ? [`受到伤害${currentHp - nextHp}`] : []
    };
  }

  function resolveTurnHp(input = {}) {
    const ally = settleIncomingDamage({
      state: input.allyState,
      maxHp: input.allyMaxHp,
      incomingDamage: input.enemyOutgoingDamage,
      preventedDamage: input.enemyPreventedDamage,
      defenderAction: input.allyAction,
      responseType: input.order?.allyResponse?.type || ""
    });
    const enemy = settleIncomingDamage({
      state: input.enemyState,
      maxHp: input.enemyMaxHp,
      incomingDamage: input.allyOutgoingDamage,
      preventedDamage: input.allyPreventedDamage,
      defenderAction: input.enemyAction,
      responseType: input.order?.enemyResponse?.type || ""
    });
    return { ally, enemy };
  }

  return {
    clampHp,
    actionHasFearlessHeart,
    settleIncomingDamage,
    resolveTurnHp
  };
});
