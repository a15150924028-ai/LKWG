const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const bundle = JSON.parse(fs.readFileSync(path.join(root, "data", "local-bundle.json"), "utf8"));

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
  /\.combo-control\.with-suffix\s*\{[\s\S]*?grid-template-columns:\s*31px\s+minmax\(0,\s*1fr\)\s+auto\s+24px/.test(html),
  "Skill layer controls should live inside the combo row beside the skill name."
);
assert(
  html.includes('${config.suffixHtml || ""}') &&
    html.includes('class="combo-control${config.suffixHtml ? " with-suffix" : ""}"'),
  "createCombo should render optional suffix HTML in the same control row."
);
assert(
  html.includes("suffixHtml: renderSkillLayerControl(skill, selectedSkill)"),
  "Team skill combos should pass the power-layer control as an inline suffix."
);
assert(
  html.includes('const SKILL_POWER_LAYER_IDS = new Set([') &&
    html.includes('"skill-吹火"') &&
    html.includes('"skill-落雷"'),
  "Known permanent-damage skills should be explicitly allowlisted for layer controls."
);
assert(
  html.includes('current[petIndex].skills[skillIndex] = { skillId: item?.id || "", powerLayer: 0 };'),
  "Changing a skill on the same monster should save the new skill and reset its layer count."
);
assert(
  /powerLayer:\s*normalizeSkillPowerLayer\(row\.querySelector\("\[data-skill-layer-value\]"\)\?\.textContent\)/.test(html),
  "readTeam should persist the visible skill layer value."
);
assert(
  html.includes("state.skillPowerLayers = Array.from({ length: 4 }") &&
    html.includes("skillPowerLayer,") &&
    html.includes("pvpActionPowerLayer(attackerState, battleAction)"),
  "PVP damage should receive the team skill layer count."
);

const sandbox = {
  escapeHtml: (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char])),
  readTeam: () => [{
    monsterId: "monster-a",
    skills: [
      { skillId: "skill-吹火", powerLayer: 3 },
      { skillId: "", powerLayer: 0 },
      { skillId: "", powerLayer: 0 },
      { skillId: "", powerLayer: 0 }
    ]
  }],
  teamPetForMonster: (team, monsterId) => team.find((pet) => pet.monsterId === monsterId) || null
};

vm.createContext(sandbox);
vm.runInContext(`
  ${extractFunction("compactBattleText")}
  ${extractFunction("normalizeSkillPowerLayer")}
  ${html.match(/const SKILL_POWER_LAYER_IDS = new Set\(\[[\s\S]*?\]\);/)?.[0] || ""}
  ${extractFunction("skillPowerLayerRule")}
  ${extractFunction("renderSkillLayerControl")}
  ${extractFunction("pvpActionPowerLayer")}
  this.normalizeSkillPowerLayer = normalizeSkillPowerLayer;
  this.skillPowerLayerRule = skillPowerLayerRule;
  this.renderSkillLayerControl = renderSkillLayerControl;
  this.pvpActionPowerLayer = pvpActionPowerLayer;
`, sandbox);

const fireSkill = {
  id: "skill-吹火",
  name: "吹火",
  description: "造成物伤，每次使用后，本技能威力永久+20。"
};
const plainSkill = {
  id: "skill-火苗",
  name: "火苗",
  description: "对敌方精灵造成魔法伤害。"
};
const realBlowFire = bundle.skills.find((skill) => skill.id === "skill-吹火");
const realThunder = bundle.skills.find((skill) => skill.id === "skill-落雷");

assert(sandbox.normalizeSkillPowerLayer(-2) === 0, "Negative layer values should clamp to zero.");
assert(sandbox.normalizeSkillPowerLayer(120) === 99, "Layer values should cap at 99.");
assert(sandbox.skillPowerLayerRule(fireSkill), "Blow Fire-style permanent power skills should show a layer control.");
assert(sandbox.skillPowerLayerRule(realBlowFire), "The real local-bundle Blow Fire skill should show a layer control.");
assert(sandbox.skillPowerLayerRule(realThunder), "The real local-bundle Thunder skill should show a layer control.");
assert(!sandbox.skillPowerLayerRule(plainSkill), "Plain damage skills should not show a layer control.");

const controlHtml = sandbox.renderSkillLayerControl({ powerLayer: 2 }, fireSkill);
assert(
  controlHtml.includes("data-skill-layer-delta") &&
    controlHtml.includes("data-skill-layer-value") &&
    controlHtml.includes(">2</span>"),
  "Layer control should render minus, value, and plus controls in the skill combo."
);
assert(
  sandbox.pvpActionPowerLayer(
    { side: "ally", monsterId: "monster-a", skillPowerLayers: [1, 0, 0, 0] },
    { id: "skill-吹火", pvpSkillIndex: 0 }
  ) === 3,
  "Ally PVP damage should prefer the current saved team layer over stale PVP state."
);
assert(
  sandbox.pvpActionPowerLayer(
    { side: "enemy", monsterId: "monster-b", skillPowerLayers: [4, 0, 0, 0] },
    { id: "skill-吹火", pvpSkillIndex: 0 }
  ) === 4,
  "Enemy/manual PVP damage should use the PVP state's own layer count."
);

console.log("Team skill power layer static checks passed.");
