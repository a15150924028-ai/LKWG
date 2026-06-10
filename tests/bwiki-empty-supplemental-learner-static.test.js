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

const sandbox = { console: { warn() {} } };
vm.runInNewContext(`
  const BWIKI_PAGE_FETCH_CONCURRENCY = 4;
  const fetchedHtmlByTitle = new Map();
  const failingTitles = new Set();
  const unique = (values) => [...new Set(values.filter(Boolean))];
  const decodeHtmlEntities = (value) => String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  async function mapWithConcurrency(items, concurrency, worker) {
    const results = [];
    for (let index = 0; index < items.length; index += 1) {
      results[index] = await worker(items[index], index);
    }
    return results;
  }
  async function fetchBwikiParsedHtml(title) {
    if (failingTitles.has(title)) throw new Error(\`BWiki \${title} JSONP 请求失败\`);
    return fetchedHtmlByTitle.get(title) || "";
  }
  ${extractFunction("plainBwikiText")}
  ${extractFunction("parseBwikiSkillLearnerNames")}
  ${extractFunction("fetchBwikiSkillLearnerMap")}
  this.fetchedHtmlByTitle = fetchedHtmlByTitle;
  this.failingTitles = failingTitles;
  this.fetchBwikiSkillLearnerMap = fetchBwikiSkillLearnerMap;
`, sandbox);

sandbox.fetchedHtmlByTitle.set("\u8fc7\u5c71\u8f66", `
  <div>MediaWiki:TabJS</div>
  <div>\u9ed8\u8ba4\uff080\uff09</div>
  <div>\u8840\u8109\uff080\uff09</div>
  <div>\u6280\u80fd\u77f3\uff080\uff09</div>
  <div>-</div><div>-</div><div>-</div>
`);

(async () => {
  const learners = await sandbox.fetchBwikiSkillLearnerMap(["\u8fc7\u5c71\u8f66"]);
  assert(typeof learners?.get === "function", "Empty BWiki supplemental learner results should still return a Map-like object.");
  assert(learners.size === 0, "Empty BWiki supplemental learner results should be skipped instead of failing the update.");
  sandbox.failingTitles.add("\u8fc7\u5c71\u8f66");
  const failedLearners = await sandbox.fetchBwikiSkillLearnerMap(["\u8fc7\u5c71\u8f66"]);
  assert(failedLearners.size === 0, "Failed BWiki supplemental learner pages should be skipped instead of failing the update.");
  assert(
    html.includes("fetchBwikiRenderedMonsterProfileMap([...monsterIndex.keys()], monsterRevisionByTitle)"),
    "Rendered monster skill cards should remain the source for supplemental skills with empty learner pages."
  );
  console.log("BWiki empty supplemental learner static checks passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
