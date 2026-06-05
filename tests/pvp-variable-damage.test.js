const assert = require("node:assert/strict");
const rules = require("../pvp_damage_rules.js");

function action(name, power, description, extra = {}) {
  return {
    id: name,
    name,
    power,
    pp: extra.pp ?? 3,
    description,
    ...extra
  };
}

function resolve(inputAction, context = {}) {
  return rules.resolvePvpVariableDamage(inputAction, {
    attackerStats: { hp: 500, atk: 200, defense: 200, spa: 200, spd: 200, spe: 300, ...(context.attackerStats || {}) },
    defenderStats: { hp: 500, atk: 200, defense: 200, spa: 200, spd: 200, spe: 100, ...(context.defenderStats || {}) },
    attackerEnergy: context.attackerEnergy,
    defenderEnergy: context.defenderEnergy,
    attackerHpPercent: context.attackerHpPercent,
    defenderHpPercent: context.defenderHpPercent,
    attackerSelectedSkills: context.attackerSelectedSkills,
    defenderSelectedSkills: context.defenderSelectedSkills,
    skillIndex: context.skillIndex,
    currentSkillCost: context.currentSkillCost,
    skillUseCount: context.skillUseCount,
    statusLayers: context.statusLayers,
    relatedTypeSkillUseCount: context.relatedTypeSkillUseCount,
    entryCount: context.entryCount,
    defenderSwitched: context.defenderSwitched,
    attackerHasDebuff: context.attackerHasDebuff,
    weatherType: context.weatherType,
    burstActive: context.burstActive,
    burstEffectCount: context.burstEffectCount,
    previousUsedStatusSkill: context.previousUsedStatusSkill,
    previousResponseSuccess: context.previousResponseSuccess,
    turnsWithoutDamage: context.turnsWithoutDamage,
    defeatCount: context.defeatCount,
    defenderFaintedCount: context.defenderFaintedCount,
    teamSkillCopies: context.teamSkillCopies,
    respondedSkillPower: context.respondedSkillPower,
    responseSuccessCount: context.responseSuccessCount,
    positionChangeCount: context.positionChangeCount,
    otherTypeSkillUseCount: context.otherTypeSkillUseCount,
    adjacentSkillPowers: context.adjacentSkillPowers,
    defenderTurnsWithoutSkillDamage: context.defenderTurnsWithoutSkillDamage,
    defenderMixedBlood: context.defenderMixedBlood,
    defaultEnergy: 10
  });
}

assert.equal(resolve(action("乱打", 25, "造成物伤，5连击。")).hitCount, 5);
assert.equal(resolve(action("传感器", 40, "造成物伤，2连击，本技能位于1号或3号位时连击+1。"), { skillIndex: 0 }).hitCount, 3);
assert.equal(resolve(action("传感器", 40, "造成物伤，2连击，本技能位于1号或3号位时连击+1。"), { skillIndex: 1 }).hitCount, 2);

assert.equal(resolve(action("械斗", 45, "本技能位于1号位时，威力+60。"), { skillIndex: 0 }).power, 105);
assert.equal(resolve(action("械斗", 45, "本技能位于1号位时，威力+60。"), { skillIndex: 1 }).power, 45);
assert.equal(resolve(action("磁暴", 70, "本技能位于1号或3号位时，威力+30。"), { skillIndex: 2 }).power, 100);

assert.equal(resolve(action("闪击", 60, "速度低于对手或和对手相同时，威力仍为60。速度高于对手271及以上时，威力提升至200。"), {
  attackerStats: { spe: 371 },
  defenderStats: { spe: 100 }
}).power, 200);
assert.equal(resolve(action("闪击", 60, "速度低于对手或和对手相同时，威力仍为60。速度高于对手271及以上时，威力提升至200。"), {
  attackerStats: { spe: 370 },
  defenderStats: { spe: 100 }
}).power, 60);
assert.equal(resolve(action("鸣沙陷阱", 60, "物防高于对手271及以上时，威力提升至200。"), {
  attackerStats: { defense: 371 },
  defenderStats: { defense: 100 }
}).power, 200);

assert.equal(resolve(action("穿膛", 80, "若敌方能量不高于2，本技能造成5倍伤害。"), { defenderEnergy: 2 }).damageMultiplier, 5);
assert.equal(resolve(action("穿膛", 80, "若敌方能量不高于2，本技能造成5倍伤害。"), { defenderEnergy: 3 }).damageMultiplier, 1);
assert.equal(resolve(action("背袭", 40, "若敌方能量等于0，造成20倍伤害。"), { defenderEnergy: 0 }).damageMultiplier, 20);
assert.equal(resolve(action("触底强击", 95, "使用后若能量耗尽，本次技能威力+120。", { pp: 4 }), { attackerEnergy: 4 }).power, 215);
assert.equal(resolve(action("坟场搏击", 180, "敌方每有1能量，本次技能威力-10%。"), { defenderEnergy: 5 }).power, 90);

assert.equal(resolve(action("冰锋横扫", 10, "威力等于敌方已选择技能能耗总和×10。"), {
  defenderSelectedSkills: [{ pp: 3 }, { pp: 2 }, { pp: 5 }]
}).power, 100);
assert.equal(resolve(action("筛管奔流", 80, "若自己生命高于80%，本技能威力+75。"), { attackerHpPercent: 100 }).power, 155);
assert.equal(resolve(action("筛管奔流", 80, "自己生命大于80%时，本次技能威力+75。"), { attackerHpPercent: 100 }).power, 155);
assert.equal(resolve(action("筛管奔流", 80, "自己生命大于80%时，本次技能威力+75。"), { attackerHpPercent: 80 }).power, 80);
assert.equal(resolve(action("满血强击", 80, "满生命值时，本次技能威力+60。"), { attackerHpPercent: 100 }).power, 140);
assert.equal(resolve(action("涌泉", 90, "本技能能耗每-1，威力+10。", { pp: 4 }), { currentSkillCost: 2 }).power, 110);
assert.equal(resolve(action("吹火", 60, "本技能每次使用后，威力永久+20。"), { skillUseCount: 2 }).power, 100);
assert.equal(resolve(action("聚盐", 30, "2连击，使用后本技能连击数永久+1。"), { skillUseCount: 3 }).hitCount, 5);
assert.equal(resolve(action("技巧打击", 35, "造成物伤，应对状态：本次技能威力变为10倍。")).responsePower, 350);
assert.equal(resolve(action("龙卷风", 70, "造成物伤，迅捷，应对状态：本次技能威力变为1.5倍。")).responsePower, 105);
assert.equal(resolve(action("灾厄", 60, "对自己造成60威力物伤。应对状态：改为对敌方造成180威力物伤。")).responsePower, 180);
assert.equal(resolve(action("扇风", 75, "造成物伤，若先于敌方攻击，本次技能威力+50%。"), {
  attackerStats: { spe: 201 },
  defenderStats: { spe: 200 }
}).power, 113);
assert.equal(resolve(action("疾风刺", 25, "造成物伤，1连击，若先于敌方攻击，改为3连击。"), {
  attackerStats: { spe: 201 },
  defenderStats: { spe: 200 }
}).hitCount, 3);
assert.equal(resolve(action("垂死反击", 80, "自己每失去5%生命，本次技能威力+5。"), { attackerHpPercent: 70 }).power, 110);
assert.equal(resolve(action("燃尽", 155, "敌方每失去5%生命，本次技能威力-5。"), { defenderHpPercent: 80 }).power, 135);
assert.equal(resolve(action("碎冰冰", 40, "敌方每有1层冻结，本次技能威力+20。"), { statusLayers: { freeze: 3 } }).power, 100);
assert.equal(resolve(action("鸩毒", 75, "敌方每有1层中毒效果，本次技能威力+10，应对状态：改为本次威力+20。"), { statusLayers: { poison: 4 } }).power, 115);
assert.equal(resolve(action("鸩毒", 75, "敌方每有1层中毒效果，本次技能威力+10，应对状态：改为本次威力+20。"), { statusLayers: { poison: 4 } }).responsePower, 155);
assert.equal(resolve(action("多维击打", 15, "1连击，敌方每有1层星陨印记，本次技能连击数+1。"), { statusLayers: { starfall: 2 } }).hitCount, 3);
assert.equal(resolve(action("光能聚集", 100, "每次使用其他草系技能后，本技能威力永久+60。"), { relatedTypeSkillUseCount: 2 }).power, 220);
assert.equal(resolve(action("山火", 15, "每使用1次其他火系技能，本技能威力永久翻倍。"), { relatedTypeSkillUseCount: 2 }).power, 60);
assert.equal(resolve(action("落雷", 35, "每次入场，本技能威力永久+40。"), { entryCount: 3 }).power, 155);
assert.equal(resolve(action("当头棒喝", 80, "若敌方本回合更换精灵，本次技能威力+100。"), { defenderSwitched: true }).power, 180);
assert.equal(resolve(action("破罐破摔", 80, "自己有减益时，本次技能威力+60。"), { attackerHasDebuff: true }).power, 140);
assert.equal(resolve(action("天光", 95, "本技能系别和天气系别相同。", { type: "light" }), { weatherType: "water" }).type, "water");
assert.equal(resolve(action("电弧", 80, "迸发：本次技能威力+40。"), { burstActive: true }).power, 120);
assert.equal(resolve(action("雷暴", 55, "迸发：本技能获得所有生效过的迸发，每获得1种，本技能能耗+1，威力+10。"), { burstActive: true, burstEffectCount: 3 }).power, 85);
assert.equal(resolve(action("见招拆招", 65, "若上回合使用状态技能，本次技能威力+55。"), { previousUsedStatusSkill: true }).power, 120);
assert.equal(resolve(action("气势一击", 80, "若上回合应对成功，本次技能威力+180。"), { previousResponseSuccess: true }).power, 260);
assert.equal(resolve(action("绵里藏针", 60, "若自己上回合未攻击敌方并造成伤害，本技能威力每回合永久+20。"), { turnsWithoutDamage: 2 }).power, 100);
assert.equal(resolve(action("流星火雨", 75, "每次击败敌方，本技能威力永久+75。"), { defeatCount: 2 }).power, 225);
assert.equal(resolve(action("阳火增辉", 75, "每次击败敌方，本技能威力永久翻倍。"), { defeatCount: 2 }).power, 300);
assert.equal(resolve(action("牵连", 85, "敌方每有1只力竭精灵，本次技能威力+30。"), { defenderFaintedCount: 2 }).power, 145);
assert.equal(resolve(action("虫鸣", 15, "队伍中的精灵每携带1个虫鸣，本次技能连击数+1。"), { teamSkillCopies: { "虫鸣": 4 } }).hitCount, 5);
assert.equal(resolve(action("月光合奏", 30, "1连击，双方携带的所有精灵每有1层萌化，本次技能连击数+1。"), { statusLayers: { cuteTotal: 3 } }).hitCount, 4);
assert.equal(resolve(action("极寒领域", 105, "若敌方有冻结，本次技能威力+60。"), { statusLayers: { freeze: 1 } }).power, 165);
assert.equal(resolve(action("超级糖果", 100, "自己获得萌化：本次技能威力+60。")).power, 160);
assert.equal(resolve(action("满能炮", 40, "自己每有1能量，本次技能威力+10。"), { attackerEnergy: 7 }).power, 110);
assert.equal(resolve(action("收割", 80, "若敌方生命低于50%，本次技能威力+60。"), { defenderHpPercent: 40 }).power, 140);
assert.equal(resolve(action("高压冲撞", 60, "速度每高于对手50，本次技能威力+20。"), {
  attackerStats: { spe: 230 },
  defenderStats: { spe: 100 }
}).power, 100);
assert.equal(resolve(action("铁壁撞击", 60, "物防每高于对手50，本次技能威力+20。"), {
  attackerStats: { defense: 260 },
  defenderStats: { defense: 100 }
}).power, 120);
assert.equal(resolve(action("疾速切割", 10, "本技能威力等于自己速度的50%。"), { attackerStats: { spe: 260 } }).power, 130);
assert.equal(resolve(action("折射", 40, "应对状态：本技能威力等于被应对技能威力。"), { respondedSkillPower: 145 }).responsePower, 145);
assert.equal(resolve(action("同调射线", 70, "己方每携带1个光系技能，本次技能威力+10。"), {
  attackerSelectedSkills: [{ type: "light" }, { type: "light" }, { type: "water" }]
}).power, 90);
assert.equal(resolve(action("穿膛", 65, "造成物伤，若敌方能量小于等于2，造成5倍伤害。"), { defenderEnergy: 2 }).damageMultiplier, 5);
assert.equal(resolve(action("电弧", 80, "造成物伤，进发：本次技能威力+40。"), { burstActive: true }).power, 120);
assert.equal(resolve(action("雷暴", 55, "造成魔伤，进发：本技能获得所有生效过的进发效果,每获得一种,本技能能耗+1,威力+10"), { burstActive: true, burstEffectCount: 3 }).power, 85);
assert.equal(resolve(action("触底强击", 95, "造成魔伤，释放后若能量耗尽，本次攻击威力+110。", { pp: 4 }), { attackerEnergy: 4 }).power, 205);
assert.equal(resolve(action("草虫冲击", 80, "造成物伤,若敌方本回合更换精灵,本次威力+50且无视敌方系别抵抗"), { defenderSwitched: true }).power, 130);
assert.equal(resolve(action("灵光", 25, "造成魔伤，3连击，若敌方本回合替换精灵，本次技能连击数翻倍。"), { defenderSwitched: true }).hitCount, 6);
assert.equal(resolve(action("逆袭", 100, "造成物伤，本技能能耗每+1，威力+50。", { pp: 3 }), { currentSkillCost: 5 }).power, 200);
assert.equal(resolve(action("能量刃", 80, "造成物伤，每应对成功1次，本技能威力永久+90。"), { responseSuccessCount: 2 }).power, 260);
assert.equal(resolve(action("齿轮扭矩", 80, "造成物伤，每回合位置变化时，本技能威力永久+20。"), { positionChangeCount: 3 }).power, 140);
assert.equal(resolve(action("过曝", 60, "造成魔伤，每使用过1个其他系别技能，本技能威力永久+30。"), { otherTypeSkillUseCount: 2 }).power, 120);
assert.equal(resolve(action("钢钻", 0, "造成物伤，技能威力为两侧技能威力和的三分之一，传动1。"), { adjacentSkillPowers: [130, 80] }).power, 70);
assert.equal(resolve(action("绵里藏针", 60, "造成魔伤，若敌方上回合没受到技能伤害，本技能威力永久+20。"), { defenderTurnsWithoutSkillDamage: 2 }).power, 100);

assert.equal(resolve(action("色散", 70, "造成魔伤，若敌方为混合血脉精灵，本次技能造成伤害+50%。"), { defenderMixedBlood: true }).damageMultiplier, 1.5);
assert.equal(resolve(action("色散", 70, "造成魔伤，若敌方为混合血脉精灵，本次技能造成伤害+50%。"), { defenderMixedBlood: false }).damageMultiplier, 1);
assert.equal(resolve(action("铁蒺藜", 80, "造成物伤，应对状态：本次伤害翻倍。")).responseDamageMultiplier, 2);
assert.equal(resolve(action("趁火打劫", 70, "造成物伤，若击败敌方，本技能连击数永久+2。"), { defeatCount: 2 }).hitCount, 5);
assert.equal(resolve(action("草虫冲击", 80, "造成物伤，若敌方本回合更换精灵，本次威力+50且无视敌方系别抵抗。"), { defenderSwitched: true }).ignoreResistance, true);
assert.equal(resolve(action("虫击", 60, "造成物伤，应对状态：本次技能威力变为2倍，无视敌方系别抵抗。")).responseIgnoreResistance, true);

console.log("pvp variable damage rules ok");
