const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(!html.includes('id="calculateBtn"'), "Display-result action button must be removed from the UI.");
assert(!html.includes("calculateBtn.addEventListener"), "Removed display-result button must not keep a stale click binding.");
assert(!html.includes(">显示结果<"), "Display-result button label must not remain in the UI.");

assert(html.includes('id="results"'), "Results container must remain available.");
assert(/function renderResults\(\)\s*\{/.test(html), "Results renderer must remain available.");
assert(/renderResults\(\);\s*\}\s*startApp\(\);/.test(html), "Startup must continue to render results without a manual button.");

console.log("No display-result button static checks passed.");
