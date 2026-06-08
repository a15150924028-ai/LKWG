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
  'const BWIKI_SUPPLEMENTAL_SKILL_PAGES = ["过山车"];',
  "BWiki update must explicitly include the supplemental 过山车 skill page."
);
assertIncludes(
  '"过山车": "https://patchwiki.biligame.com/images/rocom/2/2f/e6u2ebe4da2cyrcgh7m7sfj6z1jp4h4.png"',
  "The supplemental 过山车 skill must keep the BWiki skill icon URL."
);
assertIncludes(
  "const skillTitles = unique([...skillIndex.keys(), ...BWIKI_SUPPLEMENTAL_SKILL_PAGES]);",
  "BWiki skill fetch must include supplemental skill pages outside 技能图鉴."
);
assertIncludes(
  "image_url: indexEntry.image_url || firstBwikiImageUrl(page),",
  "Supplemental BWiki skills must use the page skill icon when the index has no icon."
);
assertIncludes(
  "rollerSkill.icon = absoluteUrl(rollerSkill.icon || rollerSkill.raw?.image_url || BWIKI_SUPPLEMENTAL_SKILL_IMAGE_URLS[rollerSkill.name]);",
  "The patched 过山车 fallback must keep the fetched BWiki icon when available."
);

console.log("Roller icon static checks passed.");
