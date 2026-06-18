const fs = require("fs");
const path = require("path");
const vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const weatherScript = scripts.find((script) => script.includes("LKWG_PVP_WEATHER_RULES"));
assert(weatherScript, "PVP weather rule module is missing.");

const sandbox = { module: { exports: {} } };
vm.runInNewContext(weatherScript, sandbox);
const weather = sandbox.module.exports;

assert(weather.normalizeWeather("rain") === "rain", "Rain must be a valid shared weather.");
assert(weather.normalizeWeather("unknown") === "", "Unknown weather must normalize to no weather.");
assert(weather.weatherFromSkill({ name: "落雨" }) === "rain", "落雨 must select rain.");
assert(weather.weatherFromSkill({ name: "沙涌" }) === "sandstorm", "沙涌 must select sandstorm.");
assert(weather.weatherFromSkill({ name: "冬至" }) === "blizzard", "冬至 must select blizzard.");
assert(weather.weatherElementType("rain") === "water", "Rain must expose water as its weather element.");
assert(weather.weatherElementType("sandstorm") === "ground", "Sandstorm must expose ground as its weather element.");
assert(weather.weatherElementType("blizzard") === "ice", "Blizzard must expose ice as its weather element.");
assert(weather.weatherPowerMultiplier("rain", { type: "water" }) === 1.75, "Rain must increase water skill power by 75%.");
assert(weather.weatherPowerMultiplier("rain", { type: "fire" }) === 1, "Rain must not change non-water skill power.");
assert(weather.weatherSkillCostReduction("sandstorm", { type: "ground" }) === 2, "Sandstorm must reduce ground skill cost by 2.");
assert(weather.weatherSkillCostReduction("sandstorm", { type: "water" }) === 0, "Sandstorm must not reduce non-ground skill cost.");
assert(weather.weatherStatusLayers("blizzard", { types: ["water"] }).freeze === 8, "Blizzard must provide eight freeze layers to non-ice monsters.");
assert(weather.weatherStatusLayers("blizzard", { types: ["water", "ice"] }).freeze === 0, "Any ice type must grant blizzard freeze immunity.");

assert(html.includes('weather: ""'), "PVP state must store one shared weather value.");
assert(html.includes('{ key: "blizzard", name: "雪天", type: "ice"'), "The ice weather choice must be labeled 雪天.");
assert(html.includes('data-pvp-weather="${option.key}"'), "PVP must render a shared weather segmented control.");
assert(html.includes('typeBadgeHtml(option.type)'), "Weather choices must use local attribute icons.");
assert(html.includes('TYPE_COLORS[option.type]'), "Selected weather choices must use the matching attribute color.");
assert(
  /\.pvp-weather-button\.active\s*\{[^}]*var\(--weather-color/s.test(html),
  "Selected weather button background must be driven by the current weather color."
);
assert(html.includes("setPvpWeatherFromSkill"), "Selecting or using a weather skill must update shared weather.");
assert(
  html.includes("weatherPowerMultiplier(pvpSimState.weather, damageAction)"),
  "PVP damage must apply the shared rain multiplier."
);
assert(
  html.includes("weatherSkillCostReduction(pvpSimState.weather, battleAction)"),
  "PVP skill cost must apply the shared sandstorm reduction."
);
assert(
  html.includes("weatherStatusLayers(pvpSimState.weather, defender)"),
  "PVP variable damage must receive shared blizzard freeze layers."
);
assert(!html.includes("pvpWeatherDuration"), "Weather UI must not ask for a duration.");

console.log("PVP weather static checks passed.");
