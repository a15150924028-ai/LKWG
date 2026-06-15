const fs = require("fs");
const path = require("path");
const vm = require("vm");

const htmlFile = "index.html";
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

const cuteStatusSkill = {
  id: "cute-status",
  name: "\u793a\u5f31",
  type: "cute",
  category: "status",
  power: null,
  description: "\u81ea\u5df1\u83b7\u5f97\u840c\u5316+1\uff0c\u82e5\u6210\u529f\u83b7\u5f97\u840c\u5316\uff0c\u901f\u5ea6+150\u3002"
};
const statusSuccess = damageRules.resolvePvpPostUseEffects(cuteStatusSkill, { canGainCuteLayer: true });
assert(statusSuccess.cuteLayerDelta === 1, "Status skills that grant cute +1 should declare a post-use cute layer effect.");
assert(statusSuccess.statFlatMods?.spe === 150, "Successful cute-gain status skills should apply their flat speed bonus.");
const statusFailed = damageRules.resolvePvpPostUseEffects(cuteStatusSkill, { canGainCuteLayer: false });
assert(!statusFailed.cuteLayerDelta, "Status skills should not gain cute layers when the attacker cannot gain cute +1.");
assert(!statusFailed.statFlatMods?.spe, "Cute-gain success bonuses should not apply when cute +1 fails.");

const turnOrderPowerSkill = {
  id: "turn-order-power",
  name: "\u56de\u5408\u987a\u5e8f\u89c4\u5219\u6d4b\u8bd5",
  type: "wing",
  category: "physical",
  power: 100,
  description: "\u9020\u6210\u7269\u4f24\uff0c\u82e5\u5148\u4e8e\u654c\u65b9\u653b\u51fb\uff0c\u672c\u6b21\u6280\u80fd\u5a01\u529b+50%\u3002"
};
const priorityFirst = damageRules.resolvePvpVariableDamage(turnOrderPowerSkill, {
  actsBeforeDefender: true,
  attackerStats: { spe: 100 },
  defenderStats: { spe: 999 }
});
assert(priorityFirst.power === 150, "First-strike power rules must honor turn-order priority even when slower.");
const prioritySecond = damageRules.resolvePvpVariableDamage(turnOrderPowerSkill, {
  actsBeforeDefender: false,
  attackerStats: { spe: 999 },
  defenderStats: { spe: 100 }
});
assert(prioritySecond.power === 100, "First-strike power rules must honor turn-order priority even when faster.");
const speedFallback = damageRules.resolvePvpVariableDamage(turnOrderPowerSkill, {
  attackerStats: { spe: 999 },
  defenderStats: { spe: 100 }
});
assert(speedFallback.power === 150, "First-strike power rules should keep speed fallback when turn order is unavailable.");

const hardGate = {
  id: "hard-gate",
  name: "\u786c\u95e8",
  type: "fighting",
  category: "defense",
  power: 0,
  description: "\u5e94\u5bf9\u653b\u51fb\uff1a\u6253\u65ad\u88ab\u5e94\u5bf9\u6280\u80fd\uff0c\u5e76\u9020\u621090\u5a01\u529b\u7269\u4f24\u3002"
};
const hardGateDamage = damageRules.resolvePvpVariableDamage(hardGate, {});
assert(hardGateDamage.responsePower === 90, "硬门 should expose 90 response power for PVP damage.");
assert(hardGateDamage.powerRuleMatched, "硬门 should be considered calculable even though it is a defense skill.");

const listeningBridge = {
  id: "listening-bridge",
  name: "\u542c\u6865",
  type: "fighting",
  category: "defense",
  power: 0,
  description: "\u51cf\u4f2460%\uff0c\u5e94\u5bf9\u653b\u51fb\uff1a\u5bf9\u654c\u65b9\u9020\u6210\u6b66\u7cfb\u7269\u7406\u4f24\u5bb3\uff0c\u5a01\u529b\u4e0e\u88ab\u5e94\u5bf9\u6280\u80fd\u76f8\u7b49\u3002"
};
const bridgeDamage = damageRules.resolvePvpVariableDamage(listeningBridge, { respondedSkillPower: 125 });
assert(bridgeDamage.responsePower === 125, "听桥 should use the responded skill power for response damage.");
assert(bridgeDamage.powerRuleMatched, "听桥 should be considered calculable even though it is a defense skill.");

assert(html.includes("resolveSpecialPvpPowerRule"), "Special PVP power rules should be centralized in a rule-pool resolver.");
assert(html.includes("canGainPvpCuteLayer(attacker)"), "PVP damage calculation should pass the attacker's current cute availability into power rules.");
assert(html.includes("actionCuteLayers"), "PVP damage calculation should snapshot pre-use cute layers for post-use form changes.");
assert(
  html.includes("pvpActionSnapshotMatchesCurrentMonster"),
  "PVP damage calculation should ignore stale pre-use snapshots after a post-use form change."
);
assert(html.includes("applyPvpPostUseSkillEffects"), "PVP skill use should have a post-use effect application path.");
assert(
  html.includes("function currentPvpTurnDamage(") &&
    html.includes("function pvpTurnDamageForSide(") &&
    html.includes("calcPvpDamage(attackerState, defenderState, action, { actsBeforeDefender })"),
  "PVP turn damage must be centralized through a shared turn-order-aware damage result."
);
assert(
  html.includes("currentPvpTurnDamage(currentPvpTurnContext())[side]") &&
    html.includes("const turnDamage = currentPvpTurnDamage(context)"),
  "Visible PVP damage cards and turn settlement must read the same shared damage result."
);
assert(
  html.includes('responseStatus.type === "defense-attack"'),
  "Defense skills with response damage must calculate when they successfully respond to attacks."
);
assert(
  html.includes("respondedSkillPower: pvpActionBasePower(defenderAction)"),
  "PVP damage calculation must pass the opponent selected skill power into response-power rules."
);
assert(
  /function damageMode\(skill[\s\S]*物伤[\s\S]*物理伤害[\s\S]*attackKey: "atk"/.test(html),
  "Response damage skills that describe physical damage must use physical attack mode."
);
assert(
  html.includes('damage.responseReason || "应对状态"'),
  "Response damage result text must use the actual response reason such as 应对攻击."
);
assert(html.includes("responseOnly"), "Defense response-damage skills must be marked as response-only.");
assert(
  html.includes("需要应对攻击后计算伤害"),
  "Defense response-damage skills must not show fake base damage when their response is not triggered."
);
assert(
  /if \(damage\.responseOnly\)[\s\S]*pvpDamageAmountText\(damage, damage\.responseEstimate/.test(html),
  "Response-only damage results must render the triggered response damage as the primary damage line."
);

console.log("PVP special power rule static checks passed.");
