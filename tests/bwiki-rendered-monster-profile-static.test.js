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
  const normalizeSearchText = (value) => String(value || "").trim();
  const unique = (values) => [...new Set(values.filter(Boolean))];
  const decodeHtmlEntities = (value) => String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  function bwikiId(prefix, value) {
    const normalized = normalizeSearchText(value);
    return normalized ? \`bwiki-\${prefix}-\${normalized}\` : \`bwiki-\${prefix}-empty\`;
  }
  ${extractFunction("plainBwikiText")}
  ${extractFunction("parseBwikiRenderedMonsterSkillNames")}
  ${extractFunction("applyBwikiRenderedMonsterSkills")}
  ${extractFunction("parseBwikiRenderedMonsterProfile")}
  ${extractFunction("applyBwikiRenderedMonsterProfiles")}
  this.parseBwikiRenderedMonsterProfile = parseBwikiRenderedMonsterProfile;
  this.applyBwikiRenderedMonsterProfiles = applyBwikiRenderedMonsterProfiles;
`, sandbox);

const dragonfishHtml = `
  <section>
    <div>\u79cd\u65cf\u8d44\u8d28</div><div>640</div>
    <div>\u751f\u547d</div><div>:</div><div>89</div>
    <div>\u7269\u653b</div><div>:</div><div>103</div>
    <div>\u9b54\u653b</div><div>:</div><div>109</div>
    <div>\u7269\u9632</div><div>:</div><div>100</div>
    <div>\u9b54\u9632</div><div>:</div><div>104</div>
    <div>\u901f\u5ea6</div><div>:</div><div>135</div>
    <div>\u7279\u6027</div><div>\u7279\u6027</div>
    <div>\u6d04\u6e38</div>
    <div>\u6bcf\u6b21\u8fdb\u5165\u84c4\u529b\u72b6\u6001\uff0c\u83b7\u5f97\u5168\u6280\u80fd\u80fd\u8017\u6c38\u4e45-2\u3002</div>
    <div>\u6297\u51fb\u4f24\u5bb3\u500d\u7387</div>
    <div>\u89e3\u9501\uff1a\uff08\u9ed8\u8ba4\uff09Lv.1</div><div>\u6f6e\u6d8c</div><div>\u8017\u80fd</div>
  </section>
`;

const profile = sandbox.parseBwikiRenderedMonsterProfile(dragonfishHtml);
assert(profile.passive.name === "\u6d04\u6e38", "Rendered BWiki monster profile should parse the passive name.");
assert(
  profile.passive.description === "\u6bcf\u6b21\u8fdb\u5165\u84c4\u529b\u72b6\u6001\uff0c\u83b7\u5f97\u5168\u6280\u80fd\u80fd\u8017\u6c38\u4e45-2\u3002",
  "Rendered BWiki monster profile should parse the rendered passive description."
);
assert(profile.skillNames.includes("\u6f6e\u6d8c"), "Rendered BWiki monster profile should keep the rendered skill-card parser result.");
assert(profile.stats.hp === 89, "Rendered BWiki monster profile should parse rendered HP.");
assert(profile.stats.atk === 103, "Rendered BWiki monster profile should parse rendered physical attack.");
assert(profile.stats.spa === 109, "Rendered BWiki monster profile should parse rendered magical attack.");
assert(profile.stats.defense === 100, "Rendered BWiki monster profile should parse rendered physical defense.");
assert(profile.stats.spd === 104, "Rendered BWiki monster profile should parse rendered magical defense.");
assert(profile.stats.spe === 135, "Rendered BWiki monster profile should parse rendered speed.");

const bundle = {
  monsters: [
    {
      id: "dragonfish",
      name: "\u9f99\u9c7c",
      name_aliases: [],
      skills: [],
      passives: ["bwiki-passive-\u6d04\u6e38"],
      stats: { hp: 75, atk: 116, spa: 123, defense: 112, spd: 116, spe: 125 },
      raw: {
        stats: { hp: 75, atk: 116, spa: 123, defense: 112, spd: 116, spe: 125 }
      }
    }
  ],
  passives: [
    {
      id: "bwiki-passive-\u6d04\u6e38",
      name: "\u6d04\u6e38",
      description: "\u6bcf\u6b21\u8fdb\u5165\u84c4\u529b\u72b6\u6001\uff0c\u83b7\u5f97\u5168\u6280\u80fd\u80fd\u8017\u6c38\u4e45-1\u3002",
      trigger: "\u6bcf\u6b21\u8fdb\u5165\u84c4\u529b\u72b6\u6001\uff0c\u83b7\u5f97\u5168\u6280\u80fd\u80fd\u8017\u6c38\u4e45-1\u3002"
    }
  ],
  skills: []
};

const applied = sandbox.applyBwikiRenderedMonsterProfiles(
  bundle,
  new Map([["\u9f99\u9c7c", profile]])
);
assert(
  applied.passives[0].description.includes("\u6c38\u4e45-2"),
  "Rendered BWiki passive description should replace stale wikitext passive data."
);
assert(
  applied.monsters[0].passives[0] === "bwiki-passive-\u6d04\u6e38",
  "Rendered BWiki passive application should keep matching monster passive IDs stable."
);
assert(applied.monsters[0].stats.hp === 89, "Rendered BWiki stats should replace stale wikitext monster stats.");
assert(applied.monsters[0].stats.spe === 135, "Rendered BWiki stats should replace stale wikitext monster speed.");
assert(applied.monsters[0].raw.stats.spa === 109, "Rendered BWiki stats should replace stale raw wikitext stats.");
assert(
  bundle.passives[0].description.includes("\u6c38\u4e45-1"),
  "Rendered BWiki passive application should not mutate the original bundle."
);
assert(bundle.monsters[0].stats.hp === 75, "Rendered BWiki stat application should not mutate the original bundle.");

assert(html.includes("applyBwikiRenderedMonsterProfiles({"), "BWiki bundle parsing should apply rendered monster profiles.");
assert(!html.includes("fetchBwikiRenderedMonsterSkillMap"), "Rendered monster pages should be fetched once for profile and skill data.");
assert(!html.includes("LATEST_MONSTER_STAT_OVERRIDES"), "Rendered BWiki stats should replace the local monster stat override pool.");
assert(!html.includes("applyLatestMonsterStatOverrides"), "Rendered BWiki stats should not be replaced by a local stat override pass.");

console.log("BWiki rendered monster profile static checks passed.");
