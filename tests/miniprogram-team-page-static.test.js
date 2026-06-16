const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const packageRoot = path.join(root, "lkwgwechat");
const pageJs = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "pages", "team", "index.js"),
  "utf8"
);
const pageWxml = fs.readFileSync(
  path.join(packageRoot, "miniprogram", "pages", "team", "index.wxml"),
  "utf8"
);
const pageJson = JSON.parse(fs.readFileSync(
  path.join(packageRoot, "miniprogram", "pages", "team", "index.json"),
  "utf8"
));
assert.strictEqual(
  pageJson.usingComponents["field-picker"],
  "/components/field-picker/index"
);
assert.strictEqual(
  pageJson.usingComponents["floating-picker"],
  "/components/floating-picker/index"
);
assert(pageJs.includes("activeTeamIndex: 0"));
assert(pageJs.includes("selectTeamSlot("));
assert(pageWxml.includes('wx:for="{{teamOverview}}"'));
assert(pageWxml.includes('data-team-slot="{{slot.slot}}"'));
assert(pageWxml.includes("activePet"));
assert(!pageWxml.includes('wx:for="{{team}}"'));
assert(pageWxml.includes("<page-meta"));
assert(pageWxml.includes("pickerScrollLocked"));
assert(pageWxml.includes("overflow: hidden"));
assert.strictEqual(
  (pageWxml.match(/bind:open="onPickerOpen"/g) || []).length,
  (pageWxml.match(/<field-picker/g) || []).length,
  "every team field-picker must open the shared floating picker"
);
assert.strictEqual(
  (pageWxml.match(/data-picker-handler=/g) || []).length,
  (pageWxml.match(/<field-picker/g) || []).length,
  "every team field-picker must declare its selection handler"
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

for (const binding of [
  "selectTeamSlot",
  "onMonsterChange",
  "onBloodlineChange",
  "onNatureChange",
  "onTalentChange",
  "onSkillChange",
  "onRollerSkillChange",
  "rotateSkills",
  "undoRotation",
  "clearTeam"
]) {
  assert(
    pageJs.includes(`${binding}(`),
    `team page is missing ${binding}`
  );
}

assert(pageWxml.includes("配置完成"));
assert(pageWxml.includes("过山车目标"));
assert(pageWxml.includes("撤回过山车"));
assert(
  pageWxml.includes('src="/assets/roller-skill.png"'),
  "roller action must show the synchronized web icon"
);
assert(pageWxml.includes('class="roller-button-icon"'));
assert(pageJs.includes("catalog.getPassive"), "team view must resolve monster passives");
assert(pageJs.includes("catalog.getSkill"), "team view must resolve selected skill details");
assert(pageJs.includes("passives:"), "team view must expose passive details");
assert(pageJs.includes("skillDetails:"), "team view must expose selected skill details");
assert(pageWxml.includes("特性"), "team cards must show passive details");
assert(pageWxml.includes("技能说明"), "team cards must show selected skill details");
assert(
  pageWxml.includes("{{passive.description}}"),
  "team cards must render passive descriptions"
);
assert(
  pageWxml.includes("{{skillDetail.description}}"),
  "team cards must render selected skill descriptions"
);
assert(pageJs.includes("storage.saveTeam"));
assert(pageJs.includes("wx.showModal"));

console.log("miniprogram team page static checks passed");
