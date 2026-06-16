const catalog = require("../../data/catalog");
const analysis = require("../../domain/analysis");
const teamRules = require("../../domain/team");
const { createStorageAdapter } = require("../../utils/storage");

const storage = createStorageAdapter();
const blankOption = { id: "", label: "请选择" };

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

function buildRollerSlots(team) {
  return team.map((pet, slot) => {
    const monster = catalog.getMonster(pet.monsterId);
    const skillOptions = optionsWithBlank(catalog.monsterSkillOptions(pet.monsterId));
    const rollerSelection = selection(skillOptions, pet.rollerSkillId);
    return {
      slot,
      title: `${slot + 1}号位`,
      monsterName: monster?.name || "未选择精灵",
      hasMonster: Boolean(monster),
      skillOptions,
      rollerSelection
    };
  });
}

Page({
  data: {
    pickerScrollLocked: false,
    floatingPicker: closedFloatingPicker(),
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
    this.teamState = normalized;
    if (save) storage.saveTeam(normalized);
    this.setData({
      result: analysis.analyzeTeam(normalized, catalog),
      rollerSlots: buildRollerSlots(normalized)
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

  goToTeam() {
    wx.switchTab({ url: "/pages/team/index" });
  }
});
