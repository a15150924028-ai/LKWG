const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

[
  'id="inputPetResults"',
  "inputPetResultsEl",
  "mobile-pet-results",
  "result-card",
  "petHtml",
].forEach((needle) => {
  assert(!html.includes(needle), `Pet result card module must be removed: ${needle}`);
});

console.log("No pet result cards static checks passed.");
