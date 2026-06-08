const fs = require("fs");
const path = require("path");

const htmlFile = fs.readdirSync(path.join(__dirname, ".."))
  .find((name) => name === "\u514b\u5236\u9762\u67e5\u8be2.html");
const html = fs.readFileSync(path.join(__dirname, "..", htmlFile), "utf8");

function assertIncludes(needle, message) {
  if (!html.includes(needle)) {
    throw new Error(message);
  }
}

function assertExcludes(needle, message) {
  if (html.includes(needle)) {
    throw new Error(message);
  }
}

assertIncludes(
  "window.LCX_LEGACY_SKILL_POOL_OVERRIDES = {",
  "The old local skill pool data should remain only as a legacy rollback backup."
);
assertExcludes(
  "window.LCX_SKILL_POOL_OVERRIDES = {",
  "The active local skill pool override export should be removed so website pools are authoritative by default."
);
assertIncludes(
  'const LOCAL_SKILL_POOL_ROLLBACK_KEY = "roco-world-use-local-skill-pool-overrides";',
  "The rollback flag should be stored under a clear localStorage key."
);
assertIncludes(
  "function shouldUseLocalSkillPoolRollback()",
  "Local skill pools should only be consulted through an explicit rollback gate."
);
assertIncludes(
  "if (!shouldUseLocalSkillPoolRollback()) return null;",
  "The default path should not return local skill pool overrides."
);
assertIncludes(
  "window.useLocalSkillPoolRollback = function useLocalSkillPoolRollback(enabled = true) {",
  "A browser-console rollback helper should exist for restoring the old local pools when needed."
);
assertIncludes(
  'localStorage.setItem(LOCAL_SKILL_POOL_ROLLBACK_KEY, "1");',
  "The rollback helper should be able to enable local skill pools."
);
assertIncludes(
  "localStorage.removeItem(LOCAL_SKILL_POOL_ROLLBACK_KEY);",
  "The rollback helper should be able to return to website skill pools."
);

console.log("Local skill pool rollback static checks passed.");
