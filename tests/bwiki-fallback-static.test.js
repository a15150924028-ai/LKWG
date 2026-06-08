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
  'const LEGACY_DATA_URL = "https://rocomwiki.app/data/bundle.json";',
  "The update path needs an online fallback bundle when BWiki blocks API/JSONP requests."
);
assertIncludes(
  "async function fetchRemoteBundle()",
  "联网更新数据 should fetch through a BWiki-first remote bundle helper."
);
assertIncludes(
  "return fetchLegacyBundle(bwikiError);",
  "The remote bundle helper must fall back to the legacy online bundle when BWiki fails."
);
assertIncludes(
  "const bundle = await fetchRemoteBundle();",
  "updateDexData must use the resilient remote bundle helper instead of calling BWiki directly."
);
assertIncludes(
  "rollerSkill.icon = absoluteUrl(rollerSkill.icon || rollerSkill.raw?.image_url || BWIKI_SUPPLEMENTAL_SKILL_IMAGE_URLS[rollerSkill.name]);",
  "Existing 过山车 skills from fallback bundles must receive the BWiki icon URL."
);

console.log("BWiki fallback static checks passed.");
