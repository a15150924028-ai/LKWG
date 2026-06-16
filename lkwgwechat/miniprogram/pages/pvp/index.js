const catalog = require("../../data/catalog");
const { BLOODLINES, NATURES, TALENTS } = require("../../domain/constants");
const statsRules = require("../../domain/stats");
const typeRules = require("../../domain/type-rules");
const teamRules = require("../../domain/team");
const buildRules = require("../../domain/pvp-build");
const { damageCore, damageRules } = require("../../domain/pvp-damage");
const pvpEffects = require("../../domain/pvp-effects");
const pvpTurn = require("../../domain/pvp-turn");
const pvpStateRules = require("../../domain/pvp-state");
const { createStorageAdapter } = require("../../utils/storage");

const storage = createStorageAdapter();
const FORCE_IMPACT_POWER = 80;
function closedFloatingPicker() {
  return {
    visible: false,
    label: "",
    options: [],
    valueIndex: 0,
    valueLabel: blankOption.label,
    dataset: {}
  };
}
const blankOption = { id: "", label: "请选择" };
const bloodlineIds = new Set(BLOODLINES.map((item) => item.id));
const natureIds = new Set(NATURES.map((item) => item.id));
const talentIds = new Set(TALENTS.map((item) => item.id));

function optionsWithBlank(options) {
  return [blankOption, ...options.map((item) => ({
    id: item.id,
    label: item.label || item.name,
    aliases: [...(item.aliases || [])],
    icon: item.icon,
    iconClass: item.iconClass,
    iconText: item.iconText,
    detail: item.detail
  }))];
}

function buildMergedMonsterOptions(team) {
  const normalized = teamRules.normalizeTeam(team, catalog);
  const choices = normalized
    .map((pet, index) => {
      const monster = catalog.getMonster(pet.monsterId);
      if (!monster) return null;
      const monsterOption = catalog.monsterOptions.find((item) => item.id === monster.id) || {};
      return {
        id: `team-pet-${index}`,
        source: "team",
        slot: index,
        pet,
        label: `${index + 1}号位 ${monster.name}`,
        aliases: [monster.name, pet.name, `${index + 1}号位`, `${index + 1}号`].filter(Boolean),
        detail: teamRules.isPetComplete(pet) ? "已配置完整" : "配置未完整",
        icon: monsterOption.icon,
        iconClass: monsterOption.iconClass
      };
    })
    .filter(Boolean);
  return {
    choices,
    options: [
      blankOption,
      ...choices.map((choice) => ({
        id: choice.id,
        source: "team",
        label: choice.label,
        aliases: choice.aliases,
        detail: choice.detail,
        icon: choice.icon,
        iconClass: choice.iconClass
      })),
      ...monsterOptions.slice(1).map((option) => ({
        ...option,
        source: "catalog"
      }))
    ]
  };
}

const monsterOptions = optionsWithBlank(catalog.monsterOptions);
const bloodlineOptions = optionsWithBlank(BLOODLINES);
const natureOptions = optionsWithBlank(NATURES);
const talentOptions = optionsWithBlank(TALENTS);
const weatherOptions = [
  { id: "", label: "无天气", type: "" },
  { id: "rain", label: "雨天", type: "water" },
  { id: "sandstorm", label: "沙暴", type: "ground" },
  { id: "blizzard", label: "雪天", type: "ice" }
];
const statLabels = {
  hp: "生命",
  atk: "物攻",
  defense: "物防",
  spa: "魔攻",
  spd: "魔防",
  spe: "速度"
};

function selection(options, id) {
  const index = Math.max(0, options.findIndex((option) => option.id === id));
  return { index, label: options[index].label };
}

function bloodlineForState(state) {
  return BLOODLINES.find((item) => item.id === state?.bloodlineId) || null;
}

function forceImpactLocked(state) {
  const bloodline = bloodlineForState(state);
  return !bloodline?.type || bloodline.id === "bloodline-boss";
}

function forceImpactSkill(state) {
  const bloodline = bloodlineForState(state);
  if (forceImpactLocked(state)) return null;
  return {
    id: "pvp-force-impact",
    name: "愿力冲击",
    aliases: ["原力冲击"],
    type: bloodline.type,
    category: "attack",
    power: FORCE_IMPACT_POWER,
    description: "仅在选择属性血脉后可用，按血脉属性估算；敌方使用状态技能时伤害×2.5。"
  };
}

function forceImpactOption(state) {
  const skill = forceImpactSkill(state);
  const bloodline = bloodlineForState(state);
  return {
    id: "force",
    locked: !skill,
    active: state?.action === "force",
    label: "愿力冲击 / 原力冲击",
    hint: skill ? "按当前血脉属性" : "选择属性血脉后可用",
    icon: bloodline?.icon || "",
    iconClass: bloodline?.iconClass || ""
  };
}

function pvpActionFromState(state) {
  if (state?.action === "force" || state?.forceImpact) return forceImpactSkill(state);
  return catalog.getSkill(state?.action) || null;
}

function mergeStatMods(...groups) {
  return Object.fromEntries(Object.keys(statLabels).map((key) => [
    key,
    groups.reduce((total, group) => total + (Number(group?.[key]) || 0), 0)
  ]));
}

function sanitizeSide(source, side) {
  const state = pvpStateRules.normalizeSide(source, side);
  const monster = catalog.getMonster(state.monsterId);
  if (!monster) {
    return {
      ...pvpStateRules.defaultSide(side),
      defaultBuildPreset: state.defaultBuildPreset
    };
  }
  const availableSkills = new Set(monster.skillIds);
  const usedTalents = new Set();
  state.bloodlineId = bloodlineIds.has(state.bloodlineId) ? state.bloodlineId : "";
  state.natureId = natureIds.has(state.natureId) ? state.natureId : "";
  state.talentIds = state.talentIds.map((id) => {
    if (!talentIds.has(id) || usedTalents.has(id)) return "";
    usedTalents.add(id);
    return id;
  });
  state.skillIds = state.skillIds.map((id) => availableSkills.has(id) ? id : "");
  state.action = state.action === "force" || state.skillIds.includes(state.action)
    ? state.action
    : "";
  if (forceImpactLocked(state) && state.action === "force") state.action = "";
  state.forceImpact = state.action === "force";
  return state;
}

function effectiveBuild(state, monster) {
  return buildRules.resolveEffectiveBuild({
    side: state.side,
    presetId: state.defaultBuildPreset,
    monster,
    natureId: state.natureId,
    talentIds: state.talentIds
  });
}

function displayedStats(monster, state, action) {
  if (!monster) return null;
  const build = effectiveBuild(state, monster);
  const base = statsRules.calculateFinalStats(monster, build);
  const trait = pvpEffects.trait.resolveTraitEffects(
    monster,
    state.traitLayers,
    action
  );
  const next = { ...base };
  for (const key of Object.keys(next)) {
    const percent = Number(trait.statMods?.[key]) || 0;
    const flat = Number(trait.statFlatMods?.[key]) || 0;
    if (percent) next[key] = Math.max(1, Math.floor(next[key] * (1 + percent)));
    if (flat) next[key] = Math.max(1, Math.round(next[key] + flat));
  }
  return { values: next, build, trait };
}

function statRows(statResult) {
  if (!statResult) return [];
  const pair = statsRules.NATURE_PAIRS[statResult.build.natureId] || [];
  const talented = new Set(
    statResult.build.talentIds.map((id) => statsRules.TALENT_STAT_BY_ID[id])
  );
  return Object.keys(statLabels).map((key) => ({
    key,
    label: statLabels[key],
    value: statResult.values[key],
    natureUp: pair[0] === key,
    natureDown: pair[1] === key,
    talented: talented.has(key)
  }));
}

function sideView(state, allyMonsterOptions = monsterOptions, selectedTeamPetId = "") {
  const monster = catalog.getMonster(state.monsterId);
  const skillOptions = optionsWithBlank(catalog.monsterSkillOptions(state.monsterId));
  const action = pvpActionFromState(state);
  const result = displayedStats(monster, state, action);
  const build = result?.build;
  const traitName = monster ? pvpEffects.trait.traitName(monster) : "";
  const controls = [
    ...Object.keys(statLabels).map((key) => ({
      key: `stat:${key}`,
      label: statLabels[key],
      value: `${Math.round((Number(state.manualStatMods[key]) || 0) * 100)}%`
    })),
    { key: "flatPower", label: "技能威力", value: Number(state.manualDamageBonus) || 0 },
    {
      key: "powerPercent",
      label: "技能威力%",
      value: `${Math.round((Number(state.manualPowerPercentBonus) || 0) * 100)}%`
    },
    { key: "hitCount", label: "连击数", value: Number(state.manualHitCountBonus) || 0 }
  ];
  const currentMonsterOptions = state.side === "ally" ? allyMonsterOptions : monsterOptions;
  const monsterSelectionId = state.side === "ally" && selectedTeamPetId
    ? selectedTeamPetId
    : state.monsterId;
  return {
    ...state,
    title: state.side === "ally" ? "我方" : "敌方",
    monsterOptions: currentMonsterOptions,
    monsterSelection: selection(currentMonsterOptions, monsterSelectionId),
    bloodlineSelection: selection(bloodlineOptions, state.bloodlineId),
    natureSelection: selection(natureOptions, state.natureId),
    talentSelections: state.talentIds.map((id) => selection(talentOptions, id)),
    skillOptions,
    skillSelections: state.skillIds.map((id) => selection(skillOptions, id)),
    skillCards: state.skillIds.map((id, index) => {
      const skill = catalog.getSkill(id);
      return {
        index,
        skillId: id,
        name: skill?.name || "",
        active: Boolean(id && state.action === id),
        selection: selection(skillOptions, id)
      };
    }),
    forceImpact: forceImpactOption(state),
    statRows: statRows(result),
    traitName: traitName || "无层数特性",
    controls,
    presets: buildRules.PRESETS.map((preset) => ({
      ...preset,
      active: Boolean(build?.usesDefaults && state.defaultBuildPreset === preset.id)
    })),
    defaultNote: build?.usesDefaults
      ? `未选择性格、天分时使用：${NATURES.find((item) => item.id === build.natureId)?.name || ""}；${build.talentIds.map((id) => TALENTS.find((item) => item.id === id)?.name || "").join("、")}`
      : "当前性格、天分已手动配置",
    selectedAction: action
  };
}

function damageMode(action, attackerStats, defenderStats) {
  if (action?.category === "physical") return ["atk", "defense", "物理"];
  if (action?.category === "special") return ["spa", "spd", "魔法"];
  if (action?.category === "attack") {
    const physical = attackerStats.atk / Math.max(1, defenderStats.defense);
    const special = attackerStats.spa / Math.max(1, defenderStats.spd);
    return physical >= special
      ? ["atk", "defense", "物理"]
      : ["spa", "spd", "魔法"];
  }
  return ["atk", "defense", "物理"];
}

function effectivenessText(multiplier) {
  if (multiplier > 1) return `克制 ×${multiplier}`;
  if (multiplier < 1) return `抵抗 ×${multiplier}`;
  return "普通效果";
}

function calculateDamageFor(side, state, views) {
  const attackerState = state[side];
  const defenderSide = side === "ally" ? "enemy" : "ally";
  const defenderState = state[defenderSide];
  const attacker = catalog.getMonster(attackerState.monsterId);
  const defender = catalog.getMonster(defenderState.monsterId);
  const action = pvpActionFromState(attackerState);
  const defenderAction = pvpActionFromState(defenderState);
  const attackerView = views.find((view) => view.side === side);
  const defenderView = views.find((view) => view.side === defenderSide);

  if (!attacker || !defender) return { error: "请先选择双方精灵" };
  if (!action) return { error: "请选择本回合技能" };

  const attackerStats = Object.fromEntries(attackerView.statRows.map((row) => [row.key, row.value]));
  const defenderStats = Object.fromEntries(defenderView.statRows.map((row) => [row.key, row.value]));
  const order = pvpTurn.turn.resolveTurnOrder({
    allyAction: side === "ally" ? action : defenderAction,
    enemyAction: side === "enemy" ? action : defenderAction,
    allySpeed: side === "ally" ? attackerStats.spe : defenderStats.spe,
    enemySpeed: side === "enemy" ? attackerStats.spe : defenderStats.spe,
    random: () => 0.25
  });
  const actsBeforeDefender = order.first === side;
  const variable = damageRules.resolvePvpVariableDamage(action, {
    attackerStats,
    defenderStats,
    actsBeforeDefender,
    respondedSkillPower: Number(defenderAction?.power) || 0,
    currentEnergy: attackerState.energy,
    attackerEnergy: attackerState.energy,
    defenderEnergy: defenderState.energy,
    attackerCurrentHp: attackerState.currentHp,
    attackerMaxHp: attackerStats.hp,
    defenderCurrentHp: defenderState.currentHp,
    defenderMaxHp: defenderStats.hp,
    canGainCuteLayer: true,
    attackerCuteLayers: attackerState.cuteLayers,
    cuteTotal: attackerState.cuteLayers,
    defaultEnergy: pvpStateRules.DEFAULT_ENERGY
  }) || {};
  const isAttack = ["physical", "special", "attack"].includes(action.category);
  const response = pvpTurn.turn.canRespondToAction(action, defenderAction);
  const responseOnly = !isAttack && Boolean(variable.responsePower);
  if (!isAttack && !variable.powerRuleMatched && !responseOnly) {
    return { error: `${action.name} 暂无可计算威力`, description: action.description };
  }
  if (responseOnly && !response.success) {
    return { error: `${action.name} 需要对手选择可应对的攻击技能`, description: action.description };
  }

  const [attackKey, defenseKey, modeLabel] = damageMode(action, attackerStats, defenderStats);
  const damageType = variable.type || action.type;
  const rawTypeMultiplier = typeRules.combinedDefenseMultiplier(
    damageType,
    defender.types
  );
  const typeMultiplier = variable.ignoreResistance && rawTypeMultiplier < 1
    ? 1
    : rawTypeMultiplier;
  const attackerTrait = attackerView
    ? displayedStats(attacker, attackerState, action).trait
    : { statMods: {}, flatPower: 0, powerMultiplier: 1, hitCountAdd: 0 };
  const defenderTrait = defenderView
    ? displayedStats(defender, defenderState, defenderAction).trait
    : { statMods: {} };
  const attackerMods = mergeStatMods(attackerTrait.statMods, attackerState.manualStatMods);
  const defenderMods = mergeStatMods(defenderTrait.statMods, defenderState.manualStatMods);
  const abilityLevel = damageCore.abilityLevelMultiplier(
    attackerMods,
    defenderMods,
    attackKey,
    defenseKey
  );
  const baseHitCount = Math.max(1, Number(variable.hitCount) || 1);
  const hitCountBonus = variable.canReceiveHitCountBonus
    ? (Number(attackerTrait.hitCountAdd) || 0) + (Number(attackerState.manualHitCountBonus) || 0)
    : 0;
  const result = damageCore.calculateDamage({
    attack: attackerStats[attackKey],
    defense: defenderStats[defenseKey],
    skillPower: Math.max(
      1,
      Number(responseOnly ? variable.responsePower : variable.power)
        || Number(action.power)
        || 1
    ),
    flatPowerAdd: (Number(attackerTrait.flatPower) || 0)
      + (Number(attackerState.manualDamageBonus) || 0),
    abilityLevel,
    powerBuffPercent: (Number(attackerTrait.powerMultiplier) || 1) - 1
      + (Number(attackerState.manualPowerPercentBonus) || 0),
    stabMultiplier: attacker.types.includes(damageType) ? 1.25 : 1,
    typeMultiplier,
    weatherMultiplier: pvpTurn.weather.weatherPowerMultiplier(state.weather, {
      ...action,
      type: damageType
    }),
    skillDamageMultiplier: action.id === "pvp-force-impact" && response.success
      ? 2.5
      : (Number(responseOnly ? variable.responseDamageMultiplier : variable.damageMultiplier) || 1),
    hitCount: Math.max(1, baseHitCount + hitCountBonus)
  });

  return {
    actionName: action.name,
    description: action.description || "暂无技能描述",
    modeLabel,
    power: result.effectivePower,
    hitCount: result.hitCount,
    singleDamage: result.singleDamage,
    damage: result.damage,
    effectiveness: effectivenessText(typeMultiplier),
    orderText: order.first
      ? `${order.first === "ally" ? "我方" : "敌方"}先手`
      : "等待双方技能"
  };
}

Page({
  data: {
    monsterOptions,
    bloodlineOptions,
    natureOptions,
    talentOptions,
    weatherOptions,
    allyMonsterOptions: monsterOptions,
    weather: "",
    pickerScrollLocked: false,
    floatingPicker: closedFloatingPicker(),
    sides: []
  },

  onShow() {
    this.refreshAllyMonsterOptions();
    const saved = storage.loadPvp(pvpStateRules.normalizePvpState);
    this.applyState(saved || pvpStateRules.defaultPvpState(), false);
  },

  refreshAllyMonsterOptions() {
    const { choices, options } = buildMergedMonsterOptions(storage.loadTeam(catalog));
    this.teamPetChoices = choices;
    this.allyMonsterOptions = options;
    if (!choices.some((choice) => choice.id === this.selectedTeamPetId)) {
      this.selectedTeamPetId = "";
    }
  },

  currentState() {
    return this.pvpState || pvpStateRules.defaultPvpState();
  },

  applyState(next, save = true) {
    const normalized = pvpStateRules.normalizePvpState(next);
    normalized.ally = sanitizeSide(normalized.ally, "ally");
    normalized.enemy = sanitizeSide(normalized.enemy, "enemy");
    this.pvpState = normalized;
    const allyMonsterOptions = this.allyMonsterOptions || monsterOptions;
    const sides = [
      sideView(normalized.ally, allyMonsterOptions, this.selectedTeamPetId || ""),
      sideView(normalized.enemy, allyMonsterOptions, "")
    ];
    const sidesWithResults = sides.map((side) => ({
      ...side,
      result: calculateDamageFor(side.side, normalized, sides)
    }));
    if (save) storage.savePvp(normalized);
    this.setData({
      weather: normalized.weather,
      weatherOptions: weatherOptions.map((item) => ({
        ...item,
        active: item.id === normalized.weather
      })),
      allyMonsterOptions,
      sides: sidesWithResults
    });
  },

  mutateSide(side, update) {
    const next = pvpTurn.history.cloneState(this.currentState());
    update(next[side]);
    this.applyState(next);
  },

  clearImportedTeamPet(side) {
    if (side === "ally") this.selectedTeamPetId = "";
  },

  onMonsterChange(event) {
    const side = event.currentTarget.dataset.side;
    const view = this.data.sides.find((item) => item.side === side);
    const options = view?.monsterOptions || monsterOptions;
    const option = options[event.detail.index] || blankOption;
    const choice = side === "ally"
      ? (this.teamPetChoices || []).find((item) => item.id === option.id)
      : null;
    this.selectedTeamPetId = choice?.id || "";
    if (choice) {
      this.mutateSide("ally", (state) => {
        const previousPreset = state.defaultBuildPreset;
        const monster = catalog.getMonster(choice.pet.monsterId);
        Object.assign(state, pvpStateRules.defaultSide("ally"), {
          monsterId: choice.pet.monsterId,
          bloodlineId: choice.pet.bloodlineId,
          natureId: choice.pet.natureId,
          talentIds: [...choice.pet.talentIds],
          skillIds: choice.pet.skills.map((skill) => skill.skillId),
          defaultBuildPreset: previousPreset,
          traitLayers: monster ? pvpEffects.trait.defaultTraitLayers(monster) : 0
        });
      });
      return;
    }
    this.clearImportedTeamPet(side);
    this.mutateSide(side, (state) => {
      Object.assign(state, pvpStateRules.defaultSide(side), {
        monsterId: option.id,
        defaultBuildPreset: state.defaultBuildPreset
      });
      const monster = catalog.getMonster(option.id);
      state.traitLayers = monster
        ? pvpEffects.trait.defaultTraitLayers(monster)
        : 0;
    });
  },

  onBloodlineChange(event) {
    const side = event.currentTarget.dataset.side;
    const option = bloodlineOptions[event.detail.index] || blankOption;
    this.clearImportedTeamPet(side);
    this.mutateSide(side, (state) => {
      state.bloodlineId = option.id;
    });
  },

  onNatureChange(event) {
    const side = event.currentTarget.dataset.side;
    const option = natureOptions[event.detail.index] || blankOption;
    this.clearImportedTeamPet(side);
    this.mutateSide(side, (state) => {
      state.natureId = option.id;
    });
  },

  onTalentChange(event) {
    const side = event.currentTarget.dataset.side;
    const talentIndex = Number(event.currentTarget.dataset.talentIndex);
    const option = talentOptions[event.detail.index] || blankOption;
    this.clearImportedTeamPet(side);
    this.mutateSide(side, (state) => {
      state.talentIds[talentIndex] = option.id;
    });
  },

  onSkillChange(event) {
    const side = event.currentTarget.dataset.side;
    const skillIndex = Number(event.currentTarget.dataset.skillIndex);
    const view = this.data.sides.find((item) => item.side === side);
    const option = view.skillOptions[event.detail.index] || blankOption;
    this.clearImportedTeamPet(side);
    this.mutateSide(side, (state) => {
      state.skillIds[skillIndex] = option.id;
      if (state.action !== "force" && !state.skillIds.includes(state.action)) state.action = "";
    });
  },

  onSkillActionTap(event) {
    const side = event.currentTarget.dataset.side;
    const skillId = event.currentTarget.dataset.actionSkillId;
    this.mutateSide(side, (state) => {
      if (skillId === "force") {
        if (forceImpactLocked(state)) return;
        state.action = "force";
        state.forceImpact = true;
        return;
      }
      if (!skillId) return;
      state.action = skillId;
      state.forceImpact = false;
    });
  },

  onPickerOpen(event) {
    const detail = event.detail || {};
    this.setData({
      pickerScrollLocked: true,
      floatingPicker: {
        visible: true,
        label: detail.label || "",
        options: detail.options || [],
        valueIndex: Number(detail.valueIndex) || 0,
        valueLabel: detail.valueLabel || blankOption.label,
        dataset: { ...(event.currentTarget.dataset || {}) }
      }
    });
  },

  onFloatingPickerSelect(event) {
    const picker = this.data.floatingPicker || closedFloatingPicker();
    const handler = picker.dataset?.pickerHandler;
    const index = Number(event.detail.index) || 0;
    this.onFloatingPickerClose();
    if (!handler || typeof this[handler] !== "function") return;
    this[handler]({
      currentTarget: { dataset: picker.dataset || {} },
      detail: { index }
    });
  },

  onFloatingPickerClose() {
    this.setData({
      pickerScrollLocked: false,
      floatingPicker: closedFloatingPicker()
    });
  },

  selectPreset(event) {
    const side = event.currentTarget.dataset.side;
    const preset = event.currentTarget.dataset.preset;
    this.mutateSide(side, (state) => {
      state.defaultBuildPreset = buildRules.normalizePreset(preset);
    });
  },

  selectWeather(event) {
    const next = pvpTurn.history.cloneState(this.currentState());
    next.weather = pvpTurn.weather.normalizeWeather(event.currentTarget.dataset.weather);
    this.applyState(next);
  },

  adjustValue(event) {
    const side = event.currentTarget.dataset.side;
    const key = event.currentTarget.dataset.key;
    const delta = Number(event.currentTarget.dataset.delta) || 0;
    this.mutateSide(side, (state) => {
      if (key.startsWith("stat:")) {
        const stat = key.split(":")[1];
        const next = (Number(state.manualStatMods[stat]) || 0) + delta * 0.1;
        state.manualStatMods[stat] = Math.round(next * 10) / 10;
      } else if (key === "flatPower") {
        state.manualDamageBonus = (Number(state.manualDamageBonus) || 0) + delta * 10;
      } else if (key === "powerPercent") {
        const next = (Number(state.manualPowerPercentBonus) || 0) + delta * 0.1;
        state.manualPowerPercentBonus = Math.round(next * 10) / 10;
      } else if (key === "hitCount") {
        state.manualHitCountBonus = Math.max(0, (Number(state.manualHitCountBonus) || 0) + delta);
      } else if (key === "traitLayers") {
        state.traitLayers = pvpEffects.trait.normalizeTraitLayers(
          (Number(state.traitLayers) || 0) + delta
        );
      } else if (key === "energy") {
        state.energy = Math.max(0, Math.min(10, (Number(state.energy) || 0) + delta));
      }
    });
  },

  clearSide(event) {
    const side = event.currentTarget.dataset.side;
    wx.showModal({
      title: `清空${side === "ally" ? "我方" : "敌方"}配置`,
      content: "只清空这一侧，另一侧和天气保持不变。",
      confirmColor: "#d92d20",
      success: ({ confirm }) => {
        if (!confirm) return;
        this.clearImportedTeamPet(side);
        const next = pvpTurn.history.cloneState(this.currentState());
        next[side] = pvpStateRules.defaultSide(side);
        this.applyState(next);
      }
    });
  }
});
