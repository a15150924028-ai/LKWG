const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function assertIncludes(needle, message) {
  if (!html.includes(needle)) throw new Error(message);
}

function assertExcludes(needle, message) {
  if (html.includes(needle)) throw new Error(message);
}

assertExcludes(
  "LCX_LEGACY_SKILL_POOL_OVERRIDES",
  "The legacy local skill-pool override data should be removed."
);
assertExcludes(
  "LOCAL_SKILL_POOL_ROLLBACK_KEY",
  "The legacy local skill-pool rollback localStorage key should be removed."
);
assertExcludes(
  "useLocalSkillPoolRollback",
  "The legacy local skill-pool rollback helper should be removed."
);
assertExcludes(
  "applyLocalSkillPoolOverrides",
  "Dex data should no longer be overridden by local skill-pool data."
);
assertExcludes(
  "local_skill_pool_override",
  "Monster raw data should no longer be marked with local skill-pool overrides."
);
assertIncludes(
  "dexData = nextData;",
  "applyDexData should apply normalized local package data directly."
);

console.log("No local skill-pool rollback static checks passed.");
