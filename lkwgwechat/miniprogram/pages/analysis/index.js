const catalog = require("../../data/catalog");
const analysis = require("../../domain/analysis");
const teamRules = require("../../domain/team");
const { createStorageAdapter } = require("../../utils/storage");

const storage = createStorageAdapter();
const blankOption = { id: "", label: "请选择" };
const allSkillOptions = optionsWithBlank(catalog.skillOptions);

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

function selection(options, id) {
  const index = Math.max(0, options.findIndex((option) => option.id === id));
  return { index, label: options[index].label };
}

function buildRollerSlots(team, analyzedSlots = [], expandedLearnerSlots = {}) {
  return team.map((pet, slot) => {
    const monster = catalog.getMonster(pet.monsterId);
    const skillOptions = allSkillOptions;
    const rollerSelection = selection(skillOptions, pet.rollerSkillId);
    const analyzed = analyzedSlots[slot] || {};
    const learnerExpanded = Boolean(expandedLearnerSlots[slot]);
    return {
      ...analyzed,
      slot,
      title: `${slot + 1}号位`,
      monsterName: monster?.name || "未选择精灵",
      hasMonster: Boolean(monster),
      skillOptions,
      rollerSelection,
      learnerExpanded,
      learnerDisplayText: learnerExpanded
        ? (analyzed.learnerFullText || analyzed.learnerPreview || "先选择目标技能")
        : (analyzed.learnerPreview || "先选择目标技能")
    };
  });
}

Page({
  data: {
    pickerScrollLocked: false,
    floatingPicker: closedFloatingPicker(),
    expandedLearnerSlots: {},
    rollerSlots: [],
    result: {
      configuredCount: 0,
      completeCount: 0,
      coveredTypeLabels: [],
      missingTypeLabels: [],
      monsters: []
    }
  },

  onShow() {
    this.applyTeam(storage.loadTeam(catalog), false);
  },

  currentTeam() {
    return this.teamState || teamRules.defaultTeam();
  },

  applyTeam(team, save = true) {
    const normalized = teamRules.normalizeTeam(team, catalog);
    const result = analysis.analyzeTeam(normalized, catalog);
    const expandedLearnerSlots = this.data?.expandedLearnerSlots || {};
    this.teamState = normalized;
    if (save) storage.saveTeam(normalized);
    this.setData({
      result,
      rollerSlots: buildRollerSlots(normalized, result.rollerSlots, expandedLearnerSlots)
    });
  },

  mutatePet(index, update) {
    const team = teamRules.cloneTeam(this.currentTeam());
    update(team[index]);
    this.applyTeam(team);
  },

  onRollerSkillChange(event) {
    const petIndex = Number(event.currentTarget.dataset.petIndex);
    const slot = this.data.rollerSlots[petIndex];
    const option = slot?.skillOptions?.[event.detail.index] || blankOption;
    this.mutatePet(petIndex, (pet) => {
      pet.rollerSkillId = option.id;
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

  onToggleLearners(event) {
    const slot = Number(event.currentTarget.dataset.slot);
    const currentSlot = (this.data.rollerSlots || [])[slot];
    if (!currentSlot?.learnerExpandable) return;
    const expandedLearnerSlots = {
      ...(this.data.expandedLearnerSlots || {}),
      [slot]: !(this.data.expandedLearnerSlots || {})[slot]
    };
    this.setData({
      expandedLearnerSlots,
      rollerSlots: buildRollerSlots(
        this.currentTeam(),
        (this.data.result && this.data.result.rollerSlots) || [],
        expandedLearnerSlots
      )
    });
  },

  goToTeam() {
    wx.switchTab({ url: "/pages/team/index" });
  }
});
