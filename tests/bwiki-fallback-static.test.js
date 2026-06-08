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
  'const LEGACY_DATA_URL = "https://rocomwiki.app/data/bundle.json";',
  "The update path needs an online fallback bundle when BWiki blocks API/JSONP requests."
);
assertIncludes(
  "async function fetchRemoteBundle()",
  "\u8054\u7f51\u66f4\u65b0\u6570\u636e should fetch through a BWiki-first remote bundle helper."
);
assertIncludes(
  "return fetchLegacyBundle(bwikiError);",
  "The remote bundle helper must fall back to the legacy online bundle when BWiki fails."
);
assertIncludes(
  "const bundle = await fetchRemoteBundle();",
  "updateDexData must use the resilient remote bundle helper instead of calling BWiki directly."
);
assertExcludes(
  "function ensureArkRollerSkill(",
  "The fallback path should use website skill pools without the old local \u8fc7\u5c71\u8f66 patch."
);

console.log("BWiki fallback static checks passed.");
