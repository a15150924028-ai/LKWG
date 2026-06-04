(function initPvpDamageRules(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.LKWG_PVP_DAMAGE_RULES = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function buildPvpDamageRules() {
  const DEFAULT_ENERGY = 10;

  function numberValue(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clampEnergy(value, fallback = DEFAULT_ENERGY) {
    return Math.max(0, Math.min(10, numberValue(value, fallback)));
  }

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, "");
  }

  function actionText(action) {
    return `${action?.name || ""} ${action?.description || ""} ${action?.effect || ""}`;
  }

  function addLabel(labels, label) {
    if (label && !labels.includes(label)) labels.push(label);
  }

  function parseFixedHitCount(text) {
    const match = text.match(/(\d+)连击/);
    return match ? Math.max(1, Number(match[1])) : 1;
  }

  function skillInSlot(skillIndex, slots) {
    return slots.includes(Number(skillIndex));
  }

  function selectedSkillEnergyTotal(skills) {
    if (!Array.isArray(skills)) return null;
    const usable = skills.filter(Boolean);
    if (!usable.length) return null;
    return usable.reduce((sum, skill) => sum + Math.max(0, numberValue(skill.pp, 0)), 0);
  }

  function layerValue(context, key) {
    return Math.max(0, Math.round(numberValue(context?.statusLayers?.[key], 0)));
  }

  function resolvePvpVariableDamage(action, context = {}) {
    const text = cleanText(actionText(action));
    const labels = [];
    let power = Math.max(0, numberValue(action?.power, 0));
    let type = action?.type || null;
    let hitCount = parseFixedHitCount(text);
    let damageMultiplier = 1;
    let responsePower = null;
    const basePower = power;

    if (/位于1号或3号位时连击\+1/.test(text) && skillInSlot(context.skillIndex, [0, 2])) {
      hitCount += 1;
      addLabel(labels, "1/3号位连击+1");
    }

    const positionPowerRules = [
      { pattern: /位于1号位时.*威力\+60/, slots: [0], add: 60, label: "1号位威力+60" },
      { pattern: /位于1号位时.*威力\+90/, slots: [0], add: 90, label: "1号位威力+90" },
      { pattern: /位于3号位时.*威力\+40/, slots: [2], add: 40, label: "3号位威力+40" },
      { pattern: /位于1号或3号位时.*威力\+30/, slots: [0, 2], add: 30, label: "1/3号位威力+30" }
    ];
    for (const rule of positionPowerRules) {
      if (rule.pattern.test(text) && skillInSlot(context.skillIndex, rule.slots)) {
        power += rule.add;
        addLabel(labels, rule.label);
      }
    }

    const attackerStats = context.attackerStats || {};
    const defenderStats = context.defenderStats || {};
    const speedDiff = numberValue(attackerStats.spe) - numberValue(defenderStats.spe);
    if (/速度高于对手271及以上时.*威力提升至200/.test(text)) {
      power = speedDiff >= 271 ? 200 : 60;
      addLabel(labels, speedDiff >= 271 ? "速度差>=271，威力200" : "速度差<271，威力60");
    }

    const defenseDiff = numberValue(attackerStats.defense) - numberValue(defenderStats.defense);
    if (/物防高于对手271及以上时.*威力提升至200/.test(text)) {
      power = defenseDiff >= 271 ? 200 : 60;
      addLabel(labels, defenseDiff >= 271 ? "物防差>=271，威力200" : "物防差<271，威力60");
    }

    const actsBeforeDefender = numberValue(attackerStats.spe) > numberValue(defenderStats.spe);
    if (/先于敌方攻击.*威力\+50%/.test(text) && actsBeforeDefender) {
      power = Math.round(power * 1.5);
      addLabel(labels, "先于敌方攻击，威力+50%");
    }
    if (/先于敌方攻击.*改为3连击/.test(text) && actsBeforeDefender) {
      hitCount = 3;
      addLabel(labels, "先于敌方攻击，改为3连击");
    }

    const attackerEnergy = clampEnergy(context.attackerEnergy, context.defaultEnergy ?? DEFAULT_ENERGY);
    const defenderEnergy = clampEnergy(context.defenderEnergy, context.defaultEnergy ?? DEFAULT_ENERGY);
    if (/敌方能量不高于2.*造成5倍伤害/.test(text) && defenderEnergy <= 2) {
      damageMultiplier *= 5;
      addLabel(labels, "敌方能量<=2，伤害×5");
    }
    if (/敌方能量等于0.*造成20倍伤害/.test(text) && defenderEnergy === 0) {
      damageMultiplier *= 20;
      addLabel(labels, "敌方能量=0，伤害×20");
    }
    if (/使用后若能量耗尽.*威力\+120/.test(text)) {
      const cost = Math.max(0, numberValue(action?.pp, 0));
      if (attackerEnergy - cost <= 0) {
        power += 120;
        addLabel(labels, "使用后能量耗尽，威力+120");
      }
    }
    if (/敌方每有1能量.*威力-10%/.test(text)) {
      const multiplier = Math.max(0, 1 - defenderEnergy * 0.1);
      power = Math.max(1, Math.round(power * multiplier));
      addLabel(labels, `敌方${defenderEnergy}能量，威力${Math.round(multiplier * 100)}%`);
    }

    if (/能耗每-1.*威力\+10/.test(text)) {
      const baseCost = Math.max(0, numberValue(action?.pp, 0));
      const currentCost = Math.max(0, numberValue(context.currentSkillCost, baseCost));
      const costReduction = Math.max(0, baseCost - currentCost);
      if (costReduction > 0) {
        power += costReduction * 10;
        addLabel(labels, `能耗-${costReduction}，威力+${costReduction * 10}`);
      }
    }

    const skillUseCount = Math.max(0, Math.round(numberValue(context.skillUseCount, 0)));
    const permanentPowerMatch = text.match(/每次使用后.*威力永久\+(\d+)/);
    if (permanentPowerMatch && skillUseCount > 0) {
      const powerAdd = Number(permanentPowerMatch[1]) * skillUseCount;
      power += powerAdd;
      addLabel(labels, `已使用${skillUseCount}次，威力+${powerAdd}`);
    }
    if (/连击数永久\+1/.test(text) && skillUseCount > 0) {
      hitCount += skillUseCount;
      addLabel(labels, `已使用${skillUseCount}次，连击+${skillUseCount}`);
    }

    if (/冰锋横扫/.test(text) || /威力等于敌方.*能耗总和.*10/.test(text)) {
      const energyTotal = selectedSkillEnergyTotal(context.defenderSelectedSkills);
      if (energyTotal != null) {
        power = Math.max(1, energyTotal * 10);
        addLabel(labels, `敌方技能能耗总和${energyTotal}，威力${power}`);
      }
    }

    const attackerHpPercent = numberValue(context.attackerHpPercent, 100);
    if (/生命高于80%.*威力\+75/.test(text) && attackerHpPercent > 80) {
      power += 75;
      addLabel(labels, "生命>80%，威力+75");
    }

    const attackerLostSteps = Math.floor(Math.max(0, 100 - attackerHpPercent) / 5);
    if (/自己每失去5%生命.*威力\+5/.test(text) && attackerLostSteps > 0) {
      const powerAdd = attackerLostSteps * 5;
      power += powerAdd;
      addLabel(labels, `己方损失${attackerLostSteps * 5}%生命，威力+${powerAdd}`);
    }
    const defenderHpPercent = numberValue(context.defenderHpPercent, 100);
    const defenderLostSteps = Math.floor(Math.max(0, 100 - defenderHpPercent) / 5);
    if (/敌方每失去5%生命.*威力-5/.test(text) && defenderLostSteps > 0) {
      const powerDrop = defenderLostSteps * 5;
      power = Math.max(1, power - powerDrop);
      addLabel(labels, `敌方损失${defenderLostSteps * 5}%生命，威力-${powerDrop}`);
    }

    const freezeLayers = layerValue(context, "freeze");
    if (/敌方每有1层冻结.*威力\+20/.test(text) && freezeLayers > 0) {
      const powerAdd = freezeLayers * 20;
      power += powerAdd;
      addLabel(labels, `冻结${freezeLayers}层，威力+${powerAdd}`);
    }
    const poisonLayers = layerValue(context, "poison");
    if (/敌方每有1层中毒.*威力\+10/.test(text) && poisonLayers > 0) {
      const powerAdd = poisonLayers * 10;
      power += powerAdd;
      addLabel(labels, `中毒${poisonLayers}层，威力+${powerAdd}`);
    }
    if (/敌方每有1层中毒.*应对状态.*威力\+20/.test(text) && poisonLayers > 0) {
      responsePower = basePower + poisonLayers * 20;
    }
    const starfallLayers = layerValue(context, "starfall");
    if (/敌方每有1层星陨印记.*连击数\+1/.test(text) && starfallLayers > 0) {
      hitCount += starfallLayers;
      addLabel(labels, `星陨印记${starfallLayers}层，连击+${starfallLayers}`);
    }

    const relatedTypeSkillUseCount = Math.max(0, Math.round(numberValue(context.relatedTypeSkillUseCount, 0)));
    const relatedPowerMatch = text.match(/每(?:次)?使用(?:过)?(?:1(?:个|次))?其他[^，。]*技能.*威力永久\+(\d+)/);
    if (relatedPowerMatch && relatedTypeSkillUseCount > 0) {
      const powerAdd = Number(relatedPowerMatch[1]) * relatedTypeSkillUseCount;
      power += powerAdd;
      addLabel(labels, `其他同系技能${relatedTypeSkillUseCount}次，威力+${powerAdd}`);
    }
    if (/每使用1次其他[^，。]*技能.*威力永久翻倍/.test(text) && relatedTypeSkillUseCount > 0) {
      power *= 2 ** relatedTypeSkillUseCount;
      addLabel(labels, `其他同系技能${relatedTypeSkillUseCount}次，威力翻${2 ** relatedTypeSkillUseCount}倍`);
    }
    const entryCount = Math.max(0, Math.round(numberValue(context.entryCount, 0)));
    const entryPowerMatch = text.match(/每次入场.*威力永久\+(\d+)/);
    if (entryPowerMatch && entryCount > 0) {
      const powerAdd = Number(entryPowerMatch[1]) * entryCount;
      power += powerAdd;
      addLabel(labels, `入场${entryCount}次，威力+${powerAdd}`);
    }
    if (/敌方本回合更换精灵.*威力\+100/.test(text) && context.defenderSwitched) {
      power += 100;
      addLabel(labels, "敌方换宠，威力+100");
    }
    if (/自己有减益.*威力\+60/.test(text) && context.attackerHasDebuff) {
      power += 60;
      addLabel(labels, "己方有减益，威力+60");
    }
    if (/技能系别和天气系别相同/.test(text) && context.weatherType) {
      type = context.weatherType;
      addLabel(labels, "技能系别改为天气系别");
    }

    const responseMultiplierMatch = text.match(/应对状态.*本次技能威力变为(\d+(?:\.\d+)?)倍/);
    if (responseMultiplierMatch) {
      responsePower = Math.max(1, Math.round(basePower * Number(responseMultiplierMatch[1])));
    }
    if (/应对状态.*威力翻倍/.test(text) || /应对状态.*本次技能威力翻倍/.test(text)) {
      responsePower = Math.max(1, Math.round(basePower * 2));
    }
    const responseFixedPowerMatch = text.match(/应对状态.*对敌方造成(\d+)威力/);
    if (responseFixedPowerMatch) {
      responsePower = Math.max(1, Number(responseFixedPowerMatch[1]));
    }

    return {
      power: Math.max(1, Math.round(power)),
      type,
      hitCount: Math.max(1, Math.round(hitCount)),
      responsePower,
      damageMultiplier,
      labels
    };
  }

  return {
    DEFAULT_ENERGY,
    resolvePvpVariableDamage
  };
});
