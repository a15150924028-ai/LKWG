const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const pageJs = fs.readFileSync(
  path.join(root, "miniprogram", "pages", "team", "index.js"),
  "utf8"
);
const pageWxml = fs.readFileSync(
  path.join(root, "miniprogram", "pages", "team", "index.wxml"),
  "utf8"
);
const pageJson = JSON.parse(fs.readFileSync(
  path.join(root, "miniprogram", "pages", "team", "index.json"),
  "utf8"
));
const pickerWxml = fs.readFileSync(
  path.join(root, "miniprogram", "components", "field-picker", "index.wxml"),
  "utf8"
);

assert.strictEqual(
  pageJson.usingComponents["field-picker"],
  "/components/field-picker/index"
);
assert(pickerWxml.includes("<picker"), "field picker must use native picker");
assert(pageWxml.includes('wx:for="{{team}}"'), "team page must render all six slots");

for (const binding of [
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
assert(pageJs.includes("storage.saveTeam"));
assert(pageJs.includes("wx.showModal"));

console.log("miniprogram team page static checks passed");
