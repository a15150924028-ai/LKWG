const fs = require("fs");
const path = require("path");
const vm = require("vm");

const htmlFile = fs.readdirSync(path.join(__dirname, ".."))
  .filter((name) => name.endsWith(".html"))
  .sort((a, b) => a.length - b.length)[0];
const html = fs.readFileSync(path.join(__dirname, "..", htmlFile), "utf8");
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sandbox = { module: { exports: {} } };
vm.runInNewContext(scripts.find((script) => script.includes("LKWG_PVP_DAMAGE_RULES")), sandbox);
const damageRules = sandbox.module.exports;

const superCandy = {
  id: "super-candy",
  name: "\u8d85\u7ea7\u7cd6\u679c",
  type: "normal",
  category: "attack",
  power: null,
  description: "\u4f7f\u7528\u540e\u5c1d\u8bd5\u83b7\u5f97\u840c\u5316+1\u3002"
};

const success = damageRules.resolvePvpVariableDamage(superCandy, { canGainCuteLayer: true });
assert(success.power === 160, "Super Candy should be 160 power when the attacker can gain cute +1.");
assert(success.powerRuleMatched, "Super Candy should run through the special PVP power-rule pool.");
assert(
  success.labels.includes("\u8d85\u7ea7\u7cd6\u679c\uff1a\u53ef\u83b7\u5f97\u840c\u5316+1\uff0c\u5a01\u529b160"),
  "Super Candy success branch should expose a visible rule label."
);
assert(success.postUseEffects?.cuteLayerDelta === 1, "Super Candy should declare a post-use cute +1 effect.");

const failed = damageRules.resolvePvpVariableDamage(superCandy, { canGainCuteLayer: false });
assert(failed.power === 100, "Super Candy should be 100 power when the attacker cannot gain cute +1.");
assert(failed.powerRuleMatched, "Super Candy failure branch should still run through the special PVP power-rule pool.");
assert(
  failed.labels.includes("\u8d85\u7ea7\u7cd6\u679c\uff1a\u65e0\u6cd5\u83b7\u5f97\u840c\u5316+1\uff0c\u5a01\u529b100"),
  "Super Candy failure branch should expose a visible rule label."
);
assert(!failed.postUseEffects?.cuteLayerDelta, "Super Candy should not gain a layer when cute +1 is impossible.");

assert(html.includes("resolveSpecialPvpPowerRule"), "Special PVP power rules should be centralized in a rule-pool resolver.");
assert(html.includes("canGainPvpCuteLayer(attacker)"), "PVP damage calculation should pass the attacker's current cute availability into power rules.");
assert(html.includes("actionCuteLayers"), "PVP damage calculation should snapshot pre-use cute layers for post-use form changes.");
assert(
  html.includes("pvpActionSnapshotMatchesCurrentMonster"),
  "PVP damage calculation should ignore stale pre-use snapshots after a post-use form change."
);
assert(html.includes("applyPvpPostUseSkillEffects"), "PVP skill use should have a post-use effect application path.");

console.log("PVP special power rule static checks passed.");
