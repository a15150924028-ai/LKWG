const fs = require("fs");
const path = require("path");

const htmlFiles = fs.readdirSync(path.join(__dirname, ".."))
  .filter((name) => name.endsWith(".html"))
  .sort((a, b) => a.length - b.length);
const mainHtml = fs.readFileSync(path.join(__dirname, "..", htmlFiles[0]), "utf8");
const simpleHtml = fs.readFileSync(path.join(__dirname, "..", htmlFiles[1]), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function scriptTail(html) {
  const index = html.indexOf("<script");
  if (index < 0) throw new Error("HTML script boundary is missing.");
  return html.slice(index);
}

assert(
  scriptTail(simpleHtml) === scriptTail(mainHtml),
  "The simplified HTML must reuse the main app script/data logic instead of carrying a stale fork."
);
assert(
  simpleHtml.includes("repairCachedSkillPower"),
  "The simplified HTML should include cached skill-power repair."
);
assert(
  simpleHtml.includes("applyBwikiRenderedSkillProfiles"),
  "The simplified HTML should include rendered BWiki skill profile application."
);
assert(
  simpleHtml.includes('const BWIKI_RENDERED_PROFILE_CACHE_KEY = "roco-world-bwiki-rendered-profile-cache-v2";'),
  "The simplified HTML should use the current rendered profile cache key."
);
assert(
  !simpleHtml.includes("LCX_SKILL_POOL_OVERRIDES") &&
    !simpleHtml.includes("S2_SKILL_OVERRIDES") &&
    !simpleHtml.includes("LATEST_MONSTER_STAT_OVERRIDES") &&
    !simpleHtml.includes("ensureArkRollerSkill"),
  "The simplified HTML should not retain removed local override and patch logic."
);

console.log("Simplified HTML sync static checks passed.");
