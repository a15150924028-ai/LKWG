const fs = require("fs");
const path = require("path");
const vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`${name} is missing.`);
  const open = html.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < html.length; index += 1) {
    if (html[index] === "{") depth += 1;
    if (html[index] === "}") {
      depth -= 1;
      if (depth === 0) return html.slice(start, index + 1);
    }
  }
  throw new Error(`${name} source is incomplete.`);
}

assert(
  html.includes("renderBloodlineRecommendation(selectedMonster, pet.bloodlineId)"),
  "Team bloodline field should render bloodline recommendations for the selected monster."
);
assert(
  html.includes('card.querySelectorAll("[data-recommend-bloodline]")') &&
    html.includes("button.dataset.recommendBloodline") &&
    html.includes("renderTeam(current);"),
  "Recommended bloodline pills should apply the selected bloodline and rebuild the team editor."
);
assert(
  html.includes(".bloodline-recommendation") &&
    html.includes(".bloodline-recommendation-pill.active"),
  "Bloodline recommendation UI should define its compact recommendation and active styles."
);

const sandbox = {
  TYPES: [
    { key: "normal", name: "普通" },
    { key: "grass", name: "草" },
    { key: "fire", name: "火" },
    { key: "water", name: "水" },
    { key: "light", name: "光" },
    { key: "ground", name: "地面" },
    { key: "ice", name: "冰" },
    { key: "dragon", name: "龙" },
    { key: "electric", name: "电" },
    { key: "poison", name: "毒" },
    { key: "bug", name: "虫" },
    { key: "fighting", name: "武" },
    { key: "wing", name: "翼" },
    { key: "cute", name: "萌" },
    { key: "ghost", name: "幽灵" },
    { key: "demon", name: "恶魔" },
    { key: "mechanical", name: "机械" },
    { key: "fantasy", name: "幻" }
  ],
  RELATION: {
    normal: { strong: [], weak: ["fighting", "mechanical"] },
    grass: { strong: ["water", "ground"], weak: ["fire", "grass", "poison", "wing", "bug", "dragon", "mechanical"] },
    fire: { strong: ["grass", "ice", "bug", "mechanical"], weak: ["water", "ground", "dragon"] },
    water: { strong: ["fire", "ground"], weak: ["grass", "water", "dragon"] },
    light: { strong: ["water", "cute", "ghost", "demon"], weak: ["grass", "mechanical", "fantasy"] },
    ground: { strong: ["fire", "electric", "poison", "mechanical"], weak: ["grass", "bug"] },
    ice: { strong: ["grass", "ground", "wing", "dragon"], weak: ["fire", "water", "mechanical"] },
    dragon: { strong: ["dragon"], weak: ["mechanical"] },
    electric: { strong: ["water", "wing"], weak: ["grass", "electric", "dragon"] },
    poison: { strong: ["grass", "cute"], weak: ["poison", "ground", "ghost", "mechanical"] },
    bug: { strong: ["grass", "cute", "demon"], weak: ["fire", "poison", "wing", "ghost", "mechanical"] },
    fighting: { strong: ["normal", "ice", "demon", "mechanical"], weak: ["poison", "wing", "cute", "ghost"] },
    wing: { strong: ["grass", "bug", "fighting"], weak: ["electric", "mechanical"] },
    cute: { strong: ["dragon", "demon"], weak: ["fire", "poison", "mechanical"] },
    ghost: { strong: ["ghost", "demon"], weak: ["mechanical"] },
    demon: { strong: ["cute", "ghost"], weak: ["fighting", "demon", "mechanical"] },
    mechanical: { strong: ["ice", "dragon", "cute"], weak: ["water", "electric", "mechanical"] },
    fantasy: { strong: ["light", "electric"], weak: ["grass", "mechanical"] }
  }
};

sandbox.TYPE_MAP = Object.fromEntries(sandbox.TYPES.map((type) => [type.key, type]));
sandbox.BLOODLINES = sandbox.TYPES.map((type) => ({
  id: `bloodline-${type.key}`,
  name: `${type.name}属性血脉`,
  type: type.key
})).concat({ id: "bloodline-boss", name: "首领血脉" });
sandbox.escapeHtml = (value) => String(value);
sandbox.typeName = (key) => sandbox.TYPE_MAP[key]?.name || key;
sandbox.typeBadgeHtml = (key) => `<span class="type-badge">${key}</span>`;
sandbox.bloodlineShortLabel = (bloodline) => sandbox.typeName(bloodline.type);

vm.createContext(sandbox);
vm.runInContext(`
  ${extractFunction("unique")}
  ${extractFunction("byTypeOrder")}
  ${extractFunction("relationMultiplier")}
  ${extractFunction("combinedDefenseMultiplier")}
  ${extractFunction("weakAttackersAgainst")}
  ${extractFunction("counterBloodlineRecommendations")}
  ${extractFunction("renderBloodlineRecommendation")}
  this.counterBloodlineRecommendations = counterBloodlineRecommendations;
  this.renderBloodlineRecommendation = renderBloodlineRecommendation;
`, sandbox);

const fireResult = sandbox.counterBloodlineRecommendations({ types: ["fire"] }, 3);
assert(
  fireResult.weaknesses.join(",") === "water,ground",
  "A fire monster should be treated as weak to water and ground attackers."
);
assert(
  fireResult.recommendations[0].bloodline.id === "bloodline-grass",
  "Grass bloodline should be the first recommendation for fire monsters because it counters both water and ground."
);
assert(
  fireResult.recommendations[0].covered.join(",") === "water,ground",
  "The top fire-monster recommendation should explain both covered weaknesses."
);

const waterResult = sandbox.counterBloodlineRecommendations({ types: ["water"] }, 3);
assert(
  waterResult.weaknesses.join(",") === "grass,light,electric",
  "A water monster should be treated as weak to grass, light, and electric attackers."
);
assert(
  waterResult.recommendations[0].bloodline.id === "bloodline-fantasy",
  "Fantasy bloodline should be the top water-monster recommendation because it counters light and electric."
);

const rendered = sandbox.renderBloodlineRecommendation({ types: ["fire"] }, "bloodline-grass");
assert(
  rendered.includes('data-recommend-bloodline="bloodline-grass"') &&
    rendered.includes("bloodline-recommendation-pill active"),
  "Rendered recommendations should expose selectable pills and mark the selected bloodline active."
);
assert(!rendered.includes("bloodline-boss"), "Boss bloodline must not appear in attribute counter recommendations.");
assert(
  sandbox.renderBloodlineRecommendation(null).includes("选择精灵后推荐血脉"),
  "The recommendation area should show an empty state before a monster is selected."
);

console.log("Team bloodline recommendation static checks passed.");
