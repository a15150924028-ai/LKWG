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
  "最肉", "最速", "最高攻击", "特性层数",
  "技能描述", "清空本方"
]) {
  assert(pageWxml.includes(text), `PVP page is missing visible text: ${text}`);
}
assert(pageJs.includes('label: "能量"'), "Energy must still be available as a compact control item.");

assert(pageJs.includes("damageCore.calculateDamage"));
assert(pageJs.includes("damageRules.resolvePvpVariableDamage"));
assert(pageJs.includes("turn.resolveTurnOrder"));
assert(pageJs.includes("storage.savePvp"));

console.log("miniprogram PVP page static checks passed");
