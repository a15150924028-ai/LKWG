const fs = require("fs");
const path = require("path");

const htmlFile = fs.readdirSync(path.join(__dirname, ".."))
  .find((name) => name === "克制面查询.html");
const html = fs.readFileSync(path.join(__dirname, "..", htmlFile), "utf8");

function assertIncludes(needle, message) {
  if (!html.includes(needle)) {
    throw new Error(message);
  }
}

assertIncludes(
  'const LEGACY_ASSET_BASE = "https://rocomwiki.app";',
  "Legacy bundle image paths need a rocomwiki.app asset base."
);
assertIncludes(
  'if (/^\\/(?:creature-atlas|skill-icons)\\//.test(url)) return `${LEGACY_ASSET_BASE}${url}`;',
  "Legacy creature and skill image paths must resolve to rocomwiki.app, not BWiki."
);
assertIncludes(
  "function repairCachedImageUrl(url)",
  "Cached image URLs previously normalized to the wrong BWiki host need repair."
);
assertIncludes(
  "monster.icon = repairCachedImageUrl(monster.icon);",
  "Cached monster icons should be repaired during data application."
);
assertIncludes(
  "skill.icon = repairCachedImageUrl(skill.icon);",
  "Cached skill icons should be repaired during data application."
);

console.log("Legacy image URL static checks passed.");
