const fs = require("fs");
const path = require("path");
const vm = require("vm");

const htmlFile = "index.html";
const html = fs.readFileSync(path.join(__dirname, "..", htmlFile), "utf8");

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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sandbox = {};
vm.runInNewContext(`
  const PASSIVE_STAT_ALIASES = [
    { key: "atk", label: "\u7269\u653b", aliases: ["\u7269\u653b"] },
    { key: "spa", label: "\u9b54\u653b", aliases: ["\u9b54\u653b"] },
    { key: "defense", label: "\u7269\u9632", aliases: ["\u7269\u9632"] },
    { key: "spd", label: "\u9b54\u9632", aliases: ["\u9b54\u9632"] },
    { key: "spe", label: "\u901f\u5ea6", aliases: ["\u901f\u5ea6"] },
    { key: "hp", label: "\u751f\u547d", aliases: ["\u751f\u547d"] }
  ];
  function blankStatMods() {
    return { hp: 0, atk: 0, defense: 0, spa: 0, spd: 0, spe: 0 };
  }
  function mergeStatMods(...modsList) {
    const next = blankStatMods();
    modsList.forEach((mods) => {
      const normalized = blankStatMods();
      Object.keys(normalized).forEach((key) => { normalized[key] = Number(mods?.[key]) || 0; });
      Object.keys(next).forEach((key) => { next[key] += normalized[key]; });
    });
    return next;
  }
  function isAttackSkill(skill) {
    return skill && ["physical", "special", "attack"].includes(skill.category);
  }
  ${extractFunction("compactBattleText")}
  ${extractFunction("addStatMod")}
  ${extractFunction("statModsFromText")}
  ${extractFunction("passiveModLabels")}
  ${extractFunction("skillStatMods")}
  ${extractFunction("skillPowerEffectsFromText")}
  ${extractFunction("supportSkillEffectLabels")}
  ${extractFunction("supportSkillEffects")}
  ${extractFunction("normalizePvpCuteLayers")}
  ${extractFunction("setPvpAction")}
  ${extractFunction("selectPvpSkillAction")}
  ${extractFunction("applyPvpSupportSkill")}
  ${extractFunction("defenseReductionEffect")}
  this.supportSkillEffects = supportSkillEffects;
  this.selectPvpSkillAction = selectPvpSkillAction;
  this.applyPvpSupportSkill = applyPvpSupportSkill;
  this.defenseReductionEffect = defenseReductionEffect;
`, sandbox);

const waterShield = {
  name: "\u6c34\u6ce1\u76fe",
  category: "defense",
  description: "\u51cf\u4f2480%\uff0c\u5e94\u5bf9\u653b\u51fb\uff1a\u81ea\u5df1\u83b7\u5f97\u9b54\u653b+70%\u3002"
};
const shieldReduction = sandbox.defenseReductionEffect(waterShield);
assert(Math.abs(shieldReduction.multiplier - 0.2) < 1e-9, "Defense skills should parse compact 减伤80% as 20% incoming damage.");
assert(
  shieldReduction.labels.includes("\u6c34\u6ce1\u76fe\u51cf\u4f2480%"),
  "Defense skill damage reduction should produce a visible reduction label."
);
const defenderState = { skillStatMods: {}, manualDamageBonus: 0, manualPowerPercentBonus: 0, manualHitCountBonus: 0 };
assert(
  !sandbox.applyPvpSupportSkill(defenderState, waterShield),
  "Defense skills with response buffs should stay selectable as PVP actions instead of being consumed as support buffs."
);
assert(
  Math.abs(defenderState.skillStatMods.spa - 0.7) < 1e-9,
  "Defense skills should still apply their own magic-attack support buffs."
);
assert(
  /\u9b54\u653b\+70%/.test(defenderState.supportText),
  "Defense skill support text should show its parsed buff."
);
const selectedDefenseState = { action: "skill:0", forceImpact: false };
sandbox.selectPvpSkillAction(selectedDefenseState, 0, waterShield);
assert(
  selectedDefenseState.action === "skill:0",
  "Clicking an already selected defense skill should keep it as the active PVP action."
);

const featherBoost = {
  name: "\u7fbd\u5316\u52a0\u901f",
  category: "status",
  description: "\u81ea\u5df1\u83b7\u5f97\u5168\u6280\u80fd\u5a01\u529b+20\uff0c\u8fc5\u6377\u3002"
};
const featherEffects = sandbox.supportSkillEffects(featherBoost);
assert(featherEffects.manualDamageBonus === 20, "Support skills should parse 全技能威力+20 as flat skill power bonus.");
assert(featherEffects.labels.includes("\u6280\u80fd\u5a01\u529b+20"), "Support skill power bonus should produce a visible label.");

const pvpState = { skillStatMods: {}, manualDamageBonus: 0, manualPowerPercentBonus: 0, manualHitCountBonus: 0 };
assert(sandbox.applyPvpSupportSkill(pvpState, featherBoost), "Clicking a support skill with skill-power bonus should record the support effect.");
assert(pvpState.manualDamageBonus === 20, "Clicking 羽化加速 should add +20 to later skill power.");
assert(/\u6280\u80fd\u5a01\u529b\+20/.test(pvpState.supportText), "Recorded support text should show the skill-power bonus.");

console.log("PVP support and defense effect static checks passed.");
