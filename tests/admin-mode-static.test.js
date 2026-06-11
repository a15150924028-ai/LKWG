const fs = require("fs");
const path = require("path");
const vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

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

const sandbox = {
  window: { location: { hash: "" } },
  adminDataPanel: { hidden: false }
};
vm.runInNewContext(`
  ${extractFunction("isAdminMode")}
  ${extractFunction("renderAdminBar")}
  this.isAdminMode = isAdminMode;
  this.renderAdminBar = renderAdminBar;
`, sandbox);

sandbox.window.location.hash = "";
sandbox.renderAdminBar();
assert(sandbox.adminDataPanel.hidden, "Normal index.html mode must hide the admin toolbar.");

sandbox.window.location.hash = "#admin";
sandbox.renderAdminBar();
assert(!sandbox.adminDataPanel.hidden, "#admin must show the admin toolbar.");

sandbox.window.location.hash = "#data-admin";
sandbox.renderAdminBar();
assert(!sandbox.adminDataPanel.hidden, "#data-admin must show the admin toolbar.");

sandbox.window.location.hash = "#other";
sandbox.renderAdminBar();
assert(sandbox.adminDataPanel.hidden, "Unrecognized hashes must hide the admin toolbar.");

console.log("Admin mode static checks passed.");
