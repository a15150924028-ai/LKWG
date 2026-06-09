const fs = require("fs");
const path = require("path");
const vm = require("vm");

const htmlFile = fs.readdirSync(path.join(__dirname, ".."))
  .find((name) => name === "\u514b\u5236\u9762\u67e5\u8be2.html");
const html = fs.readFileSync(path.join(__dirname, "..", htmlFile), "utf8");

function extractFunction(name) {
  let start = html.indexOf(`async function ${name}(`);
  if (start < 0) start = html.indexOf(`function ${name}(`);
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

assert(
  html.includes('const BWIKI_RENDERED_PROFILE_CACHE_KEY = "roco-world-bwiki-rendered-profile-cache-v3";'),
  "Rendered BWiki profile cache should invalidate old profiles that were parsed before split-arrow evolution chains were supported."
);
assert(
  html.includes("fetchBwikiRenderedSkillProfileMap(skillTitles, skillRevisionByTitle)"),
  "Rendered skill profile fetching should receive skill revision metadata."
);
assert(
  html.includes("fetchBwikiRenderedMonsterProfileMap([...monsterIndex.keys()], monsterRevisionByTitle)"),
  "Rendered monster profile fetching should receive monster revision metadata."
);
assert(
  html.includes('updateBwikiProgress("技能渲染页"'),
  "Online update should show rendered skill progress."
);
assert(
  html.includes('updateBwikiProgress("精灵渲染页"'),
  "Online update should show rendered monster progress."
);

const storage = new Map();
const sandbox = {
  localStorage: {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
    removeItem(key) {
      storage.delete(key);
    }
  },
  dataStatus: { textContent: "" }
};

vm.runInNewContext(`
  const BWIKI_RENDERED_PROFILE_CACHE_KEY = "roco-world-bwiki-rendered-profile-cache-v3";
  const BWIKI_PAGE_FETCH_CONCURRENCY = 2;
  let fetchCount = 0;
  async function mapWithConcurrency(items, concurrency, worker) {
    const results = [];
    for (let index = 0; index < items.length; index += 1) {
      results[index] = await worker(items[index], index);
    }
    return results;
  }
  async function fetchBwikiParsedHtml() {
    fetchCount += 1;
    return "<div>fetched</div>";
  }
  function parseBwikiRenderedSkillProfile() {
    return { pp: 1 };
  }
  ${extractFunction("bwikiPageRevisionKey")}
  ${extractFunction("readBwikiRenderedProfileCache")}
  ${extractFunction("writeBwikiRenderedProfileCache")}
  ${extractFunction("getCachedBwikiRenderedProfile")}
  ${extractFunction("setCachedBwikiRenderedProfile")}
  ${extractFunction("updateBwikiProgress")}
  ${extractFunction("fetchBwikiRenderedSkillProfileMap")}
  this.bwikiPageRevisionKey = bwikiPageRevisionKey;
  this.readBwikiRenderedProfileCache = readBwikiRenderedProfileCache;
  this.writeBwikiRenderedProfileCache = writeBwikiRenderedProfileCache;
  this.getCachedBwikiRenderedProfile = getCachedBwikiRenderedProfile;
  this.setCachedBwikiRenderedProfile = setCachedBwikiRenderedProfile;
  this.updateBwikiProgress = updateBwikiProgress;
  this.fetchBwikiRenderedSkillProfileMap = fetchBwikiRenderedSkillProfileMap;
  this.getFetchCount = () => fetchCount;
`, sandbox);

const page = {
  title: "\u6f6e\u6d8c",
  revisions: [{ revid: 12345, timestamp: "2026-06-09T01:00:00Z" }]
};
assert(sandbox.bwikiPageRevisionKey(page) === "12345", "Revision cache key should prefer BWiki revid.");
assert(
  sandbox.bwikiPageRevisionKey({ revisions: [{ timestamp: "2026-06-09T02:00:00Z" }] }) === "2026-06-09T02:00:00Z",
  "Revision cache key should fall back to timestamp."
);

const cache = sandbox.readBwikiRenderedProfileCache();
sandbox.setCachedBwikiRenderedProfile(cache, "skill", "\u6f6e\u6d8c", "12345", { pp: 2, power: 80 });
sandbox.writeBwikiRenderedProfileCache(cache);
const saved = sandbox.readBwikiRenderedProfileCache();
assert(
  sandbox.getCachedBwikiRenderedProfile(saved, "skill", "\u6f6e\u6d8c", "12345")?.power === 80,
  "Rendered profile cache should return a profile for the same revision."
);
assert(
  !sandbox.getCachedBwikiRenderedProfile(saved, "skill", "\u6f6e\u6d8c", "67890"),
  "Rendered profile cache should miss when the BWiki revision changes."
);

storage.set("roco-world-bwiki-rendered-profile-cache-v3", JSON.stringify({
  version: 2,
  skill: { "\u6f6e\u6d8c": { revisionKey: "12345", profile: { power: 80 } } },
  monster: { "\u52a0\u6cb9\u87f9": { revisionKey: "abc", profile: { evolutionLine: [] } } }
}));
const outdatedCache = sandbox.readBwikiRenderedProfileCache();
assert(
  !sandbox.getCachedBwikiRenderedProfile(outdatedCache, "skill", "\u6f6e\u6d8c", "12345"),
  "Rendered profile cache should ignore v2 data so monster profiles are reparsed with split-arrow evolution support."
);
sandbox.writeBwikiRenderedProfileCache(saved);

sandbox.updateBwikiProgress("\u6280\u80fd\u6e32\u67d3\u9875", 3, 10, 2);
assert(
  sandbox.dataStatus.textContent.includes("\u6280\u80fd\u6e32\u67d3\u9875 3/10") && sandbox.dataStatus.textContent.includes("\u7f13\u5b58 2"),
  "Progress text should show stage counts and cache hits."
);

(async () => {
  const profiles = await sandbox.fetchBwikiRenderedSkillProfileMap(
    ["\u6f6e\u6d8c"],
    new Map([["\u6f6e\u6d8c", "12345"]])
  );
  assert(profiles.get("\u6f6e\u6d8c")?.power === 80, "Rendered skill fetching should reuse matching cached profiles.");
  assert(sandbox.getFetchCount() === 0, "Rendered skill fetching should not request pages when the cache revision matches.");
  console.log("BWiki rendered cache and progress static checks passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
