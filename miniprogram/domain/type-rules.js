const { TYPES } = require("./constants");

const RELATION = {
  normal: { strong: [], weak: ["ground", "ghost", "mechanical"] },
  grass: { strong: ["water", "light", "ground"], weak: ["fire", "dragon", "poison", "bug", "wing", "mechanical"] },
  fire: { strong: ["grass", "ice", "bug", "mechanical"], weak: ["water", "ground", "dragon"] },
  water: { strong: ["fire", "ground", "mechanical"], weak: ["grass", "ice", "dragon"] },
  light: { strong: ["ghost", "demon"], weak: ["grass", "ice"] },
  ground: { strong: ["fire", "ice", "electric", "poison"], weak: ["grass", "fighting"] },
  ice: { strong: ["grass", "ground", "dragon", "wing"], weak: ["fire", "ice", "mechanical"] },
  dragon: { strong: ["dragon"], weak: ["mechanical"] },
  electric: { strong: ["water", "wing"], weak: ["grass", "ground", "dragon", "electric"] },
  poison: { strong: ["grass", "cute"], weak: ["ground", "poison", "ghost", "mechanical"] },
  bug: { strong: ["grass", "demon", "fantasy"], weak: ["fire", "poison", "fighting", "wing", "cute", "ghost", "mechanical"] },
  fighting: { strong: ["normal", "ground", "ice", "demon", "mechanical"], weak: ["poison", "bug", "wing", "cute", "ghost", "fantasy"] },
  wing: { strong: ["grass", "bug", "fighting"], weak: ["ground", "dragon", "electric", "mechanical"] },
  cute: { strong: ["dragon", "fighting", "demon"], weak: ["fire", "poison", "mechanical"] },
  ghost: { strong: ["light", "ghost", "fantasy"], weak: ["normal", "demon"] },
  demon: { strong: ["poison", "cute", "ghost"], weak: ["light", "fighting", "demon"] },
  mechanical: { strong: ["ground", "ice", "cute"], weak: ["fire", "water", "electric", "mechanical"] },
  fantasy: { strong: ["poison", "fighting"], weak: ["light", "mechanical", "fantasy"] }
};

const typeNameById = new Map(TYPES.map((type) => [type.id, type.name]));

function relationMultiplier(attacker, defender) {
  const relation = RELATION[attacker] || { strong: [], weak: [] };
  if (relation.strong.includes(defender)) return 2;
  if (relation.weak.includes(defender)) return 0.5;
  return 1;
}

function combinedDefenseMultiplier(attacker, defenderTypes = []) {
  return defenderTypes.reduce(
    (value, defender) => value * relationMultiplier(attacker, defender),
    1
  );
}

function combinedOffenseMultiplier(attackerTypes = [], defender) {
  if (!attackerTypes.length) return 1;
  return Math.max(
    ...attackerTypes.map((attacker) => relationMultiplier(attacker, defender))
  );
}

function coverageOfTypes(attackTypes = []) {
  return TYPES
    .filter((defender) => combinedOffenseMultiplier(attackTypes, defender.id) > 1)
    .map((defender) => defender.id);
}

function defensiveProfile(defenderTypes = []) {
  const weaknesses = [];
  const resistances = [];
  const immunities = [];
  for (const attacker of TYPES) {
    const multiplier = combinedDefenseMultiplier(attacker.id, defenderTypes);
    if (multiplier === 0) immunities.push(attacker.id);
    else if (multiplier > 1) weaknesses.push(attacker.id);
    else if (multiplier < 1) resistances.push(attacker.id);
  }
  return { weaknesses, resistances, immunities };
}

function typeName(id) {
  return typeNameById.get(id) || id || "";
}

module.exports = {
  RELATION,
  relationMultiplier,
  combinedDefenseMultiplier,
  combinedOffenseMultiplier,
  coverageOfTypes,
  defensiveProfile,
  typeName
};
