const fs = require("fs");
const path = require("path");

const htmlFile = fs.readdirSync(path.join(__dirname, ".."))
  .find((name) => name === "\u514b\u5236\u9762\u67e5\u8be2.html");
const html = fs.readFileSync(path.join(__dirname, "..", htmlFile), "utf8");

function assertIncludes(needle, message) {
  if (!html.includes(needle)) throw new Error(message);
}

function assertExcludes(needle, message) {
  if (html.includes(needle)) throw new Error(message);
}

assertExcludes(
  "LEGACY_DATA_URL",
  "Online update should not use the incorrect legacy JSON bundle source."
);
assertExcludes(
  "fetchLegacyBundle",
  "Online update should not fall back to the incorrect legacy JSON bundle."
);
assertIncludes(
  "return await fetchBwikiBundle();",
  "fetchRemoteBundle should generate the local cache from BWiki only."
);
assertExcludes(
  "return fetchLegacyBundle(bwikiError);",
  "BWiki failures should leave the app on the existing local cache or built-in sample, not overwrite with legacy JSON."
);
assertIncludes(
  'dataStatus.textContent = "\u6b63\u5728\u8054\u7f51\u66f4\u65b0\u7cbe\u7075\u3001\u7279\u6027\u3001\u7cbe\u7075\u6280\u80fd\u6c60\u548c\u6280\u80fd\u6570\u503c\uff08BWiki\uff09...";',
  "The update status should describe the BWiki-only source."
);
assertIncludes(
  'throw new Error(`BWiki ${title} \u6280\u80fd\u5b66\u4e60\u7cbe\u7075\u89e3\u6790\u4e3a\u7a7a`);',
  "Required BWiki skill learner pages should fail the update instead of silently generating incomplete pools."
);
assertExcludes(
  "\u5907\u7528\u6e90",
  "User-facing update copy should not mention the removed legacy fallback source."
);
assertExcludes(
  "rocomwiki.app/data/bundle.json",
  "The incorrect legacy JSON bundle URL should be removed from the app code."
);

console.log("BWiki-only update static checks passed.");
