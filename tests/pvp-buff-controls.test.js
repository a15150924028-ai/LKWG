const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "克制面查询.html"), "utf8");

assert.match(html, /label:\s*"技能威力"/, "flat skill power buff should be labeled 技能威力");
assert.match(html, /label:\s*"技能威力（百分比）"/, "percent skill power buff should be present");
assert.match(html, /label:\s*"连击数增益"/, "manual hit-count buff should be present");
assert.match(html, />愿力冲击</, "force button should be renamed to 愿力冲击");
assert.doesNotMatch(html, />原力冲击</, "force button should no longer show 原力冲击");
assert.doesNotMatch(html, /usedSupportSkillIds\.includes/, "support skills should stack on every click");
assert.doesNotMatch(html, /不重复叠加/, "support skills should not show once-only copy");

console.log("pvp buff controls ok");
