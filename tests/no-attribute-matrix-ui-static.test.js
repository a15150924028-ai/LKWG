const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(!html.includes('data-scroll-target="matrixSection"'), "Attribute matrix navigation tab must be removed.");
assert(!html.includes('id="matrixSection"'), "Attribute matrix section must be removed from the UI.");
assert(!html.includes('id="matrixWrap"'), "Attribute matrix table container must be removed from the UI.");
assert(!html.includes("const matrixWrap = document.getElementById"), "Removed matrix UI must not keep a stale DOM reference.");
assert(!/function renderMatrix\(\)\s*\{/.test(html), "Removed matrix UI must not keep its renderer.");
assert(!html.includes("renderMatrix();"), "Removed matrix UI must not be rendered on startup or data refresh.");

assert(/function relationMultiplier\(/.test(html), "Type relation helper must remain for analysis and damage logic.");
assert(/function typeBadgeHtml\(/.test(html), "Type badge helper must remain for non-matrix UI.");
assert(html.includes('data-scroll-target="teamSection"'), "Team navigation must remain.");
assert(html.includes('data-scroll-target="resultsSection"'), "Analysis navigation must remain.");
assert(html.includes('data-scroll-target="pvpDamageSim"'), "Damage navigation must remain.");

console.log("No attribute matrix UI static checks passed.");
