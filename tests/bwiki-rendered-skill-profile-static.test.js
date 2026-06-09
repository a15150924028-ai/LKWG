const fs = require("fs");
const path = require("path");
const vm = require("vm");

const htmlFile = fs.readdirSync(path.join(__dirname, ".."))
  .find((name) => name === "\u514b\u5236\u9762\u67e5\u8be2.html");
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
  const unique = (values) => [...new Set(values.filter(Boolean))];
  const BWIKI_ELEMENT_TO_ELEMENT = {
    "\u6c34": "water",
    "\u673a\u68b0": "steel"
  };
  const BWIKI_CATEGORY_TO_CATEGORY = {
    "\u7269\u653b": "physical",
    "\u9b54\u653b": "special",
    "\u9632\u5fa1": "defense",
    "\u72b6\u6001": "status",
    "\u653b\u51fb": "attack"
  };
  const decodeHtmlEntities = (value) => String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  ${extractFunction("plainBwikiText")}
  ${extractFunction("inferRenderedSkillCategory")}
  ${extractFunction("parseBwikiRenderedSkillProfile")}
  ${extractFunction("applyBwikiRenderedSkillProfiles")}
  this.parseBwikiRenderedSkillProfile = parseBwikiRenderedSkillProfile;
  this.applyBwikiRenderedSkillProfiles = applyBwikiRenderedSkillProfiles;
`, sandbox);

const tideHtml = `
  <div>\u6f6e\u6d8c</div>
  <div>\u6c34\u7cfb</div>
  <div>2</div><div>\u80fd\u8017</div>
  <div>\u653b\u51fb</div>
  <div>80</div><div>\u529b\u5a01</div>
  <div>\u5bf9\u654c\u65b9\u7cbe\u7075\u9020\u6210\u7269\u7406\u4f24\u5bb3\u3002</div>
  <div>\u6280\u80fd\u77f3\u6765\u6e90</div>
`;
const tide = sandbox.parseBwikiRenderedSkillProfile(tideHtml);
assert(tide.element === "water", "Rendered BWiki skill profile should parse the skill element.");
assert(tide.pp === 2, "Rendered BWiki skill profile should parse energy cost.");
assert(tide.category === "physical", "Rendered BWiki attack skills should infer physical category from rendered description.");
assert(tide.power === 80, "Rendered BWiki skill profile should parse power.");
assert(tide.description === "\u5bf9\u654c\u65b9\u7cbe\u7075\u9020\u6210\u7269\u7406\u4f24\u5bb3\u3002", "Rendered BWiki skill profile should parse effect text.");

const rollerHtml = `
  <div>\u8fc7\u5c71\u8f66</div>
  <div>\u673a\u68b0\u7cfb</div>
  <div>8</div><div>\u80fd\u8017</div>
  <div>\u72b6\u6001</div>
  <div>\u4f7f\u5df1\u65b9\u961f\u4f0d\u4e2d\u7684\u6240\u6709\u7cbe\u7075\u643a\u5e26\u7684\u6280\u80fd\u8de8\u7cbe\u7075\u5411\u4e0b\u79fb\u52a81\u4e2a\u4f4d\u7f6e\uff0c\u5de7\u53d8\uff1a\u673a\u68b0\u7cfb\u6280\u80fd\u3002</div>
  <div>\u8bf7\u5168\u4f53\u7cbe\u7075\u6293\u597d\u6276\u624b\u3002</div>
  <div>MediaWiki:TabJS</div>
`;
const roller = sandbox.parseBwikiRenderedSkillProfile(rollerHtml);
assert(roller.element === "steel", "Rendered BWiki status skill profile should parse mechanical element.");
assert(roller.pp === 8, "Rendered BWiki status skill profile should parse energy cost.");
assert(roller.category === "status", "Rendered BWiki status skill profile should parse status category.");
assert(roller.power === null, "Rendered BWiki status skill profile should keep empty power as null.");
assert(roller.description.includes("\u6280\u80fd\u8de8\u7cbe\u7075\u5411\u4e0b\u79fb\u52a8"), "Rendered BWiki status skill profile should parse effect text.");

const bundle = {
  skills: [
    {
      id: "tide",
      name: "\u6f6e\u6d8c",
      name_aliases: [],
      element: "water",
      pp: 3,
      category: "special",
      power: 40,
      description: "stale wikitext"
    }
  ]
};
const applied = sandbox.applyBwikiRenderedSkillProfiles(bundle, new Map([["\u6f6e\u6d8c", tide]]));
assert(applied.skills[0].pp === 2, "Rendered BWiki skill profile should replace stale wikitext energy cost.");
assert(applied.skills[0].category === "physical", "Rendered BWiki skill profile should replace stale wikitext category.");
assert(applied.skills[0].power === 80, "Rendered BWiki skill profile should replace stale wikitext power.");
assert(applied.skills[0].description.includes("\u9020\u6210\u7269\u7406\u4f24\u5bb3"), "Rendered BWiki skill profile should replace stale wikitext description.");
assert(bundle.skills[0].pp === 3, "Rendered BWiki skill profile application should not mutate the original bundle.");

assert(html.includes("fetchBwikiRenderedSkillProfileMap(skillTitles)"), "BWiki bundle parsing should fetch rendered skill profiles.");
assert(html.includes("applyBwikiRenderedSkillProfiles({"), "BWiki bundle parsing should apply rendered skill profiles.");
assert(!html.includes("S2_SKILL_OVERRIDES"), "Rendered BWiki skill profiles should replace the local skill override pool.");
assert(!html.includes("applyS2SkillOverride"), "Rendered BWiki skill profiles should not be replaced by a local skill override pass.");

console.log("BWiki rendered skill profile static checks passed.");
