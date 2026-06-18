const fs = require("fs");
const path = require("path");
const vm = require("vm");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`${name} is missing.`);
  const open = html.indexOf("{", html.indexOf(")", start));
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

const turnScript = scripts.find((script) => script.includes("LKWG_PVP_TURN_RULES"));
assert(turnScript, "PVP turn-rule module is missing.");

const sandbox = { module: { exports: {} } };
vm.runInNewContext(turnScript, sandbox);
const turnRules = sandbox.module.exports;

const sneak = { name: "偷袭", category: "attack", description: "造成物伤，应对状态：本次技能威力变为3倍。" };
const force = { id: "pvp-force-impact", name: "愿力冲击", category: "attack", description: "敌方使用状态技能时伤害×2.5。" };
const waterBlade = { name: "水刃", category: "attack", description: "造成物伤，应对状态：获得附加效果。" };
const guard = { name: "有效预防", category: "defense", description: "减伤50%，应对攻击：下一次行动获得先手+1。" };
const status = { name: "休息", category: "status" };
const attack = { name: "许愿星", category: "special" };

assert(turnRules.actionCategory(force) === "attack", "Force Impact must be treated as an attack action.");
assert(turnRules.canRespondToAction(sneak, status).type === "attack-status", "Attack skills with 应对状态 must respond to status skills.");
assert(turnRules.canRespondToAction(sneak, attack).success === false, "Attack-status responses must not trigger against attacks.");
assert(turnRules.canRespondToAction(force, status).type === "attack-status", "Force Impact must respond to status skills.");
assert(turnRules.canRespondToAction(waterBlade, status).type === "attack-status", "Attack skills with status response side effects must still respond to status skills.");
assert(turnRules.canRespondToAction(guard, attack).type === "defense-attack", "Defense skills must passively respond to attack skills.");

const responseOrder = turnRules.resolveTurnOrder({
  allyAction: sneak,
  enemyAction: { ...status, priority: 1 },
  allySpeed: 10,
  enemySpeed: 999
});
assert(responseOrder.first === "ally", "Successful attack-status response must settle responder damage first.");
assert(responseOrder.reason === "ally-response-status", "Response order must expose the response reason.");

const priorityOrder = turnRules.resolveTurnOrder({
  allyAction: attack,
  enemyAction: { ...attack, priority: 1 },
  allySpeed: 999,
  enemySpeed: 1
});
assert(priorityOrder.first === "enemy", "Higher priority must act before speed.");
assert(priorityOrder.reason === "priority", "Priority wins must expose priority reason.");

const speedOrder = turnRules.resolveTurnOrder({
  allyAction: attack,
  enemyAction: attack,
  allySpeed: 300,
  enemySpeed: 200
});
assert(speedOrder.first === "ally", "Higher speed must act first when priority is equal.");
assert(speedOrder.reason === "speed", "Speed wins must expose speed reason.");

const tieOrder = turnRules.resolveTurnOrder({
  allyAction: attack,
  enemyAction: attack,
  allySpeed: 200,
  enemySpeed: 200,
  random: () => 0.25
});
assert(tieOrder.first === "ally", "Exact priority and speed ties must resolve to a random side.");
assert(tieOrder.reason === "tie", "Exact ties must expose tie reason.");
assert(tieOrder.random === true, "Exact ties must expose that the result was randomized.");
assert(tieOrder.roll === 0.25, "Exact ties must expose the random roll for history/debug output.");

const enemyTieOrder = turnRules.resolveTurnOrder({
  allyAction: attack,
  enemyAction: attack,
  allySpeed: 200,
  enemySpeed: 200,
  random: () => 0.75
});
assert(enemyTieOrder.first === "enemy", "A high tie roll must resolve to enemy first.");

assert(html.includes("function renderPvpTurnPreview()"), "PVP panel must render a turn-order preview.");
assert(html.includes('data-pvp-turn-preview'), "Turn preview must have a stable data attribute for UI verification.");
assert(html.includes(".pvp-turn-preview strong"), "Turn preview must style text blocks explicitly for mobile wrapping.");
assert(html.includes("overflow-wrap: anywhere"), "Turn preview text must wrap instead of causing mobile horizontal overflow.");
assert(html.includes("responseTriggered"), "PVP damage must track whether response damage is actually triggered.");
assert(
  html.includes("canRespondToAction(damageAction, defenderAction)"),
  "PVP damage must use turn rules to decide whether response damage triggers."
);
const calcDamageSource = extractFunction("calcPvpDamage");
const damageResultSource = extractFunction("renderPvpDamageResult");
assert(
  calcDamageSource.includes('const isForceImpact = battleAction.id === "pvp-force-impact";') &&
    calcDamageSource.includes("const shouldPreviewResponseDamage = responseTriggered || isForceImpact;") &&
    calcDamageSource.includes("shouldPreviewResponseDamage ? window.LKWG_PVP_DAMAGE_CORE.calculateDamage"),
  "Force Impact must preview response-success damage while other response damage still depends on a trigger."
);
assert(
  damageResultSource.includes('const forceImpactResult = damage.action.id === "pvp-force-impact";') &&
    damageResultSource.includes('forceImpactResult ? "正常伤害" : ""') &&
    damageResultSource.includes('forceImpactResult ? "应对成功" : "应对状态"'),
  "Force Impact result must label both normal damage and response-success damage."
);
assert(html.includes("resolveTurnOrder({"), "The PVP preview must resolve action order through the shared turn rules.");

console.log("PVP turn-rule static checks passed.");
