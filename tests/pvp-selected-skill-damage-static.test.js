const fs = require("fs");
const path = require("path");
const vm = require("vm");

const htmlFile = fs.readdirSync(path.join(__dirname, ".."))
  .filter((name) => name.endsWith(".html"))
  .sort((a, b) => a.length - b.length)[0];
const html = fs.readFileSync(path.join(__dirname, "..", htmlFile), "utf8");

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`${name} is missing.`);
  const open = html.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < html.length; index += 1) {
    if (html[index] === "{") depth += 1;
    if (html[index] === "}") {
      depth -= 1;
      if (depth === 0) return html.slice(start, index + 1);
    }
  }
  throw new Error(`${name} source is incomplete.`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sandbox = {};
vm.runInNewContext(`
  const BWIKI_ELEMENT_TO_ELEMENT = {
    "\u706b": "fire"
  };
  const BWIKI_CATEGORY_TO_CATEGORY = {
    "\u7269\u653b": "physical",
    "\u9b54\u653b": "special",
    "\u653b\u51fb": "attack"
  };
  const decodeHtmlEntities = (value) => String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  const cleanWikiText = (value) => String(value || "").trim();
  function isAttackSkill(skill) {
    return skill && ["physical", "special", "attack"].includes(skill.category);
  }
  ${extractFunction("plainBwikiText")}
  ${extractFunction("inferRenderedSkillCategory")}
  ${extractFunction("parseBwikiRenderedSkillProfile")}
  ${extractFunction("applyBwikiRenderedSkillProfiles")}
  ${extractFunction("parseBwikiNumber")}
  ${extractFunction("repairCachedSkillCategory")}
  ${extractFunction("repairCachedSkillPower")}
  this.parseBwikiRenderedSkillProfile = parseBwikiRenderedSkillProfile;
  this.applyBwikiRenderedSkillProfiles = applyBwikiRenderedSkillProfiles;
  this.repairCachedSkillCategory = repairCachedSkillCategory;
  this.repairCachedSkillPower = repairCachedSkillPower;
`, sandbox);

const burnHtml = `
  <div>\u70bd\u4f24</div>
  <div>\u706b\u7cfb</div>
  <div>2</div><div>\u80fd\u8017</div>
  <div>\u653b\u51fb</div>
  <div>80</div><div>\u5a01\u529b</div>
  <div>\u5bf9\u654c\u65b9\u7cbe\u7075\u9020\u6210\u7269\u7406\u4f24\u5bb3\u3002</div>
  <div>\u6280\u80fd\u77f3\u6765\u6e90</div>
`;

const profile = sandbox.parseBwikiRenderedSkillProfile(burnHtml);
assert(profile.power === 80, "Rendered BWiki skill profiles must parse the current 威力 label.");

const bundle = {
  skills: [{
    id: "burn",
    name: "\u70bd\u4f24",
    name_aliases: [],
    element: "fire",
    pp: 2,
    category: "physical",
    power: 80,
    description: "wikitext power should not be erased"
  }]
};

const applied = sandbox.applyBwikiRenderedSkillProfiles(bundle, new Map([["\u70bd\u4f24", profile]]));
assert(applied.skills[0].power === 80, "PVP selected attack skills should keep numeric power after rendered profile application.");
assert(!html.includes('lines.indexOf("力威")'), "Rendered skill profile parsing should not depend only on the reversed 力威 label.");

const cachedBrokenSkill = {
  id: "burn",
  name: "\u70bd\u4f24",
  type: "fire",
  category: "physical",
  power: null,
  raw: {
    "\u5a01\u529b": "80",
    rendered_bwiki: true,
    rendered: { power: null }
  }
};
assert(
  sandbox.repairCachedSkillPower(cachedBrokenSkill) === 80,
  "Cached PVP attack skills with null power should recover power from raw BWiki fields."
);
assert(
  html.includes("skill.power = repairCachedSkillPower(skill);"),
  "Cached skill power repair should run during data application."
);
assert(
  html.includes('const BWIKI_RENDERED_PROFILE_CACHE_KEY = "roco-world-bwiki-rendered-profile-cache-v2";'),
  "Rendered profile cache key should invalidate v1 profiles that stored null attack power."
);

const nestedCachedBrokenSkill = {
  id: "silk",
  name: "\u7f20\u4e1d\u52b2",
  type: "fighting",
  category: "",
  power: null,
  description: "",
  raw: {
    category: "",
    power: null,
    rendered: { category: "attack", power: null, description: "\u9020\u6210\u7269\u4f24\uff0c2\u8fde\u51fb\u3002" },
    raw: {
      "\u6280\u80fd\u7c7b\u522b": "\u7269\u653b",
      "\u5a01\u529b": "25",
      "\u6548\u679c": "\u9020\u6210\u7269\u4f24\uff0c2\u8fde\u51fb\u3002"
    }
  }
};
nestedCachedBrokenSkill.category = sandbox.repairCachedSkillCategory(nestedCachedBrokenSkill);
assert(
  nestedCachedBrokenSkill.category === "physical",
  "Cached attack skills should recover canonical category from nested raw BWiki fields."
);
assert(
  sandbox.repairCachedSkillPower(nestedCachedBrokenSkill) === 25,
  "Cached attack skills should recover power from nested raw BWiki fields after category repair."
);
assert(
  html.includes("skill.category = repairCachedSkillCategory(skill);"),
  "Cached skill category repair should run during data application before power repair."
);
assert(
  html.includes("skillIndex: battleAction.pvpSkillIndex"),
  "PVP variable damage rules should receive the selected skill slot from the action."
);

console.log("PVP selected skill damage static checks passed.");
