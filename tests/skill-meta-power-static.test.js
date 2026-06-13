const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const start = html.indexOf("function renderSkillMeta(skill)");
const end = html.indexOf("\n    function renderTeam", start);
assert(start >= 0 && end > start, "renderSkillMeta must exist.");

const source = html.slice(start, end);
assert(source.includes('<span class="skill-meta-label">\u4f24\u5bb3</span>'), "Skill metadata must display a damage label.");
assert(source.includes("skillPowerValue(skill)"), "Skill metadata must display the selected skill power.");
assert(!source.includes("typeBadgeHtml(skill.type)"), "Skill metadata must not use the first cell for the skill type.");

const helperStart = html.indexOf("function skillPowerValue(skill)");
const helperEnd = html.indexOf("\n    function renderSkillMeta", helperStart);
assert(helperStart >= 0 && helperEnd > helperStart, "skillPowerValue must exist.");
const sandbox = {};
new Function(`${html.slice(helperStart, helperEnd)}; this.skillPowerValue = skillPowerValue;`).call(sandbox);
assert(sandbox.skillPowerValue({ power: 80 }) === 80, "Damaging skills must display their numeric damage.");
assert(sandbox.skillPowerValue({ power: 0 }) === "-", "Zero-power skills must display a single dash.");
assert(sandbox.skillPowerValue({ power: null }) === "-", "Skills without damage must display a single dash.");

console.log("Skill metadata power checks passed.");
