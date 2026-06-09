const fs = require("fs");
const path = require("path");
const vm = require("vm");

const htmlFile = fs.readdirSync(path.join(__dirname, ".."))
  .find((name) => name === "\u514b\u5236\u9762\u67e5\u8be2.html");
const html = fs.readFileSync(path.join(__dirname, "..", htmlFile), "utf8");

function extractFunction(name) {
  let start = html.indexOf(`async function ${name}(`);
  if (start < 0) start = html.indexOf(`function ${name}(`);
  if (start < 0) return "";
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

const warnings = [];
const sandbox = {
  console: {
    warn(...args) {
      warnings.push(args.join(" "));
    }
  }
};
vm.runInNewContext(`
  const BWIKI_PAGE_BATCH_SIZE = 4;
  const BWIKI_PAGE_FETCH_CONCURRENCY = 2;
  const batchCalls = [];
  async function fetchBwikiWikitextBatch(titles) {
    batchCalls.push([...titles]);
    if (titles.length > 1) throw new Error("BWiki \u9875\u9762\u6279\u91cf\u8bfb\u53d6 JSONP \u8bf7\u6c42\u5931\u8d25");
    if (titles[0] === "\u574f\u9875") throw new Error("BWiki \u574f\u9875 JSONP \u8bf7\u6c42\u5931\u8d25");
    return [{ title: titles[0], revisions: [{ revid: titles[0].charCodeAt(0) }] }];
  }
  async function mapWithConcurrency(items, concurrency, worker) {
    const results = [];
    for (let index = 0; index < items.length; index += 1) {
      results[index] = await worker(items[index], index);
    }
    return results;
  }
  ${extractFunction("fetchBwikiWikitextBatchResilient")}
  ${extractFunction("fetchBwikiWikitextPages")}
  this.fetchBwikiWikitextPages = fetchBwikiWikitextPages;
  this.batchCalls = batchCalls;
`, sandbox);

(async () => {
  const pages = await sandbox.fetchBwikiWikitextPages(["\u7532", "\u4e59", "\u574f\u9875", "\u4e19"]);
  assert(
    pages.map((page) => page.title).join(",") === "\u7532,\u4e59,\u4e19",
    "BWiki wikitext fetching should split failed batches and skip only unrecoverable single pages."
  );
  assert(
    sandbox.batchCalls.some((titles) => titles.length === 1),
    "BWiki wikitext fetching should retry failed batches as single-page reads."
  );
  assert(
    warnings.some((message) => message.includes("\u574f\u9875")),
    "BWiki wikitext fetching should warn when a single page is skipped."
  );
  assert(
    html.includes("fetchBwikiWikitextBatchResilient"),
    "BWiki wikitext fetching should use a resilient batch reader."
  );
  console.log("BWiki wikitext batch resilience static checks passed.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
