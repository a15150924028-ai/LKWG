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
  'const BWIKI_SUPPLEMENTAL_SKILL_PAGES = ["\u8fc7\u5c71\u8f66"];',
  "BWiki update must explicitly include the website \u8fc7\u5c71\u8f66 skill page."
);
assertIncludes(
  '"\u8fc7\u5c71\u8f66": "https://patchwiki.biligame.com/images/rocom/2/2f/e6u2ebe4da2cyrcgh7m7sfj6z1jp4h4.png"',
  "The supplemental \u8fc7\u5c71\u8f66 skill should keep the website icon URL."
);
assertIncludes(
  "const skillTitles = unique([...skillIndex.keys(), ...BWIKI_SUPPLEMENTAL_SKILL_PAGES]);",
  "BWiki skill fetch should include supplemental website skill pages outside \u6280\u80fd\u56fe\u9274."
);
assertIncludes(
  "image_url: indexEntry.image_url || firstBwikiImageUrl(page),",
  "Supplemental BWiki skills should use the page skill icon when the index has no icon."
);
assertExcludes(
  "function ensureArkRollerSkill(",
  "\u8fc7\u5c71\u8f66 should come from website data, not from a local skill/pool patch function."
);
assertExcludes(
  "patched-roller-coaster",
  "The old local patched \u8fc7\u5c71\u8f66 skill id should be removed."
);
assertExcludes(
  "ARK_ROLLER_MONSTER_RE",
  "\u673a\u5e55\u65b9\u821f/\u79ef\u6728\u65b9\u821f should not receive a forced local \u8fc7\u5c71\u8f66 pool patch."
);

console.log("Roller icon static checks passed.");
