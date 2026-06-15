// Generated from index.html module LKWG_PVP_DAMAGE_CORE. Do not edit directly.
(function initPvpDamageCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.LKWG_PVP_DAMAGE_CORE = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function buildPvpDamageCore() {
  const DEFAULT_CORE_FACTOR = 0.9;

  function finiteNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function abilityLevelMultiplier(attackerMods, defenderMods, attackKey, defenseKey) {
    const attackChange = finiteNumber(attackerMods?.[attackKey]);
    const defenseChange = finiteNumber(defenderMods?.[defenseKey]);
    const numerator = 1 + Math.max(0, attackChange) + Math.max(0, -defenseChange);
    const denominator = 1 + Math.max(0, -attackChange) + Math.max(0, defenseChange);
    return numerator / denominator;
  }

  function calculateHit(input = {}) {
    const attack = Math.max(0, finiteNumber(input.attack));
    const defense = Math.max(1, finiteNumber(input.defense, 1));
    const skillPower = Math.max(0, finiteNumber(input.skillPower));
    const responseMultiplier = Math.max(0, finiteNumber(input.responseMultiplier, 1));
    const flatPowerAdd = finiteNumber(input.flatPowerAdd);
    const settledPower = Math.max(0, skillPower * responseMultiplier + flatPowerAdd);
    const powerBuffMultiplier = Math.max(0, 1 + finiteNumber(input.powerBuffPercent));
    const abilityLevel = Math.max(0, finiteNumber(input.abilityLevel, 1));
    const multipliers = [
      finiteNumber(input.coreFactor, DEFAULT_CORE_FACTOR),
      abilityLevel,
      powerBuffMultiplier,
      finiteNumber(input.stabMultiplier, 1),
      finiteNumber(input.typeMultiplier, 1),
      finiteNumber(input.weatherMultiplier, 1),
      finiteNumber(input.passiveDamageMultiplier, 1),
      finiteNumber(input.skillDamageMultiplier, 1),
      finiteNumber(input.reductionMultiplier, 1)
    ];
    const hasZeroFactor = attack <= 0 || settledPower <= 0 || multipliers.some((value) => value <= 0);
    const rawDamage = hasZeroFactor
      ? 0
      : (attack / defense) * settledPower * multipliers.reduce((total, value) => total * value, 1);
    const damage = rawDamage > 0 ? Math.max(1, Math.ceil(rawDamage)) : 0;
    return {
      damage,
      rawDamage,
      settledPower,
      effectivePower: settledPower * powerBuffMultiplier,
      powerBuffMultiplier,
      abilityLevel
    };
  }

  function calculateDamage(input = {}) {
    const hit = calculateHit(input);
    const hitCount = Math.max(1, Math.round(finiteNumber(input.hitCount, 1)));
    return {
      ...hit,
      hitCount,
      singleDamage: hit.damage,
      damage: hit.damage * hitCount
    };
  }

  return {
    DEFAULT_CORE_FACTOR,
    abilityLevelMultiplier,
    calculateHit,
    calculateDamage
  };
});
