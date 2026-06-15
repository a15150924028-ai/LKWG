const teamRules = require("../domain/team");

const STORAGE_SCHEMA_VERSION = 1;
const TEAM_STORAGE_KEY = "lkwg-mini-team-v1";
const PVP_STORAGE_KEY = "lkwg-mini-pvp-v1";

function defaultBackend() {
  return {
    get(key) {
      return wx.getStorageSync(key);
    },
    set(key, value) {
      wx.setStorageSync(key, value);
    },
    remove(key) {
      wx.removeStorageSync(key);
    }
  };
}

function storedValue(backend, key) {
  let record;
  try {
    record = backend.get(key);
  } catch (_error) {
    return null;
  }
  if (!record || record.schemaVersion !== STORAGE_SCHEMA_VERSION) return null;
  return record.value;
}

function createStorageAdapter(backend = defaultBackend()) {
  return {
    loadTeam(catalog) {
      return teamRules.normalizeTeam(storedValue(backend, TEAM_STORAGE_KEY), catalog);
    },
    saveTeam(team) {
      backend.set(TEAM_STORAGE_KEY, {
        schemaVersion: STORAGE_SCHEMA_VERSION,
        value: teamRules.cloneTeam(team)
      });
    },
    clearTeam() {
      backend.remove(TEAM_STORAGE_KEY);
    },
    loadPvp(normalize = (value) => value) {
      const value = storedValue(backend, PVP_STORAGE_KEY);
      return value == null ? null : normalize(value);
    },
    savePvp(value) {
      backend.set(PVP_STORAGE_KEY, {
        schemaVersion: STORAGE_SCHEMA_VERSION,
        value: JSON.parse(JSON.stringify(value))
      });
    },
    clearPvp() {
      backend.remove(PVP_STORAGE_KEY);
    }
  };
}

module.exports = {
  STORAGE_SCHEMA_VERSION,
  TEAM_STORAGE_KEY,
  PVP_STORAGE_KEY,
  createStorageAdapter
};
