const catalog = require("../../data/catalog");
const { BLOODLINES, NATURES, TALENTS } = require("../../domain/constants");
const teamRules = require("../../domain/team");
const { createStorageAdapter } = require("../../utils/storage");

const storage = createStorageAdapter();
const blankOption = { id: "", label: "请选择" };

function optionsWithBlank(options) {
  return [blankOption, ...options.map((item) => ({
    id: item.id,
    label: item.label || item.name
  }))];
}

const monsterOptions = optionsWithBlank(catalog.monsterOptions);
const bloodlineOptions = optionsWithBlank(BLOODLINES);
const natureOptions = optionsWithBlank(NATURES);
const talentOptions = optionsWithBlank(TALENTS);

function selection(options, id) {
  const index = Math.max(0, options.findIndex((option) => option.id === id));
  return { index, label: options[index].label };
}

function teamView(team) {
  return team.map((pet, slot) => {
    const skillOptions = optionsWithBlank(catalog.monsterSkillOptions(pet.monsterId));
    return {
      ...pet,
      slot,
      complete: teamRules.isPetComplete(pet),
      monsterSelection: selection(monsterOptions, pet.monsterId),
      bloodlineSelection: selection(bloodlineOptions, pet.bloodlineId),
      natureSelection: selection(natureOptions, pet.natureId),
      talents: pet.talentIds.map((talentId) => selection(talentOptions, talentId)),
      skillOptions,
      skillSelections: pet.skills.map((skill) => selection(skillOptions, skill.skillId)),
      rollerSelection: selection(skillOptions, pet.rollerSkillId)
    };
  });
}

Page({
  data: {
    configuredCount: 0,
    team: [],
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
    this.setData({
      team: teamView(normalized),
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
