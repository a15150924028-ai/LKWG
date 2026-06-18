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

const sandTrap = {
  id: "sand-trap",
  name: "\u9e23\u6c99\u9677\u9631",
  type: "ground",
  category: "physical",
  power: 60,
  description: "\u9020\u6210\u7269\u4f24\uff0c\u7269\u9632\u4f4e\u4e8e\u6216\u7b49\u4e8e\u5bf9\u624b\u65f6\u5a01\u529b\u4e3a60\uff1b\u7269\u9632\u9ad8\u4e8e\u5bf9\u624b271\u53ca\u4ee5\u4e0a\u65f6\uff0c\u5a01\u529b\u63d0\u5347\u81f3200\u3002"
};
function sandTrapPower(defenseDiff) {
  return damageRules.resolvePvpVariableDamage(sandTrap, {
    attackerStats: { defense: 500 + defenseDiff },
    defenderStats: { defense: 500 }
  }).power;
}
assert(sandTrapPower(0) === 60, "鸣沙陷阱 should stay 60 power when physical defense is not higher.");
assert(sandTrapPower(1) === 100, "鸣沙陷阱 should be 100 power for 1-29 physical defense lead.");
assert(sandTrapPower(29) === 100, "鸣沙陷阱 should stay 100 power through 29 physical defense lead.");
assert(sandTrapPower(30) === 130, "鸣沙陷阱 should be 130 power from 30 physical defense lead.");
assert(sandTrapPower(271) === 200, "鸣沙陷阱 should be 200 power from 271 physical defense lead.");

const flashStrike = {
  id: "flash-strike",
  name: "\u95ea\u51fb",
  type: "wing",
  category: "physical",
  power: 60,
  description: "\u901f\u5ea6\u4f4e\u4e8e\u6216\u7b49\u4e8e\u5bf9\u624b\u65f6\u5a01\u529b\u4e3a60\uff1b\u901f\u5ea6\u9ad8\u4e8e\u5bf9\u624b271\u53ca\u4ee5\u4e0a\u65f6\uff0c\u5a01\u529b\u63d0\u5347\u81f3200\u3002"
};
function flashStrikePower(speedDiff) {
  return damageRules.resolvePvpVariableDamage(flashStrike, {
    attackerStats: { spe: 500 + speedDiff },
    defenderStats: { spe: 500 }
  }).power;
}
assert(flashStrikePower(-1) === 60, "闪击 should be 60 power when slower.");
assert(flashStrikePower(0) === 100, "闪击 should be 100 power at equal speed.");
assert(flashStrikePower(14) === 100, "闪击 should stay 100 power through speed diff 14.");
assert(flashStrikePower(15) === 130, "闪击 should be 130 power from speed diff 15.");
assert(flashStrikePower(120) === 195, "闪击 should be 195 power from speed diff 120.");
assert(flashStrikePower(135) === 200, "闪击 should be 200 power from speed diff 135.");

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
  description: "\u51cf\u4f2460%\uff0c\u5e94\u5bf9\u653b\u51fb\uff1a\u5bf9\u654c\u65b9\u9020\u6210\u6b66\u7cfb\u7269\u7406\u4f24\u5bb3\uff0c\u5a01\u529b\u4e0e\u654c\u65b9\u6700\u7ec8\u4f24\u5bb3\u76f8\u7b49\u3002"
};
const bridgeDamage = damageRules.resolvePvpVariableDamage(listeningBridge, { respondedSkillPower: 125 });
assert(bridgeDamage.responsePower === 125, "听桥 should use the responded skill power for response damage.");
assert(bridgeDamage.powerRuleMatched, "听桥 should be considered calculable even though it is a defense skill.");
const bridgeFinalDamage = damageRules.resolvePvpVariableDamage(listeningBridge, {
  respondedSkillPower: 125,
  respondedFinalSingleDamage: 321
});
assert(
  bridgeFinalDamage.responsePower === 321,
  "听桥 should use the responded final single-hit damage as response power when available."
);
assert(
  /应对攻击.*威力.*最终伤害/.test(html),
  "听桥 parsing should be keyed to final damage wording instead of stale responded-skill wording."
);

const counterPunch = {
  id: "counter-punch",
  name: "\u53cd\u51fb\u62f3",
  type: "fighting",
  category: "physical",
  power: 25,
  description: "\u9020\u6210\u7269\u4f24\uff0c2\u8fde\u51fb\uff0c\u82e5\u540e\u624b\u653b\u51fb\uff0c\u6539\u4e3a3\u8fde\u51fb\u3002"
};
const counterPunchFirst = damageRules.resolvePvpVariableDamage(counterPunch, { actsBeforeDefender: true });
assert(counterPunchFirst.hitCount === 2, "反击拳 should stay 2-hit when it acts first.");
const counterPunchSecond = damageRules.resolvePvpVariableDamage(counterPunch, { actsBeforeDefender: false });
assert(counterPunchSecond.hitCount === 3, "反击拳 should become 3-hit when it acts second.");

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
  html.includes("respondedFinalSingleDamage"),
  "PVP damage calculation must pass the opponent's final single-hit damage into response-power rules."
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
  /if \(damage\.responseOnly\)[\s\S]*renderPvpDamageHero\(damage, damage\.responseEstimate/.test(html),
  "Response-only damage results must render the triggered response damage as the primary damage line."
);

console.log("PVP special power rule static checks passed.");
