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
  const BWIKI_ELEMENT_TO_ELEMENT = { "\u673a\u68b0": "steel" };
  const unique = (values) => [...new Set(values.filter(Boolean))];
  const decodeHtmlEntities = (value) => String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  function cleanWikiText(value) { return decodeHtmlEntities(String(value || "")).replace(/<[^>]+>/g, "").trim(); }
  function splitBwikiList(value) { return unique(cleanWikiText(value).split(/[\\n,，、]/).map((item) => item.trim()).filter(Boolean)); }
  ${extractFunction("parseBwikiIndexEntries")}
  this.parseBwikiIndexEntries = parseBwikiIndexEntries;
`, sandbox);

const skillIndexHtml = `
  <div class="divsort" data-param1="\u72b6\u6001" data-param2="\u673a\u68b0">
    <a href="/rocom/\u6587\u4ef6:\u6280\u80fd\u56fe\u6807_\u94c1\u84ba\u85dc.png" title="\u6587\u4ef6:\u6280\u80fd\u56fe\u6807 \u94c1\u84ba\u85dc.png">
      <img class="rocom_skill_bg_img" src="//patchwiki.biligame.com/images/rocom/example.png">
    </a>
    <a href="/rocom/\u94c1\u84ba\u85dc" title="\u94c1\u84ba\u85dc">\u94c1\u84ba\u85dc</a>
  </div>
`;

const entries = sandbox.parseBwikiIndexEntries(skillIndexHtml, "skill");
assert(entries.has("\u94c1\u84ba\u85dc"), "BWiki index parsing should use the skill page title, not the leading file link title.");
assert(!entries.has("\u6587\u4ef6:\u6280\u80fd\u56fe\u6807 \u94c1\u84ba\u85dc.png"), "BWiki index parsing should never return file page titles as skill entries.");
assert(entries.get("\u94c1\u84ba\u85dc").image_url === "//patchwiki.biligame.com/images/rocom/example.png", "BWiki index parsing should keep the icon URL from the file link.");
assert(entries.get("\u94c1\u84ba\u85dc").elements.includes("steel"), "BWiki index parsing should keep data-param element parsing.");

console.log("BWiki index title static checks passed.");
