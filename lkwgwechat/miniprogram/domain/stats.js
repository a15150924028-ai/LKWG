const TALENT_STAT_BY_ID = {
  "talent-hp": "hp",
  "talent-atk": "atk",
  "talent-def": "defense",
  "talent-spa": "spa",
  "talent-spd": "spd",
  "talent-spe": "spe"
};

const NATURE_PAIRS = {
  "nature-silent": ["hp", "atk"],
  "nature-peaceful": ["hp", "spa"],
  "nature-gloomy": ["hp", "defense"],
  "nature-careless-hp": ["hp", "spd"],
  "nature-practical": ["hp", "spe"],
  "nature-bold-atk": ["atk", "defense"],
  "nature-naughty": ["atk", "spd"],
  "nature-brave": ["atk", "spe"],
  "nature-strong": ["atk", "hp"],
  "nature-adamant": ["atk", "spa"],
  "nature-clever": ["spa", "atk"],
  "nature-focused": ["spa", "defense"],
  "nature-paranoid": ["spa", "spd"],
  "nature-quiet": ["spa", "spe"],
  "nature-rational": ["spa", "hp"],
  "nature-timid": ["spe", "atk"],
  "nature-jolly": ["spe", "spa"],
  "nature-hasty": ["spe", "defense"],
  "nature-reckless": ["spe", "spd"],
  "nature-passionate": ["spe", "hp"],
  "nature-steady": ["defense", "atk"],
  "nature-naive-defense": ["defense", "spa"],
  "nature-relaxed": ["defense", "spe"],
  "nature-lazy": ["defense", "spd"],
  "nature-frank": ["defense", "hp"],
  "nature-alert": ["spd", "atk"],
  "nature-shy": ["spd", "spa"],
  "nature-gentle": ["spd", "defense"],
  "nature-careful": ["spd", "spe"],
  "nature-anxious": ["spd", "hp"]
};

const STAT_KEYS = ["hp", "atk", "defense", "spa", "spd", "spe"];

function natureStatMods(natureId) {
  const mods = Object.fromEntries(STAT_KEYS.map((key) => [key, 1]));
  const pair = NATURE_PAIRS[natureId];
  if (pair) {
    mods[pair[0]] = 1.2;
    mods[pair[1]] = 0.9;
  }
  return mods;
}

function calculateFinalStats(monster, build = {}) {
  const baseStats = monster?.stats || monster?.raw?.stats || {};
  const mods = natureStatMods(build.natureId);
  const talented = new Set(
    (build.talentIds || []).map((id) => TALENT_STAT_BY_ID[id]).filter(Boolean)
  );
  return Object.fromEntries(STAT_KEYS.map((key) => {
    const base = Number(baseStats[key]) || 0;
    const iv = talented.has(key) ? 10 : 0;
    const trained = key === "hp"
      ? 1.7 * (base + 3 * iv) + 70
      : 1.1 * (base + 3 * iv) + 10;
    const finalBonus = key === "hp" ? 100 : 50;
    return [key, Math.max(1, Math.round(trained * mods[key] + finalBonus))];
  }));
}

module.exports = {
  STAT_KEYS,
  TALENT_STAT_BY_ID,
  NATURE_PAIRS,
  natureStatMods,
  calculateFinalStats
};
