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

assert(!html.includes("function mergeWebsiteSkillPools("), "Website fallback pools should not be merged wholesale into BWiki pools.");
assert(!html.includes("return mergeWebsiteSkillPools(bwikiBundle, legacyBundle);"), "BWiki success should not union all fallback skill pools.");

const sandbox = {};
vm.runInNewContext(`
  const unique = (values) => [...new Set(values.filter(Boolean))];
  const decodeHtmlEntities = (value) => String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  ${extractFunction("plainBwikiText")}
  ${extractFunction("parseBwikiRenderedMonsterSkillNames")}
  ${extractFunction("applyBwikiRenderedMonsterSkills")}
  ${extractFunction("parseBwikiSkillLearnerNames")}
  ${extractFunction("applyBwikiSkillLearners")}
  this.plainBwikiText = plainBwikiText;
  this.parseBwikiRenderedMonsterSkillNames = parseBwikiRenderedMonsterSkillNames;
  this.applyBwikiRenderedMonsterSkills = applyBwikiRenderedMonsterSkills;
  this.parseBwikiSkillLearnerNames = parseBwikiSkillLearnerNames;
  this.applyBwikiSkillLearners = applyBwikiSkillLearners;
`, sandbox);

const hiddenTermsHtml = `
  <div>MediaWiki:TabJS</div>
  <div>\u9ed8\u8ba4\uff086\uff09</div><div>\u8840\u8109\uff080\uff09</div><div>\u6280\u80fd\u77f3\uff085\uff09</div>
  <span>NO.085</span><a>\u5c0f\u591c</a><span>\u6076</span><span>Lv.46</span>
  <span>NO.086</span><a>\u7d2b\u591c</a>
  <span>NO.087</span><a>\u6714\u591c\u4f0a\u8299</a>
  <span>NO.293</span><a>\u5c0f\u5e15\u5c14</a><span>\u6076</span><span>Lv.34</span>
  <span>NO.294</span><a>\u5e15\u5c14\u8428\u65af</a>
  <span>NO.295</span><a>\u9f99\u606f\u5e15\u5c14</a>
  <span>NO.015</span><a>\u9525\u5c3e\u7f8a</a><span>\u5e7d</span>
  <span>NO.016</span><a>\u94c3\u5170\u7f8a</a>
  <span>NO.017</span><a>\u82b1\u5f71\u7f9a\u7f8a</a>
  <span>NO.323</span><a>\u55dc\u5149\u55e1\u55e1</a><span>\u6076</span><span>\u5149</span>
  <span>NO.324</span><a>\u7a83\u5149\u868a</a>
`;

const hiddenTermsLearners = sandbox.parseBwikiSkillLearnerNames(hiddenTermsHtml);
assert(hiddenTermsLearners.length === 11, "BWiki skill page learner parsing should return the 11 listed learners.");
assert(hiddenTermsLearners.includes("\u6714\u591c\u4f0a\u8299"), "BWiki learner parsing should include default learners.");
assert(hiddenTermsLearners.includes("\u7a83\u5149\u868a"), "BWiki learner parsing should include skill-stone learners.");
assert(!hiddenTermsLearners.includes("\u67f4\u6e23\u866b"), "BWiki learner parsing should not import fallback-only learners.");
assert(!hiddenTermsLearners.includes("\u7c89\u7c89\u661f"), "BWiki learner parsing should not import unrelated fallback learners.");

const arkRenderedHtml = `
  <div>\u89e3\u9501\uff1a[\u6280\u80fd\u77f3]</div>
  <div>\u94c1\u84ba\u85dc</div><div>&#215;</div><div>\u94c1\u84ba\u85dc</div><div>\u8017\u80fd</div>
  <div>\u89e3\u9501\uff1a[\u6280\u80fd\u77f3]</div>
  <div>\u94c1\u84ba\u85dc</div><div>\u8fc7\u5c71\u8f66</div><div>\u8017\u80fd</div>
  <div>\u89e3\u9501\uff1a\uff08\u4f20\u8bf4\uff09\u5408\u4f53\uff1a\u673a\u5e55\u65b9\u821f</div>
  <div>&#215;</div><div>\u8fc7\u5c71\u8f66</div><div>\u8017\u80fd</div>
`;
const arkRenderedSkills = sandbox.parseBwikiRenderedMonsterSkillNames(arkRenderedHtml);
assert(arkRenderedSkills.includes("\u8fc7\u5c71\u8f66"), "Rendered BWiki monster skill cards should add \u8fc7\u5c71\u8f66.");
assert(arkRenderedSkills.includes("\u94c1\u84ba\u85dc"), "Rendered BWiki monster skill cards should keep normal skill-stone skills.");

const bundle = {
  monsters: [
    { id: "ark", name: "\u673a\u5e55\u65b9\u821f", name_aliases: ["\u673a\u5893\u65b9\u821f"], skills: [] }
  ],
  skills: [
    { id: "roller", name: "\u8fc7\u5c71\u8f66", name_aliases: [] }
  ]
};
const applied = sandbox.applyBwikiSkillLearners(bundle, new Map([["\u8fc7\u5c71\u8f66", ["\u673a\u5e55\u65b9\u821f"]]]));
assert(applied.monsters[0].skills.includes("roller"), "BWiki skill learner pages should add their listed skill to matching monster pools.");
assert(bundle.monsters[0].skills.length === 0, "BWiki learner application should not mutate the original bundle.");

const renderedApplied = sandbox.applyBwikiRenderedMonsterSkills(bundle, new Map([["\u673a\u5e55\u65b9\u821f", ["\u8fc7\u5c71\u8f66"]]]));
assert(renderedApplied.monsters[0].skills.includes("roller"), "BWiki rendered monster skill cards should add their listed skills to matching monster pools.");

assert(html.includes("applyBwikiRenderedMonsterProfiles({"), "BWiki bundle parsing should apply rendered monster profile data, including skill cards.");
assert(html.includes("applyBwikiSkillLearners({"), "BWiki bundle parsing should apply skill-page learner relationships.");

console.log("BWiki skill learner static checks passed.");
