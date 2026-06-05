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

  const STAT_NAME_TO_KEY = {
    "生命": "hp",
    "物攻": "atk",
    "物防": "defense",
    "魔攻": "spa",
    "魔防": "spd",
    "速度": "spe"
  };

  const TYPE_NAME_TO_KEY = {
    "草": "grass",
    "水": "water",
    "火": "fire",
    "电": "electric",
    "毒": "poison",
    "幻": "fantasy",
    "冰": "ice",
    "武": "fighting",
    "萌": "cute",
    "光": "light",
    "龙": "dragon",
    "机械": "mechanical",
    "幽": "ghost",
    "恶": "demon",
    "虫": "bug",
    "普通": "normal",
    "翼": "wing",
    "地": "ground"
  };

  function statValue(stats, statName) {
    const key = STAT_NAME_TO_KEY[statName];
    return key ? numberValue(stats?.[key], 0) : 0;
  }

  function countSelectedSkillsByType(skills, typeName) {
    const typeKey = TYPE_NAME_TO_KEY[typeName] || typeName;
    if (!typeKey || !Array.isArray(skills)) return 0;
    return skills.filter((skill) => skill?.type === typeKey).length;
  }

  function resolvePvpVariableDamage(action, context = {}) {
    const text = cleanText(actionText(action));
    const labels = [];
    let power = Math.max(0, numberValue(action?.power, 0));
    let type = action?.type || null;
    let hitCount = parseFixedHitCount(text);
    let damageMultiplier = 1;
    let responseDamageMultiplier = 1;
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
    if (/混合血脉.*(?:伤害|造成伤害)\+50%/.test(text) && context.defenderMixedBlood) {
      damageMultiplier *= 1.5;
      addLabel(labels, "敌方混合血脉，伤害+50%");
    }
    if (/敌方能量(?:不高于|小于等于)2.*造成5倍伤害/.test(text) && defenderEnergy <= 2) {
      damageMultiplier *= 5;
      addLabel(labels, "敌方能量<=2，伤害×5");
    }
    if (/敌方能量等于0.*造成20倍伤害/.test(text) && defenderEnergy === 0) {
      damageMultiplier *= 20;
      addLabel(labels, "敌方能量=0，伤害×20");
    }
    const energyEmptyPowerMatch = text.match(/(?:使用后|释放后)若能量耗尽.*(?:威力|攻击威力)\+(\d+)/);
    if (energyEmptyPowerMatch) {
      const cost = Math.max(0, numberValue(action?.pp, 0));
      if (attackerEnergy - cost <= 0) {
        const powerAdd = Number(energyEmptyPowerMatch[1]);
        power += powerAdd;
        addLabel(labels, `使用后能量耗尽，威力+${powerAdd}`);
      }
    }
    if (/敌方每有1能量.*威力-10%/.test(text)) {
      const multiplier = Math.max(0, 1 - defenderEnergy * 0.1);
      power = Math.max(1, Math.round(power * multiplier));
      addLabel(labels, `敌方${defenderEnergy}能量，威力${Math.round(multiplier * 100)}%`);
    }
    const selfEnergyPowerMatch = text.match(/(?:自己|自身|己方)每有1(?:点)?能量.*威力\+(\d+)/);
    if (selfEnergyPowerMatch && attackerEnergy > 0) {
      const powerAdd = Number(selfEnergyPowerMatch[1]) * attackerEnergy;
      power += powerAdd;
      addLabel(labels, `己方${attackerEnergy}能量，威力+${powerAdd}`);
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
    const costIncreasePowerMatch = text.match(/能耗每\+1.*威力\+(\d+)/);
    if (costIncreasePowerMatch) {
      const baseCost = Math.max(0, numberValue(action?.pp, 0));
      const currentCost = Math.max(0, numberValue(context.currentSkillCost, baseCost));
      const costIncrease = Math.max(0, currentCost - baseCost);
      if (costIncrease > 0) {
        const powerAdd = costIncrease * Number(costIncreasePowerMatch[1]);
        power += powerAdd;
        addLabel(labels, `能耗+${costIncrease}，威力+${powerAdd}`);
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
    const responseSuccessCount = Math.max(0, Math.round(numberValue(context.responseSuccessCount, 0)));
    const responseSuccessPowerMatch = text.match(/每应对成功1次.*威力永久\+(\d+)/);
    if (responseSuccessPowerMatch && responseSuccessCount > 0) {
      const powerAdd = responseSuccessCount * Number(responseSuccessPowerMatch[1]);
      power += powerAdd;
      addLabel(labels, `应对成功${responseSuccessCount}次，威力+${powerAdd}`);
    }
    const positionChangeCount = Math.max(0, Math.round(numberValue(context.positionChangeCount, 0)));
    const positionChangePowerMatch = text.match(/每回合位置变化时.*威力永久\+(\d+)/);
    if (positionChangePowerMatch && positionChangeCount > 0) {
      const powerAdd = positionChangeCount * Number(positionChangePowerMatch[1]);
      power += powerAdd;
      addLabel(labels, `位置变化${positionChangeCount}次，威力+${powerAdd}`);
    }
    const otherTypeSkillUseCount = Math.max(0, Math.round(numberValue(context.otherTypeSkillUseCount, 0)));
    const otherTypePowerMatch = text.match(/每使用过?1个其他系别技能.*威力永久\+(\d+)/);
    if (otherTypePowerMatch && otherTypeSkillUseCount > 0) {
      const powerAdd = otherTypeSkillUseCount * Number(otherTypePowerMatch[1]);
      power += powerAdd;
      addLabel(labels, `其他系别技能${otherTypeSkillUseCount}个，威力+${powerAdd}`);
    }

    if (/冰锋横扫/.test(text) || /威力等于敌方.*能耗总和.*10/.test(text)) {
      const energyTotal = selectedSkillEnergyTotal(context.defenderSelectedSkills);
      if (energyTotal != null) {
        power = Math.max(1, energyTotal * 10);
        addLabel(labels, `敌方技能能耗总和${energyTotal}，威力${power}`);
      }
    }
    if (/两侧技能威力和的三分之一/.test(text) && Array.isArray(context.adjacentSkillPowers)) {
      const adjacentSum = context.adjacentSkillPowers.reduce((sum, item) => sum + Math.max(0, numberValue(item, 0)), 0);
      if (adjacentSum > 0) {
        power = Math.max(1, Math.round(adjacentSum / 3));
        addLabel(labels, `两侧威力和${adjacentSum}，威力${power}`);
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
    const defenderLowHpPowerMatch = text.match(/敌方生命低于(\d+)%.*威力\+(\d+)/);
    if (defenderLowHpPowerMatch && defenderHpPercent < Number(defenderLowHpPowerMatch[1])) {
      const powerAdd = Number(defenderLowHpPowerMatch[2]);
      power += powerAdd;
      addLabel(labels, `敌方生命<${defenderLowHpPowerMatch[1]}%，威力+${powerAdd}`);
    }

    const statPowerMatch = text.match(/本技能威力等于(?:自己|自身|己方)?(生命|物攻|魔攻|物防|魔防|速度)的(\d+)%/);
    if (statPowerMatch) {
      const source = statValue(attackerStats, statPowerMatch[1]);
      const percent = Number(statPowerMatch[2]);
      power = Math.max(1, Math.round(source * percent / 100));
      addLabel(labels, `${statPowerMatch[1]}${percent}%，威力${power}`);
    }

    const statDiffRules = [
      { name: "速度", diff: speedDiff },
      { name: "物防", diff: defenseDiff },
      { name: "物攻", diff: numberValue(attackerStats.atk) - numberValue(defenderStats.atk) },
      { name: "魔攻", diff: numberValue(attackerStats.spa) - numberValue(defenderStats.spa) },
      { name: "魔防", diff: numberValue(attackerStats.spd) - numberValue(defenderStats.spd) }
    ];
    for (const rule of statDiffRules) {
      const diffMatch = text.match(new RegExp(`${rule.name}每高于对手(\\d+).*威力\\+(\\d+)`));
      if (diffMatch && rule.diff > 0) {
        const steps = Math.floor(rule.diff / Number(diffMatch[1]));
        if (steps > 0) {
          const powerAdd = steps * Number(diffMatch[2]);
          power += powerAdd;
          addLabel(labels, `${rule.name}差${rule.diff}，威力+${powerAdd}`);
        }
      }
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
    const defenderSwitchPowerMatch = text.match(/敌方本回合(?:更换|替换)精灵.*(?:本次)?威力\+(\d+)/);
    if (defenderSwitchPowerMatch && context.defenderSwitched) {
      const powerAdd = Number(defenderSwitchPowerMatch[1]);
      power += powerAdd;
      addLabel(labels, `敌方换宠，威力+${powerAdd}`);
    }
    if (/敌方本回合(?:更换|替换)精灵.*连击数翻倍/.test(text) && context.defenderSwitched) {
      hitCount *= 2;
      addLabel(labels, "敌方换宠，连击翻倍");
    }
    if (/自己有减益.*威力\+60/.test(text) && context.attackerHasDebuff) {
      power += 60;
      addLabel(labels, "己方有减益，威力+60");
    }
    if (/技能系别和天气系别相同/.test(text) && context.weatherType) {
      type = context.weatherType;
      addLabel(labels, "技能系别改为天气系别");
    }

    if (context.burstActive) {
      const burstPowerMatch = text.match(/[迸进]发：.*本次技能威力\+(\d+)/);
      if (burstPowerMatch) {
        const powerAdd = Number(burstPowerMatch[1]);
        power += powerAdd;
        addLabel(labels, `迸发威力+${powerAdd}`);
      }
      if (/[迸进]发：.*每获得(?:1|一)种.*威力\+10/.test(text)) {
        const burstEffectCount = Math.max(0, Math.round(numberValue(context.burstEffectCount, 0)));
        if (burstEffectCount > 0) {
          const powerAdd = burstEffectCount * 10;
          power += powerAdd;
          addLabel(labels, `迸发${burstEffectCount}种，威力+${powerAdd}`);
        }
      }
    }

    if (/上回合使用状态技能.*威力\+55/.test(text) && context.previousUsedStatusSkill) {
      power += 55;
      addLabel(labels, "上回合状态技能，威力+55");
    }
    if (/上回合应对成功.*威力\+180/.test(text) && context.previousResponseSuccess) {
      power += 180;
      addLabel(labels, "上回合应对成功，威力+180");
    }
    const turnsWithoutDamage = Math.max(0, Math.round(numberValue(context.turnsWithoutDamage, 0)));
    const noDamagePowerMatch = text.match(/未攻击敌方并造成伤害.*威力每回合永久\+(\d+)/);
    if (noDamagePowerMatch && turnsWithoutDamage > 0) {
      const powerAdd = Number(noDamagePowerMatch[1]) * turnsWithoutDamage;
      power += powerAdd;
      addLabel(labels, `未造成伤害${turnsWithoutDamage}回合，威力+${powerAdd}`);
    }
    const defenderNoSkillDamageTurns = Math.max(0, Math.round(numberValue(context.defenderTurnsWithoutSkillDamage, 0)));
    const defenderNoSkillDamageMatch = text.match(/敌方上回合没受到技能伤害.*威力永久\+(\d+)/);
    if (defenderNoSkillDamageMatch && defenderNoSkillDamageTurns > 0) {
      const powerAdd = Number(defenderNoSkillDamageMatch[1]) * defenderNoSkillDamageTurns;
      power += powerAdd;
      addLabel(labels, `敌方未受技能伤害${defenderNoSkillDamageTurns}回合，威力+${powerAdd}`);
    }

    const defeatCount = Math.max(0, Math.round(numberValue(context.defeatCount, 0)));
    const defeatPowerMatch = text.match(/每次击败敌方.*威力永久\+(\d+)/);
    if (defeatPowerMatch && defeatCount > 0) {
      const powerAdd = Number(defeatPowerMatch[1]) * defeatCount;
      power += powerAdd;
      addLabel(labels, `击败${defeatCount}次，威力+${powerAdd}`);
    }
    if (/每次击败敌方.*威力永久翻倍/.test(text) && defeatCount > 0) {
      power *= 2 ** defeatCount;
      addLabel(labels, `击败${defeatCount}次，威力翻${2 ** defeatCount}倍`);
    }
    const defeatHitCountMatch = text.match(/(?:若)?击败敌方.*连击数永久\+(\d+)/);
    if (defeatHitCountMatch && defeatCount > 0) {
      const hitAdd = Number(defeatHitCountMatch[1]) * defeatCount;
      hitCount += hitAdd;
      addLabel(labels, `击败${defeatCount}次，连击+${hitAdd}`);
    }

    const defenderFaintedCount = Math.max(0, Math.round(numberValue(context.defenderFaintedCount, 0)));
    if (/敌方每有1只力竭精灵.*威力\+30/.test(text) && defenderFaintedCount > 0) {
      const powerAdd = defenderFaintedCount * 30;
      power += powerAdd;
      addLabel(labels, `敌方力竭${defenderFaintedCount}只，威力+${powerAdd}`);
    }

    const skillCopyCount = Math.max(0, Math.round(numberValue(context.teamSkillCopies?.[action?.name], 0)));
    if (/队伍中的精灵每携带1个.*本次技能连击数\+1/.test(text) && skillCopyCount > 0) {
      hitCount += skillCopyCount;
      addLabel(labels, `${action.name}携带${skillCopyCount}个，连击+${skillCopyCount}`);
    }
    const cuteLayers = layerValue(context, "cuteTotal");
    if (/所有精灵每有1层萌化.*连击数\+1/.test(text) && cuteLayers > 0) {
      hitCount += cuteLayers;
      addLabel(labels, `萌化${cuteLayers}层，连击+${cuteLayers}`);
    }
    if (/敌方有冻结.*威力\+60/.test(text) && freezeLayers > 0) {
      power += 60;
      addLabel(labels, "敌方有冻结，威力+60");
    }
    if (/自己获得萌化.*本次技能威力\+60/.test(text)) {
      power += 60;
      addLabel(labels, "本次技能威力+60");
    }

    const selectedTypePowerMatch = text.match(/(?:己方|自己|队伍).*每携带1个(草|水|火|电|毒|幻|冰|武|萌|光|龙|机械|幽|恶|虫|普通|翼|地)系技能.*威力\+(\d+)/);
    if (selectedTypePowerMatch) {
      const count = countSelectedSkillsByType(context.attackerSelectedSkills, selectedTypePowerMatch[1]);
      if (count > 0) {
        const powerAdd = count * Number(selectedTypePowerMatch[2]);
        power += powerAdd;
        addLabel(labels, `${selectedTypePowerMatch[1]}系技能${count}个，威力+${powerAdd}`);
      }
    }

    const responseMultiplierMatch = text.match(/应对状态.*本次技能威力变为(\d+(?:\.\d+)?)倍/);
    if (responseMultiplierMatch) {
      responsePower = Math.max(1, Math.round(basePower * Number(responseMultiplierMatch[1])));
    }
    if (/应对状态.*威力等于被应对技能威力/.test(text)) {
      const respondedSkillPower = Math.max(0, numberValue(context.respondedSkillPower, 0));
      if (respondedSkillPower > 0) {
        const responseScaleMatch = text.match(/被应对技能威力的(\d+(?:\.\d+)?)倍/);
        const scale = responseScaleMatch ? Number(responseScaleMatch[1]) : 1;
        responsePower = Math.max(1, Math.round(respondedSkillPower * scale));
      }
    }
    if (/应对状态.*威力翻倍/.test(text) || /应对状态.*本次技能威力翻倍/.test(text)) {
      responsePower = Math.max(1, Math.round(basePower * 2));
    }
    const responseDamageMultiplierMatch = text.match(/应对状态.*(?:本次)?伤害(?:变为|造成)?(\d+(?:\.\d+)?)倍/);
    if (responseDamageMultiplierMatch) {
      responseDamageMultiplier = Number(responseDamageMultiplierMatch[1]);
    } else if (/应对状态.*(?:本次)?伤害翻倍/.test(text)) {
      responseDamageMultiplier = 2;
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
      responseDamageMultiplier,
      labels
    };
  }

  return {
    DEFAULT_ENERGY,
    resolvePvpVariableDamage
  };
});
