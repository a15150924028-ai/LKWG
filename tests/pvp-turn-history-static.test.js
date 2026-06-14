const fs = require("fs");
const path = require("path");
const vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
const historyScript = scripts.find((script) => script.includes("LKWG_PVP_HISTORY_RULES"));
assert(historyScript, "PVP history module is missing.");

const sandbox = {};
vm.runInNewContext(historyScript, sandbox);
const historyRules = sandbox.LKWG_PVP_HISTORY_RULES;
assert(historyRules, "PVP history rules must be exported.");

const source = { ally: { currentHp: 50 }, turnLog: [{ turn: 1, summary: "old" }] };
const clone = historyRules.cloneState(source);
clone.ally.currentHp = 1;
clone.turnLog[0].summary = "changed";
assert(source.ally.currentHp === 50, "cloneState must deep-clone side state.");
assert(source.turnLog[0].summary === "old", "cloneState must deep-clone turn logs.");

let log = [];
for (let index = 1; index <= 8; index += 1) {
  log = historyRules.appendTurnLog(log, { turn: index, summary: `turn ${index}` }, 5);
}
assert(log.length === 5, "Turn log must be bounded.");
assert(log[0].turn === 8, "Newest turn log entry must be first.");
assert(log[4].turn === 4, "Bounded turn log must keep the five newest entries.");
assert(historyRules.clearTurnLog().length === 0, "clearTurnLog must return an empty log.");

assert(html.includes("turnLog"), "PVP sim state must store a visible turn log.");
assert(html.includes("undoSnapshot"), "PVP sim state must store an undo snapshot.");
assert(html.includes("function renderPvpTurnHistory("), "PVP panel must render turn history.");
assert(html.includes("function recordPvpTurnSettlement("), "PVP panel must record settled turns.");
assert(html.includes("function undoPvpTurnSettlement("), "PVP panel must restore the previous turn snapshot.");
assert(html.includes("function clearPvpTurnHistory("), "PVP panel must clear turn history.");
assert(html.includes("data-pvp-undo-turn"), "PVP panel must expose an undo-turn button.");
assert(html.includes("data-pvp-clear-history"), "PVP panel must expose a clear-history button.");

console.log("PVP turn history static checks passed.");
