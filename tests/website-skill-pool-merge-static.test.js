const fs = require("fs");
const path = require("path");
const vm = require("vm");

const htmlFile = fs.readdirSync(path.join(__dirname, ".."))
  .find((name) => name === "\u514b\u5236\u9762\u67e5\u8be2.html");
const html = fs.readFileSync(path.join(__dirname, "..", htmlFile), "utf8");

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  if (start < 0) {
    throw new Error(`${name} is missing.`);
  }

  const open = html.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < html.length; index += 1) {
    const char = html[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return html.slice(start, index + 1);
    }
  }
  throw new Error(`${name} source is incomplete.`);
}

const sandbox = {};
vm.runInNewContext(`${extractFunction("mergeWebsiteSkillPools")}; this.mergeWebsiteSkillPools = mergeWebsiteSkillPools;`, sandbox);

const primary = {
  monsters: [
    { id: "bwiki-ark", name: "\u673a\u5e55\u65b9\u821f", name_aliases: [], skills: ["bwiki-xiedou"] }
  ],
  skills: [
    { id: "bwiki-xiedou", name: "\u68b0\u6597", name_aliases: [] },
    { id: "bwiki-roller", name: "\u8fc7\u5c71\u8f66", name_aliases: [] }
  ]
};

const websitePoolSource = {
  monsters: [
    { id: "legacy-ark", name: "\u673a\u5e55\u65b9\u821f", name_aliases: [], skills: ["legacy-roller", "legacy-extra"] }
  ],
  skills: [
    { id: "legacy-roller", name: "\u8fc7\u5c71\u8f66", name_aliases: [] },
    { id: "legacy-extra", name: "\u5907\u7528\u65b0\u6280\u80fd", name_aliases: [] }
  ]
};

const merged = sandbox.mergeWebsiteSkillPools(primary, websitePoolSource);
const ark = merged.monsters.find((monster) => monster.name === "\u673a\u5e55\u65b9\u821f");
if (!ark.skills.includes("bwiki-roller")) {
  throw new Error("Website skill pools should map \u8fc7\u5c71\u8f66 to the primary BWiki skill id when available.");
}
if (!ark.skills.includes("legacy-extra")) {
  throw new Error("Website-only skills should be added to the merged skill list and pool.");
}
if (!merged.skills.some((skill) => skill.id === "legacy-extra" && skill.name === "\u5907\u7528\u65b0\u6280\u80fd")) {
  throw new Error("Website-only skill records should be preserved when supplementing a primary BWiki bundle.");
}
if (primary.monsters[0].skills.includes("bwiki-roller") || primary.skills.some((skill) => skill.id === "legacy-extra")) {
  throw new Error("mergeWebsiteSkillPools should not mutate its primary input bundle.");
}

if (!html.includes("return mergeWebsiteSkillPools(bwikiBundle, legacyBundle);")) {
  throw new Error("fetchRemoteBundle should supplement successful BWiki data with website skill pools.");
}

console.log("Website skill pool merge static checks passed.");
