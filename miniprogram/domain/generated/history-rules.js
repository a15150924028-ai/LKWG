// Generated from index.html module LKWG_PVP_HISTORY_RULES. Do not edit directly.
(function initPvpHistoryRules(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.LKWG_PVP_HISTORY_RULES = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function buildPvpHistoryRules() {
  function cloneState(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  function appendTurnLog(log, entry, limit = 5) {
    const source = Array.isArray(log) ? log : [];
    const nextEntry = { ...(entry || {}) };
    return [nextEntry, ...source].slice(0, Math.max(1, Math.round(Number(limit) || 5)));
  }

  function clearTurnLog() {
    return [];
  }

  return {
    cloneState,
    appendTurnLog,
    clearTurnLog
  };
});
