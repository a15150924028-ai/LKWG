const catalog = require("../../data/catalog");
const analysis = require("../../domain/analysis");
const { createStorageAdapter } = require("../../utils/storage");

const storage = createStorageAdapter();

Page({
  data: {
    result: {
      configuredCount: 0,
      completeCount: 0,
      coveredTypeLabels: [],
      missingTypeLabels: [],
      monsters: []
    }
  },

  onShow() {
    const team = storage.loadTeam(catalog);
    this.setData({
      result: analysis.analyzeTeam(team, catalog)
    });
  },

  goToTeam() {
    wx.switchTab({ url: "/pages/team/index" });
  }
});
