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

const renderTeamSource = extractFunction("renderTeam");
const hydrateSource = extractFunction("hydratePvpDamageSimulation");
const pvpHydrateStart = hydrateSource.indexOf("state.skillIds.forEach((skillId, skillIndex) => {");
const pvpSkillHydrateSource = hydrateSource.slice(pvpHydrateStart, hydrateSource.indexOf("const forceButton = root.querySelector", pvpHydrateStart));

assert(
  /\.combo-control\.with-suffix\s*\{[\s\S]*?grid-template-columns:\s*31px\s+minmax\(0,\s*1fr\)\s+auto\s+24px/.test(html),
  "Skill layer controls should live inside the combo row beside the skill name."
);
assert(
  /\.pvp-skill-slot\s+\.combo-control\.with-suffix\s*\{[\s\S]*?grid-template-columns:\s*16px\s+31px\s+minmax\(0,\s*1fr\)\s+auto\s+24px/.test(html),
  "PVP skill slots with layer controls should reserve an in-box suffix column."
);
assert(
  html.includes('${config.suffixHtml || ""}') &&
    html.includes('class="combo-control${config.suffixHtml ? " with-suffix" : ""}"'),
  "createCombo should render optional suffix HTML in the same control row."
);
assert(
  !renderTeamSource.includes("suffixHtml: renderSkillLayerControl") &&
    !renderTeamSource.includes("[data-skill-layer-delta]") &&
    !renderTeamSource.includes("powerLayer: normalizeSkillPowerLayer"),
  "Team editor skill boxes must not show or persist the power-layer control."
);
assert(
  pvpSkillHydrateSource.includes("suffixHtml: renderSkillLayerControl({ powerLayer: state.skillPowerLayers?.[skillIndex] }, selectedSkill)") &&
    pvpSkillHydrateSource.includes("[data-skill-layer-delta]") &&
    pvpSkillHydrateSource.includes("const layerControlChanged = Boolean(skillPowerLayerRule(selectedSkill)) !== Boolean(skillPowerLayerRule(item));") &&
    pvpSkillHydrateSource.includes("postUseChanged || weatherChanged || layerControlChanged") &&
    pvpSkillHydrateSource.includes("state.skillPowerLayers[skillIndex] = next") &&
    pvpSkillHydrateSource.includes("refreshPvpDamageOutputs(root)"),
  "PVP damage skill boxes should rerender and update the inline power-layer control."
);
assert(
  html.includes('const SKILL_POWER_LAYER_IDS = new Set([') &&
    html.includes('"skill-吹火"') &&
    html.includes('"skill-落雷"'),
  "Known permanent-damage skills should be explicitly allowlisted for layer controls."
);
assert(
  html.includes("state.skillPowerLayers = [0, 0, 0, 0];") &&
    html.includes("skillPowerLayer,") &&
    html.includes("pvpActionPowerLayer(attackerState, battleAction)"),
  "PVP damage should receive the panel skill layer count."
);

const sandbox = {
  escapeHtml: (value) => String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]))
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
  id: "skill-\u5439\u706b",
  name: "\u5439\u706b",
  description: "\u9020\u6210\u7269\u4f24\uff0c\u6bcf\u6b21\u4f7f\u7528\u540e\uff0c\u672c\u6280\u80fd\u5a01\u529b\u6c38\u4e45+20\u3002"
};
const plainSkill = {
  id: "skill-\u706b\u82d7",
  name: "\u706b\u82d7",
  description: "\u5bf9\u654c\u65b9\u7cbe\u7075\u9020\u6210\u9b54\u6cd5\u4f24\u5bb3\u3002"
};
const realBlowFire = bundle.skills.find((skill) => skill.id === "skill-\u5439\u706b");
const realThunder = bundle.skills.find((skill) => skill.id === "skill-\u843d\u96f7");

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
    { id: "skill-\u5439\u706b", pvpSkillIndex: 0 }
  ) === 1,
  "Ally PVP damage should use the PVP panel's own layer count, not a hidden team value."
);
assert(
  sandbox.pvpActionPowerLayer(
    { side: "enemy", monsterId: "monster-b", skillPowerLayers: [4, 0, 0, 0] },
    { id: "skill-\u5439\u706b", pvpSkillIndex: 0 }
  ) === 4,
  "Enemy/manual PVP damage should use the PVP state's own layer count."
);

console.log("PVP skill power layer static checks passed.");
