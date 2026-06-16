const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const packageRoot = path.join(root, "lkwgwechat");
const pageJs = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "pages", "pvp", "index.js"),
  "utf8"
);
const pageWxml = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "pages", "pvp", "index.wxml"),
  "utf8"
);
const pageJson = JSON.parse(fs.readFileSync(
  path.join(packageRoot, "miniprogram", "pages", "pvp", "index.json"),
  "utf8"
));
const statGridWxml = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "components", "stat-grid", "index.wxml"),
  "utf8"
);
const pickerWxml = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "components", "field-picker", "index.wxml"),
  "utf8"
);
const pageWxss = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "pages", "pvp", "index.wxss"),
  "utf8"
);
const buildRulesJs = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "domain", "generated", "build-rules.js"),
  "utf8"
);

assert.strictEqual(
  pageJson.usingComponents["field-picker"],
  "/components/field-picker/index"
);
assert.strictEqual(
  pageJson.usingComponents["floating-picker"],
  "/components/floating-picker/index"
);
assert.strictEqual(
  pageJson.usingComponents["stat-grid"],
  "/components/stat-grid/index"
);
assert.strictEqual(
  (pageWxml.match(/<field-picker/g) || []).length,
  5,
  "PVP must keep only the compact selector templates: monster/team, bloodline, nature, talents, and skill picker"
);
assert(pageWxml.includes("<page-meta"));
assert(pageWxml.includes("pickerScrollLocked"));
assert(pageWxml.includes("overflow: hidden"));
assert.strictEqual(
  (pageWxml.match(/bind:open="onPickerOpen"/g) || []).length,
  (pageWxml.match(/<field-picker/g) || []).length,
  "every PVP field-picker must open the shared floating picker"
);
assert.strictEqual(
  (pageWxml.match(/data-picker-handler=/g) || []).length,
  (pageWxml.match(/<field-picker/g) || []).length,
  "every PVP field-picker must declare its selection handler"
);
assert.strictEqual((pageWxml.match(/<floating-picker/g) || []).length, 1);
assert(pageWxml.includes('bind:select="onFloatingPickerSelect"'));
assert(pageWxml.includes('bind:close="onFloatingPickerClose"'));
assert(pageJs.includes("pickerScrollLocked: false"));
assert(pageJs.includes("floatingPicker:"));
assert(pageJs.includes("onPickerOpen("));
assert(pageJs.includes("onFloatingPickerSelect("));
assert(pageJs.includes("onFloatingPickerClose("));
assert(pageJs.includes("pickerHandler"));
assert(pageJs.includes("allyMonsterOptions"));
assert(pageJs.includes("buildMergedMonsterOptions("));
assert(pageJs.includes("source: \"team\""));
assert(pageJs.includes("forceImpactSkill("));
assert(pageJs.includes("forceImpactOption("));
assert(pageJs.includes("onSkillActionTap("));
assert(pageJs.includes("showTraitLayers"));
assert(pageJs.includes("resultTitle"));
assert(pageJs.includes("resultMeta"));
assert(pageJs.includes("responseVariants"));
assert(pageJs.includes("weatherClass"));
assert(pageJs.includes("icon: \"/assets/type-icons/water.png\""));
assert(pageJs.indexOf('key: "hitCount"') < pageJs.indexOf('key: "energy"'), "Energy must be placed after hit count in the compact control grid.");
assert(pageJs.includes("storage.loadTeam"));
assert(!pageWxml.includes('label="从队伍导入"'), "PVP ally team import must be merged into the monster selector.");
assert(!pageWxml.includes("teamPetOptions"), "PVP page must not render a separate team-pet selector.");
assert(!pageWxml.includes('label="本回合技能"'), "PVP page must use skill-card taps instead of a separate current-skill selector.");
assert(!pageWxml.includes("设为本回合"), "Skill cards must not show a separate current-turn button label.");
assert(!pageWxml.includes("本回合"), "Skill cards and Force Impact must use visual selection without current-turn text.");
assert(!pageWxml.includes("side.forceImpact.hint"), "Force Impact must not render secondary helper text below the button.");
assert(!pageWxml.includes('<text class="section-title">天气</text>'), "Weather card must not render the weather section title.");
assert(!pageJs.includes("onTeamPetChange("));
assert(!pageJs.includes("onActionChange("));
assert(!pageJs.includes("actionOptions"));
assert(!pageJs.includes("actionSelection"));
assert(pageWxml.includes("side.monsterOptions"));
assert(pageWxml.includes("side.skillCards"));
assert(pageWxml.includes("skill-action-grid"));
assert(pageWxml.includes("data-action-skill-id"));
assert(pageWxml.includes("force-action-row"));
assert(pageWxml.includes('open-on-tap="{{!skillCard.skillId}}"'));
assert(pageWxml.includes('show-edit-trigger="{{!!skillCard.skillId}}"'));
assert(pageWxml.includes("wx:if=\"{{side.showTraitLayers}}\""));
assert(pageWxml.includes("weatherItem.icon"));
assert(pageWxml.includes("{{weatherItem.weatherClass}}"));
assert(pageWxml.includes("side.forceImpact.label"));
assert(pageWxml.includes("side.result.resultTitle"));
assert(pageWxml.includes("side.result.resultMeta"));
assert(pageWxml.includes("side.result.responseVariants"));
assert(!pageWxml.includes('<text class="counter-label">能量</text>'), "Energy must move into the compact control grid instead of its own row.");
assert(!pageWxml.includes("damage-grid"), "PVP result must use the compact line-style result instead of the large metric grid.");
for (const removedResultLabel of ["计算模式", "最终威力", "连击数", "单段伤害", "总伤害"]) {
  assert(!pageWxml.includes(removedResultLabel), `PVP result must not render large-card label: ${removedResultLabel}`);
}
assert(pageJs.includes("愿力冲击"));
assert(pageJs.includes("原力冲击"));
assert(!pickerWxml.includes("<input"), "PVP field-picker must be read-only");
assert(!pickerWxml.includes("suggestion-list"), "PVP field-picker must not inline suggestions");
assert(!pickerWxml.includes("<picker"), "PVP must not fall back to native picker");
assert(pickerWxml.includes("field-label-chip"), "PVP selectors must use embedded border labels to reduce height.");
assert(pickerWxml.includes("field-frame"), "PVP selectors must render the compact inner frame.");
assert(statGridWxml.includes("nature-up"));
assert(statGridWxml.includes("nature-down"));
assert(statGridWxml.includes("talent-mark"));
assert(statGridWxml.includes("stat-inline-row"), "Stat labels and values must share one inline row to reduce vertical height.");
assert(pageWxss.includes(".force-action-row"), "Force Impact must occupy its own full-width row in the skill grid.");
assert(pageWxss.includes("grid-column: 1 / -1"), "Force Impact row must span the full grid width.");
assert(pageWxss.includes("justify-content: center"), "Force Impact row should center its content inside the full-width bar.");
assert(pageWxss.includes("white-space: nowrap"), "Force Impact row text must stay on one line.");
assert(pageWxss.includes("width: 100%"), "Force Impact row should stretch full width instead of staying as a centered narrow button.");
assert(pageWxss.includes(".default-note"));
assert(pageWxss.includes("color: #d92d20"), "Default build note should be highlighted in red.");
assert(pageWxss.includes(".preset-button"), "Enemy preset buttons must keep dedicated styling.");
assert(pageWxml.includes("preset-button-label"), "Enemy preset buttons should render an explicit label wrapper for reliable centering.");
assert(!pageWxml.includes("preset-hidden-labels"), "Enemy preset labels should come from the real segmented control, not hidden fallback text.");
assert(pageWxss.includes(".preset-button-label"), "Enemy preset buttons should style the inner label wrapper directly.");
assert(pageWxss.includes("border-radius: 999rpx"), "Enemy preset buttons should use full pill corners instead of small rounded corners.");
assert(pageWxss.includes("width: 100%"), "Enemy preset buttons should stretch to fill their grid cells.");
assert(pageWxss.includes("height: 58rpx"), "Enemy preset buttons should keep a fixed height for stable centering.");
assert(pageWxss.includes("display: flex"), "Enemy preset buttons should use flex centering instead of relying on native button text layout.");
assert(pageWxss.includes("justify-content: center"), "Enemy preset buttons should center content horizontally.");
assert(pageWxss.includes("align-items: center"), "Enemy preset buttons should center content vertically.");
assert(pageWxss.includes("min-height: 58rpx"), "Enemy preset buttons should keep stable button height.");
assert(pageJs.includes("未应对成功"));
assert(pageJs.includes("应对成功"));

for (const handler of [
  "onMonsterChange",
  "onBloodlineChange",
  "onNatureChange",
  "onTalentChange",
  "onSkillChange",
  "onSkillActionTap",
  "selectPreset",
  "selectWeather",
  "adjustValue",
  "clearSide"
]) {
  assert(pageJs.includes(`${handler}(`), `PVP page is missing ${handler}`);
}

for (const text of [
  "\u7279\u6027\u5c42\u6570",
  "\u6280\u80fd\u63cf\u8ff0", "\u6e05\u7a7a\u672c\u65b9"
]) {
  assert(pageWxml.includes(text), `PVP page is missing visible text: ${text}`);
}
for (const presetLabel of ["\u6700\u8089", "\u6700\u901f", "\u6700\u9ad8\u653b\u51fb"]) {
  assert(buildRulesJs.includes(presetLabel), `PVP preset label is missing from build rules: ${presetLabel}`);
}
assert(pageJs.includes('label: "能量"'), "Energy must still be available as a compact control item.");

assert(pageJs.includes("damageCore.calculateDamage"));
assert(pageJs.includes("damageRules.resolvePvpVariableDamage"));
assert(pageJs.includes("turn.resolveTurnOrder"));
assert(pageJs.includes("storage.savePvp"));
assert(
  pageJs.includes("const attackerBaseStats = damageStatValues(attacker, attackerState, attackerTrait);"),
  "PVP damage must keep an unboosted base stat snapshot for formula attack/defense inputs."
);
assert(
  pageJs.includes("const attackerStats = damageStatValues(attacker, attackerState, attackerTrait, attackerMods);"),
  "PVP variable damage and turn order may use the fully boosted battle stats."
);
assert(
  pageJs.includes("damageMode(action, attackerBaseStats, defenderBaseStats)"),
  "PVP damage mode must match the web path and choose physical/special from base battle stats."
);
assert(
  pageJs.includes("attackerState.skillStatMods") && pageJs.includes("defenderState.skillStatMods"),
  "PVP ability-level calculation must include settled skill stat changes, not only manual changes."
);
assert(
  pageJs.includes("attack: attackerBaseStats[attackKey]") && pageJs.includes("defense: defenderBaseStats[defenseKey]"),
  "PVP core damage attack/defense inputs must use base battle stats so passive percentage boosts are not double-counted."
);

const catalog = require(path.join(packageRoot, "miniprogram", "data", "catalog.js"));
const pvpState = require(path.join(packageRoot, "miniprogram", "domain", "pvp-state.js"));

let capturedPage = null;
global.Page = (config) => {
  capturedPage = config;
};
global.wx = {
  getStorageSync() { return null; },
  setStorageSync() {},
  removeStorageSync() {}
};
delete require.cache[require.resolve(path.join(packageRoot, "miniprogram", "pages", "pvp", "index.js"))];
require(path.join(packageRoot, "miniprogram", "pages", "pvp", "index.js"));
assert(capturedPage, "PVP page config must be loadable in the static harness");

const pageInstance = {
  ...capturedPage,
  data: JSON.parse(JSON.stringify(capturedPage.data)),
  setData(update) {
    this.data = { ...this.data, ...update };
  }
};
const speedDog = catalog.bundle.monsters.find((monster) => monster.name === "音速犬");
const burn = catalog.bundle.skills.find((skill) => skill.name === "灼伤");
assert(speedDog && burn, "音速犬 and 灼伤 fixtures must exist");
const dogSide = (side) => ({
  ...pvpState.defaultSide(side),
  monsterId: speedDog.id,
  natureId: "nature-jolly",
  talentIds: ["talent-hp", "talent-atk", "talent-spe"],
  traitLayers: 10,
  skillIds: [burn.id, "", "", ""],
  action: burn.id
});
pageInstance.applyState({
  ...pvpState.defaultPvpState(),
  ally: dogSide("ally"),
  enemy: dogSide("enemy")
}, false);
assert.strictEqual(
  pageInstance.data.sides[0].result.damage,
  370,
  "Mini Program PVP should match web damage for 开朗生命/物攻/速度 音速犬 灼伤 mirror matchup."
);

console.log("miniprogram PVP page static checks passed");
