const fs = require("fs");
const path = require("path");
const vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);

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

const rulesScript = scripts.find((script) => script.includes("LKWG_PVP_BUILD_RULES"));
assert(rulesScript, "PVP default-build rules module must exist.");

const sandbox = { module: { exports: {} } };
vm.runInNewContext(rulesScript, sandbox);
const rules = sandbox.module.exports;

const physicalMonster = { stats: { atk: 120, spa: 90 } };
const specialMonster = { stats: { atk: 80, spa: 130 } };
const tiedMonster = { stats: { atk: 100, spa: 100 } };

assert(rules.resolveDefaultBuild("durable", physicalMonster).natureId === "nature-practical", "Most durable must default to practical nature.");
assert(
  JSON.stringify(rules.resolveDefaultBuild("durable", physicalMonster).talentIds) === JSON.stringify(["talent-hp", "talent-def", "talent-spd"]),
  "Most durable must default to HP, physical defense, and magic defense."
);
assert(rules.resolveDefaultBuild("fast", physicalMonster).natureId === "nature-jolly", "Fast physical monsters must use jolly nature.");
assert(rules.resolveDefaultBuild("fast", specialMonster).natureId === "nature-timid", "Fast special monsters must use timid nature.");
assert(rules.resolveDefaultBuild("attack", physicalMonster).natureId === "nature-brave", "Highest physical attack must use brave nature.");
assert(rules.resolveDefaultBuild("attack", specialMonster).natureId === "nature-quiet", "Highest special attack must use quiet nature.");
assert(rules.resolveDefaultBuild("attack", tiedMonster).natureId === "nature-brave", "Equal attack race stats must use the physical branch.");

const partial = rules.resolveEffectiveBuild({
  side: "enemy",
  presetId: "fast",
  monster: physicalMonster,
  natureId: "",
  talentIds: ["talent-hp", "", "talent-spe"]
});
assert(partial.natureId === "nature-jolly", "Missing enemy nature must come from the active preset.");
assert(
  JSON.stringify(partial.talentIds) === JSON.stringify(["talent-hp", "talent-atk", "talent-spe"]),
  "Missing enemy talents must use preset order while skipping manual duplicates."
);
assert(partial.usesDefaults && !partial.allManual, "Partial manual builds must keep the preset active.");

const manual = rules.resolveEffectiveBuild({
  side: "enemy",
  presetId: "attack",
  monster: specialMonster,
  natureId: "nature-focused",
  talentIds: ["talent-hp", "talent-def", "talent-spd"]
});
assert(manual.natureId === "nature-focused", "Manual nature must override the preset.");
assert(
  JSON.stringify(manual.talentIds) === JSON.stringify(["talent-hp", "talent-def", "talent-spd"]),
  "Three manual talents must override the preset."
);
assert(!manual.usesDefaults && manual.allManual, "Complete manual builds must deactivate preset highlighting.");

const duplicateManual = rules.resolveEffectiveBuild({
  side: "enemy",
  presetId: "durable",
  monster: physicalMonster,
  natureId: "nature-practical",
  talentIds: ["talent-hp", "talent-hp", "talent-spd"]
});
assert(
  duplicateManual.usesDefaults && !duplicateManual.allManual,
  "Duplicate manual talents must keep the preset active because one slot still needs a default."
);
assert(
  new Set(duplicateManual.talentIds).size === 3,
  "Duplicate manual talents must be repaired into three unique effective talents."
);

const ally = rules.resolveEffectiveBuild({
  side: "ally",
  presetId: "fast",
  monster: specialMonster,
  natureId: "",
  talentIds: ["", "", ""]
});
assert(ally.presetId === "durable", "Ally missing fields must keep the existing durable default.");

const sideSource = extractFunction("renderPvpSide");
const hydrateSource = extractFunction("hydratePvpDamageSimulation");
const statsSource = extractFunction("renderPvpPanelStats");

assert(
  sideSource.includes('side === "enemy"') &&
    sideSource.includes('data-pvp-build-preset="${preset.id}"'),
  "Only the enemy PVP side must render the default-build preset buttons."
);
assert(
  hydrateSource.includes('state.defaultBuildPreset = button.dataset.pvpBuildPreset'),
  "Preset button clicks must switch the enemy default build."
);
assert(
  statsSource.includes("resolveEffectivePvpBuild(state, monster)") &&
    statsSource.includes("nature-up") &&
    statsSource.includes("nature-down") &&
    statsSource.includes("pvp-nature-arrow") &&
    statsSource.includes("pvp-talent-mark"),
  "Race-stat cards must render nature arrows and talent markers from the shared effective build."
);
assert(
  statsSource.includes("未选择性格、天分默认${defaultNatureText}、${defaultTalentText}。"),
  "Preset guidance must explicitly say unselected nature and talents use the shown defaults."
);
assert(statsSource.includes("＋"), "Talent markers must render a full-width green plus sign.");
assert(!statsSource.includes("+60"), "Race-stat cards must not render +60 talent text.");
assert(
  html.includes(".pvp-build-presets") &&
    html.includes(".pvp-build-preset.active") &&
    html.includes(".pvp-talent-mark") &&
    html.includes(".stat-cell.nature-up") &&
    html.includes(".stat-cell.nature-down"),
  "Preset controls and race-stat indicators must have dedicated styles."
);
assert(
  /\.pvp-nature-arrow\s*\{[^}]*font-size:\s*13px;[^}]*font-weight:\s*1000;[^}]*-webkit-text-stroke:\s*0\.45px currentColor;[^}]*text-shadow:/s.test(html),
  "Nature arrows must be large and stroked enough to remain readable."
);
assert(
  /\.pvp-talent-mark\s*\{[^}]*font-size:\s*15px;[^}]*font-weight:\s*1000;[^}]*-webkit-text-stroke:\s*0\.6px currentColor;[^}]*text-shadow:/s.test(html),
  "Talent plus markers must be larger and more heavily stroked than before."
);

console.log("PVP default build preset static checks passed.");
