const catalog = require("../../data/catalog");
const { TYPES, BLOODLINES, NATURES, TALENTS } = require("../../domain/constants");
const teamRules = require("../../domain/team");
const { createStorageAdapter } = require("../../utils/storage");

const storage = createStorageAdapter();
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
const bloodlineOptions = optionsWithBlank(BLOODLINES);
const natureOptions = optionsWithBlank(NATURES);
const talentOptions = optionsWithBlank(TALENTS);
const typeNameById = new Map(TYPES.map((type) => [type.id, type.name]));
const categoryNames = {
  physical: "物理",
  special: "魔法",
  status: "状态",
  defense: "防御",
  cute: "可爱"
};

function selection(options, id) {
  const index = Math.max(0, options.findIndex((option) => option.id === id));
  return { index, label: options[index].label };
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

function teamView(team) {
  return team.map((pet, slot) => {
    const monster = catalog.getMonster(pet.monsterId);
    const skillOptions = optionsWithBlank(catalog.monsterSkillOptions(pet.monsterId));
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
      skillOptions,
      skillSelections: pet.skills.map((skill) => selection(skillOptions, skill.skillId)),
      skillDetails: pet.skills
        .map((skill, index) => selectedSkillDetail(skill.skillId, index))
        .filter(Boolean),
      rollerSelection: selection(skillOptions, pet.rollerSkillId)
    };
  });
}

Page({
  data: {
    configuredCount: 0,
    team: [],
    teamOverview: [],
    activeTeamIndex: 0,
    activePet: null,
    monsterOptions,
    bloodlineOptions,
    natureOptions,
    talentOptions,
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
      configuredCount: normalized.filter(teamRules.isPetComplete).length,
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
    this.mutatePet(petIndex, (pet) => {
      pet.monsterId = option.id;
      pet.rollerSkillId = "";
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
    const options = this.data.team[petIndex].skillOptions;
    const option = options[event.detail.index] || blankOption;
    this.mutatePet(petIndex, (pet) => {
      pet.skills[skillIndex].skillId = option.id;
    });
  },

  onRollerSkillChange(event) {
    const petIndex = Number(event.currentTarget.dataset.petIndex);
    const options = this.data.team[petIndex].skillOptions;
    const option = options[event.detail.index] || blankOption;
    this.mutatePet(petIndex, (pet) => {
      pet.rollerSkillId = option.id;
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
