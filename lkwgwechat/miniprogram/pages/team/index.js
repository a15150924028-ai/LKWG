const catalog = require("../../data/catalog");
const { TYPES, BLOODLINES, NATURES, TALENTS } = require("../../domain/constants");
const teamRules = require("../../domain/team");
const { createStorageAdapter } = require("../../utils/storage");

const storage = createStorageAdapter();
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

const monsterOptions = optionsWithBlank(catalog.monsterOptions);
const allSkillOptions = optionsWithBlank(catalog.skillOptions);
const bloodlineOptions = optionsWithBlank(BLOODLINES);
const natureOptions = optionsWithBlank(NATURES);
const talentOptions = optionsWithBlank(TALENTS);
const BOSS_MONSTER_NAMES = new Set([
  "彩虹独角兽",
  "叶冕魔力猫",
  "烈火战神",
  "圣水守护",
  "鸭吉吉国王",
  "波普鹿",
  "恶魔狼王",
  "风暴战犬",
  "雪影冰灵",
  "奇梦咪",
  "伊兰龙",
  "幻影荆棘",
  "蹦蹦果",
  "奇丽果",
  "女王蜂",
  "神谕鲨",
  "霜翼领主",
  "迷嶂布莱克",
  "祭礼巨像",
  "钻石蜗",
  "千棘海针",
  "圣剑骑士",
  "黑猫密探",
  "棋契陛下"
]);
const typeNameById = new Map(TYPES.map((type) => [type.id, type.name]));
const categoryNames = {
  physical: "物理",
  special: "魔法",
  status: "状态",
  defense: "防御",
  cute: "萌"
};

function selection(options, id) {
  const index = Math.max(0, options.findIndex((option) => option.id === id));
  return { index, label: options[index].label };
}

function isBossMonster(monster) {
  if (!monster) return false;
  const aliases = monster.aliases || [];
  return [...BOSS_MONSTER_NAMES].some((name) => (
    monster.name === name
    || monster.name.startsWith(`${name}（`)
    || aliases.includes(name)
  ));
}

function selectedSkillDetail(skillId, index) {
  const skill = catalog.getSkill(skillId);
  if (!skill) return null;
  const cost = skill.pp ?? skill.energyCost;
  return {
    id: skill.id,
    slot: index + 1,
    name: skill.name,
    typeName: typeNameById.get(skill.type) || skill.type || "无属性",
    categoryName: categoryNames[skill.category || skill.mode] || skill.category || skill.mode || "技能",
    powerLabel: Number(skill.power) > 0 ? String(skill.power) : "—",
    costLabel: Number.isFinite(Number(cost)) ? String(cost) : "—",
    description: skill.description || "暂无技能描述"
  };
}

function skillSelection(skillId) {
  const selected = selection(allSkillOptions, skillId);
  const option = allSkillOptions[selected.index] || blankOption;
  return {
    ...selected,
    displayIndex: option.id ? 1 : 0,
    displayOptions: option.id ? [blankOption, option] : [blankOption]
  };
}

function teamView(team) {
  return team.map((pet, slot) => {
    const monster = catalog.getMonsterSummary(pet.monsterId);
    return {
      ...pet,
      slot,
      complete: teamRules.isPetComplete(pet),
      monsterName: monster?.name || "等待配置",
      typeNames: (monster?.types || []).map((type) => typeNameById.get(type) || type),
      monsterSelection: selection(monsterOptions, pet.monsterId),
      bloodlineSelection: selection(bloodlineOptions, pet.bloodlineId),
      natureSelection: selection(natureOptions, pet.natureId),
      talents: pet.talentIds.map((talentId) => selection(talentOptions, talentId)),
      passives: (monster?.passiveIds || [])
        .map((passiveId) => catalog.getPassive(passiveId))
        .filter(Boolean)
        .map((passive) => ({
          id: passive.id,
          name: passive.name,
          description: passive.description || "暂无特性说明"
        })),
      skillSelections: pet.skills.map((skill) => skillSelection(skill.skillId)),
      skillDetails: pet.skills
        .map((skill, index) => selectedSkillDetail(skill.skillId, index))
        .filter(Boolean)
    };
  });
}

Page({
  data: {
    configuredCount: 0,
    progressPercent: 0,
    team: [],
    teamOverview: [],
    activeTeamIndex: 0,
    activePet: null,
    monsterOptions,
    bloodlineOptions,
    natureOptions,
    talentOptions,
    pickerScrollLocked: false,
    floatingPicker: closedFloatingPicker(),
    canUndo: false
  },

  onLoad() {
    this.undoTeam = null;
  },

  onShow() {
    this.applyTeam(storage.loadTeam(catalog), false);
  },

  applyTeam(team, save = true) {
    const normalized = teamRules.normalizeTeam(team, catalog);
    if (save) storage.saveTeam(normalized);
    const view = teamView(normalized);
    const activeTeamIndex = Math.max(
      0,
      Math.min(view.length - 1, Number(this.data.activeTeamIndex) || 0)
    );
    const configuredCount = normalized.filter(teamRules.isPetComplete).length;
    this.setData({
      team: view,
      teamOverview: view.map((pet) => ({
        slot: pet.slot,
        complete: pet.complete,
        monsterName: pet.monsterName,
        typeNames: pet.typeNames
      })),
      activeTeamIndex,
      activePet: view[activeTeamIndex] || null,
      configuredCount,
      progressPercent: Math.round((configuredCount / 6) * 100),
      canUndo: Boolean(this.undoTeam)
    });
  },

  currentTeam() {
    return this.data.team.map((pet) => ({
      name: pet.name,
      monsterId: pet.monsterId,
      bloodlineId: pet.bloodlineId,
      natureId: pet.natureId,
      talentIds: [...pet.talentIds],
      rollerSkillId: pet.rollerSkillId,
      skills: pet.skills.map((skill) => ({ skillId: skill.skillId }))
    }));
  },

  selectTeamSlot(event) {
    const index = Number(event.currentTarget.dataset.teamSlot);
    if (!Number.isInteger(index) || index < 0 || index >= this.data.team.length) return;
    this.setData({
      activeTeamIndex: index,
      activePet: this.data.team[index]
    });
  },

  mutatePet(index, update) {
    const team = this.currentTeam();
    update(team[index]);
    this.applyTeam(team);
  },

  onMonsterChange(event) {
    const petIndex = Number(event.currentTarget.dataset.petIndex);
    const option = monsterOptions[event.detail.index] || blankOption;
    const monster = catalog.getMonsterSummary(option.id);
    this.mutatePet(petIndex, (pet) => {
      pet.monsterId = option.id;
      pet.bloodlineId = isBossMonster(monster) ? "bloodline-boss" : "";
      pet.skills = Array.from({ length: 4 }, () => ({ skillId: "" }));
    });
  },

  onBloodlineChange(event) {
    const petIndex = Number(event.currentTarget.dataset.petIndex);
    const option = bloodlineOptions[event.detail.index] || blankOption;
    this.mutatePet(petIndex, (pet) => {
      pet.bloodlineId = option.id;
    });
  },

  onNatureChange(event) {
    const petIndex = Number(event.currentTarget.dataset.petIndex);
    const option = natureOptions[event.detail.index] || blankOption;
    this.mutatePet(petIndex, (pet) => {
      pet.natureId = option.id;
    });
  },

  onTalentChange(event) {
    const petIndex = Number(event.currentTarget.dataset.petIndex);
    const talentIndex = Number(event.currentTarget.dataset.talentIndex);
    const option = talentOptions[event.detail.index] || blankOption;
    this.mutatePet(petIndex, (pet) => {
      pet.talentIds[talentIndex] = option.id;
    });
  },

  onSkillChange(event) {
    const petIndex = Number(event.currentTarget.dataset.petIndex);
    const skillIndex = Number(event.currentTarget.dataset.skillIndex);
    const options = allSkillOptions;
    const option = options[event.detail.index] || blankOption;
    this.mutatePet(petIndex, (pet) => {
      pet.skills[skillIndex].skillId = option.id;
    });
  },

  onPickerOpen(event) {
    const detail = event.detail || {};
    const dataset = event.currentTarget.dataset || {};
    const useAllSkillOptions = dataset.pickerOptions === "allSkillOptions";
    this.setData({
      pickerScrollLocked: true,
      floatingPicker: {
        visible: true,
        label: detail.label || "",
        options: useAllSkillOptions ? allSkillOptions : (detail.options || []),
        valueIndex: useAllSkillOptions ? Number(dataset.valueIndex) || 0 : Number(detail.valueIndex) || 0,
        valueLabel: detail.valueLabel || blankOption.label,
        dataset: { ...dataset }
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

  rotateSkills() {
    const team = this.currentTeam();
    this.undoTeam = teamRules.cloneTeam(team);
    this.applyTeam(teamRules.rotateSkillsDown(team));
  },

  undoRotation() {
    if (!this.undoTeam) return;
    const previous = this.undoTeam;
    this.undoTeam = null;
    this.applyTeam(previous);
  },

  clearTeam() {
    wx.showModal({
      title: "清空队伍",
      content: "确认清空六只精灵的全部配置？PVP 配置不会受到影响。",
      confirmColor: "#d92d20",
      success: ({ confirm }) => {
        if (!confirm) return;
        storage.clearTeam();
        this.undoTeam = null;
        this.applyTeam(teamRules.defaultTeam(), false);
      }
    });
  }
});
