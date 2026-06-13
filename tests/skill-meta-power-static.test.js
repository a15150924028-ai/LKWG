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
assert(source.includes('<span class="skill-meta-label">威力</span>'), "Skill metadata must display a power label.");
assert(source.includes("skillPowerValue(skill)"), "Skill metadata must display the selected skill power.");
assert(!source.includes("typeBadgeHtml(skill.type)"), "Skill metadata must not use the first cell for the skill type.");

console.log("Skill metadata power checks passed.");
