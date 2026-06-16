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
assert(pageJs.includes("storage.loadTeam"));
assert(!pageWxml.includes('label="从队伍导入"'), "PVP ally team import must be merged into the monster selector.");
assert(!pageWxml.includes("teamPetOptions"), "PVP page must not render a separate team-pet selector.");
assert(!pageWxml.includes('label="本回合技能"'), "PVP page must use skill-card taps instead of a separate current-skill selector.");
assert(!pageJs.includes("onTeamPetChange("));
assert(!pageJs.includes("onActionChange("));
assert(!pageJs.includes("actionOptions"));
assert(!pageJs.includes("actionSelection"));
assert(pageWxml.includes("side.monsterOptions"));
assert(pageWxml.includes("side.skillCards"));
assert(pageWxml.includes("data-action-skill-id"));
assert(pageWxml.includes("side.forceImpact.label"));
assert(pageJs.includes("愿力冲击"));
assert(pageJs.includes("原力冲击"));
assert(!pickerWxml.includes("<input"), "PVP field-picker must be read-only");
assert(!pickerWxml.includes("suggestion-list"), "PVP field-picker must not inline suggestions");
assert(!pickerWxml.includes("<picker"), "PVP must not fall back to native picker");
assert(statGridWxml.includes("nature-up"));
assert(statGridWxml.includes("nature-down"));
assert(statGridWxml.includes("talent-mark"));

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
  "最肉", "最速", "最高攻击", "天气", "特性层数", "能量",
  "技能描述", "单段伤害", "总伤害", "清空本方"
]) {
  assert(pageWxml.includes(text), `PVP page is missing visible text: ${text}`);
}

assert(pageJs.includes("damageCore.calculateDamage"));
assert(pageJs.includes("damageRules.resolvePvpVariableDamage"));
assert(pageJs.includes("turn.resolveTurnOrder"));
assert(pageJs.includes("storage.savePvp"));

console.log("miniprogram PVP page static checks passed");
