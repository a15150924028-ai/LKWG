const buildRules = require("./pvp-build");
const { weather } = require("./pvp-turn");

const DEFAULT_ENERGY = 10;

function numberValue(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampEnergy(value) {
  return Math.max(0, Math.min(10, numberValue(value, DEFAULT_ENERGY)));
}

function normalizeStatMods(mods) {
  const source = mods && typeof mods === "object" ? mods : {};
  return Object.fromEntries(
    ["hp", "atk", "defense", "spa", "spd", "spe"]
      .map((key) => [key, numberValue(source[key], 0)])
  );
}

function defaultSide(side) {
  return {
    side,
    monsterId: "",
    bloodlineId: "",
    natureId: "",
    talentIds: ["", "", ""],
    defaultBuildPreset: side === "enemy" ? buildRules.DEFAULT_PRESET : "durable",
    skillIds: ["", "", "", ""],
    action: "",
    actionMonsterId: "",
    actionCuteLayers: 0,
    forceImpact: false,
    traitLayers: 0,
    traitLayerMemory: {},
    cuteLayers: 0,
    currentHp: 0,
    currentHpMonsterId: "",
    energy: DEFAULT_ENERGY,
    skillCostOverrides: {},
    statusLayers: {},
    nextPriority: 0,
    defenseBlockTurns: 0,
    skillStatMods: normalizeStatMods(),
    skillFlatStatMods: normalizeStatMods(),
    manualStatMods: normalizeStatMods(),
    manualDamageBonus: 0,
    manualPowerPercentBonus: 0,
    manualHitCountBonus: 0,
    usedSupportSkillIds: [],
    supportText: ""
  };
}

function normalizeSide(value, side) {
  const source = value && typeof value === "object" ? value : {};
  const base = defaultSide(side);
  return {
    ...base,
    ...source,
    side,
    monsterId: String(source.monsterId || ""),
    bloodlineId: String(source.bloodlineId || ""),
    natureId: String(source.natureId || ""),
    talentIds: Array.from(
      { length: 3 },
      (_, index) => String(source.talentIds?.[index] || "")
    ),
    defaultBuildPreset: buildRules.normalizePreset(
      side === "enemy" ? source.defaultBuildPreset : "durable"
    ),
    skillIds: Array.from(
      { length: 4 },
      (_, index) => String(source.skillIds?.[index] || "")
    ),
    energy: clampEnergy(source.energy),
    currentHp: Math.max(0, numberValue(source.currentHp, 0)),
    nextPriority: numberValue(source.nextPriority, 0),
    defenseBlockTurns: Math.max(0, Math.round(numberValue(source.defenseBlockTurns, 0))),
    skillStatMods: normalizeStatMods(source.skillStatMods),
    skillFlatStatMods: normalizeStatMods(source.skillFlatStatMods),
    manualStatMods: normalizeStatMods(source.manualStatMods),
    manualDamageBonus: numberValue(source.manualDamageBonus, 0),
    manualPowerPercentBonus: numberValue(source.manualPowerPercentBonus, 0),
    manualHitCountBonus: Math.max(0, Math.round(numberValue(source.manualHitCountBonus, 0))),
    usedSupportSkillIds: Array.isArray(source.usedSupportSkillIds)
      ? [...new Set(source.usedSupportSkillIds.filter(Boolean))]
      : []
  };
}

function defaultPvpState() {
  return {
    weather: "",
    turnLog: [],
    undoSnapshot: null,
    turnNumber: 0,
    ally: defaultSide("ally"),
    enemy: defaultSide("enemy")
  };
}

function normalizePvpState(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    weather: weather.normalizeWeather(source.weather),
    turnLog: Array.isArray(source.turnLog) ? source.turnLog.slice(0, 20) : [],
    undoSnapshot: null,
    turnNumber: Math.max(0, Math.round(numberValue(source.turnNumber, 0))),
    ally: normalizeSide(source.ally, "ally"),
    enemy: normalizeSide(source.enemy, "enemy")
  };
}

module.exports = {
  DEFAULT_ENERGY,
  defaultSide,
  normalizeSide,
  defaultPvpState,
  normalizePvpState
};
