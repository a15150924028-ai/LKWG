// Generated from index.html module LKWG_PVP_WEATHER_RULES. Do not edit directly.
(function initPvpWeatherRules(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.LKWG_PVP_WEATHER_RULES = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function buildPvpWeatherRules() {
  const WEATHER_TYPES = new Set(["rain", "sandstorm", "blizzard"]);
  const WEATHER_SKILLS = {
    "落雨": "rain",
    "沙涌": "sandstorm",
    "冬至": "blizzard"
  };
  const WEATHER_ELEMENTS = {
    rain: "water",
    sandstorm: "ground",
    blizzard: "ice"
  };

  function normalizeWeather(value) {
    const weather = String(value || "");
    return WEATHER_TYPES.has(weather) ? weather : "";
  }

  function weatherFromSkill(skill) {
    const names = [skill?.name, ...(skill?.aliases || [])]
      .map((value) => String(value || "").replace(/\s+/g, ""))
      .filter(Boolean);
    const matchedName = names.find((name) => WEATHER_SKILLS[name]);
    return matchedName ? WEATHER_SKILLS[matchedName] : "";
  }

  function weatherElementType(weather) {
    return WEATHER_ELEMENTS[normalizeWeather(weather)] || "";
  }

  function weatherPowerMultiplier(weather, action) {
    return normalizeWeather(weather) === "rain" && action?.type === "water" ? 1.75 : 1;
  }

  function weatherSkillCostReduction(weather, action) {
    return normalizeWeather(weather) === "sandstorm" && action?.type === "ground" ? 2 : 0;
  }

  function weatherStatusLayers(weather, monster) {
    const iceImmune = Array.isArray(monster?.types) && monster.types.includes("ice");
    return {
      freeze: normalizeWeather(weather) === "blizzard" && !iceImmune ? 8 : 0
    };
  }

  return {
    normalizeWeather,
    weatherFromSkill,
    weatherElementType,
    weatherPowerMultiplier,
    weatherSkillCostReduction,
    weatherStatusLayers
  };
});
