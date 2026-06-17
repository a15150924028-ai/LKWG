# WeChat Mini Program Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a native, previewable three-tab WeChat Mini Program that preserves the web app and migrates its ordinary team, analysis, and PVP workflows.

**Architecture:** Keep `index.html` as the web release and build the Mini Program under `miniprogram/`. Generate packaged data from `data/local-bundle.json`, keep calculation and storage behavior in CommonJS domain modules, and let thin native pages bind those modules to WXML controls.

**Tech Stack:** WeChat Mini Program WXML/WXSS/JavaScript, CommonJS modules, Node.js synchronization and static regression tests.

---

### Task 1: Previewable Native Shell

**Files:**
- Create: `tests/miniprogram-shell-static.test.js`
- Modify: `project.config.json`
- Create: `miniprogram/app.js`
- Create: `miniprogram/app.json`
- Create: `miniprogram/app.wxss`
- Create: `miniprogram/sitemap.json`
- Create: `miniprogram/pages/team/index.{js,json,wxml,wxss}`
- Create: `miniprogram/pages/analysis/index.{js,json,wxml,wxss}`
- Create: `miniprogram/pages/pvp/index.{js,json,wxml,wxss}`

- [x] **Step 1: Write the failing shell test**

Assert that `project.config.json.miniprogramRoot` is `miniprogram/`, all three
pages exist, and `app.json` registers a three-item `tabBar` labelled `队伍`,
`分析`, and `PVP`.

- [x] **Step 2: Run the test and verify RED**

Run:

```powershell
node tests/miniprogram-shell-static.test.js
```

Expected: FAIL because `miniprogram/app.json` does not exist.

- [x] **Step 3: Add the minimal native shell**

Create valid page files and configure:

```json
{
  "pages": [
    "pages/team/index",
    "pages/analysis/index",
    "pages/pvp/index"
  ],
  "window": {
    "navigationBarTitleText": "rock工具",
    "navigationBarBackgroundColor": "#f5f7fb",
    "navigationBarTextStyle": "black"
  },
  "tabBar": {
    "color": "#64748b",
    "selectedColor": "#1677ff",
    "backgroundColor": "#ffffff",
    "list": [
      { "pagePath": "pages/team/index", "text": "队伍" },
      { "pagePath": "pages/analysis/index", "text": "分析" },
      { "pagePath": "pages/pvp/index", "text": "PVP" }
    ]
  },
  "sitemapLocation": "sitemap.json"
}
```

- [x] **Step 4: Run the shell test and verify GREEN**

Run `node tests/miniprogram-shell-static.test.js`.

- [x] **Step 5: Commit the shell**

Commit only shell files, the focused test, `project.config.json`, the updated
plan, and `AGENTS.md`.

### Task 2: Local Data Synchronization

**Files:**
- Create: `tests/miniprogram-data-sync-static.test.js`
- Create: `scripts/sync-miniprogram-data.js`
- Create: `miniprogram/data/local-bundle.js`
- Create: `miniprogram/data/catalog.js`

- [x] **Step 1: Write a failing synchronization test**

Run the sync script in check mode and assert generated monster, skill, and
passive counts match `data/local-bundle.json`; assert all monster skill and
passive references resolve.

- [x] **Step 2: Verify RED**

Run `node tests/miniprogram-data-sync-static.test.js` and expect failure because
the script and generated module are absent.

- [x] **Step 3: Implement synchronization**

The script must validate schema version `1`, IDs, numerical stats, types, and
references, then write:

```js
module.exports = Object.freeze(<validated JSON>);
```

Support `--check` to compare generated content without writing.

- [x] **Step 4: Add catalog indexes**

Export `monsterById`, `skillById`, `passiveById`, sorted picker lists, and safe
lookup functions from `miniprogram/data/catalog.js`.

- [x] **Step 5: Verify GREEN**

Run the focused sync test and the existing local-bundle validation tests.

### Task 3: Versioned Storage And Team Domain

**Files:**
- Create: `tests/miniprogram-team-domain-static.test.js`
- Create: `miniprogram/domain/constants.js`
- Create: `miniprogram/domain/team.js`
- Create: `miniprogram/utils/storage.js`

- [x] **Step 1: Write failing domain tests**

Cover six normalized slots, invalid ID removal, three unique talents, four
skills per slot, completion excluding roller target, skill rotation, undo
snapshot cloning, and independent team/PVP storage keys.

- [x] **Step 2: Verify RED**

Run `node tests/miniprogram-team-domain-static.test.js`.

- [x] **Step 3: Implement pure team rules**

Export `emptyPet`, `defaultTeam`, `normalizePet`, `normalizeTeam`,
`isPetComplete`, `rotateSkillsDown`, and `cloneTeam`.

- [x] **Step 4: Implement storage adapter**

Use injected storage functions in tests and `wx.getStorageSync`,
`wx.setStorageSync`, and `wx.removeStorageSync` in the Mini Program. Store:

```js
{ schemaVersion: 1, value: normalizedValue }
```

- [x] **Step 5: Verify GREEN**

Run focused tests and ensure no browser API appears under `miniprogram/`.

### Task 4: Team Page

**Files:**
- Create: `tests/miniprogram-team-page-static.test.js`
- Modify: `miniprogram/pages/team/index.{js,wxml,wxss}`
- Create: `miniprogram/components/field-picker/index.{js,json,wxml,wxss}`

- [x] **Step 1: Write failing page contract tests**

Require six cards and handlers for monster, bloodline, nature, three talents,
four skills, roller target, clear, rotate, and undo. Require every picker to
use native `picker` controls and every mutation to save normalized state.

- [x] **Step 2: Verify RED**

Run `node tests/miniprogram-team-page-static.test.js`.

- [x] **Step 3: Implement native editing**

Bind picker ranges from catalog data. Changing a monster clears incompatible
skills and preserves valid common fields. Show `配置完成` only when all required
fields are present.

- [x] **Step 4: Implement rotation and undo**

Keep one in-memory previous snapshot and disable undo when absent. Clear removes
only team storage after an explicit modal confirmation.

- [x] **Step 5: Verify GREEN**

Run focused tests and the team domain tests.

### Task 5: Analysis Rules And Page

**Files:**
- Create: `tests/miniprogram-analysis-static.test.js`
- Create: `miniprogram/domain/type-rules.js`
- Create: `miniprogram/domain/stats.js`
- Create: `miniprogram/domain/analysis.js`
- Modify: `miniprogram/pages/analysis/index.{js,wxml,wxss}`

- [x] **Step 1: Write failing parity fixtures**

Use representative dual-type monsters and complete/incomplete teams to verify
final stats, team counts, weaknesses, resistances, immunities, and incomplete
configuration messages.

- [x] **Step 2: Verify RED**

Run `node tests/miniprogram-analysis-static.test.js`.

- [x] **Step 3: Implement pure analysis modules**

Port the web type matrix, nature multipliers, talent bonuses, bloodline stat
effects, and team aggregation into CommonJS modules without DOM access.

- [x] **Step 4: Render the analysis page**

Refresh from storage in `onShow`, render one summary per configured monster,
and show an actionable empty state linking users to the team tab.

- [x] **Step 5: Verify GREEN**

Run focused parity tests and adjacent web stat/type tests.

### Task 6: PVP Rules And State

**Files:**
- Create: `tests/miniprogram-pvp-domain-static.test.js`
- Create: `miniprogram/domain/pvp-build.js`
- Create: `miniprogram/domain/pvp-damage.js`
- Create: `miniprogram/domain/pvp-turn.js`
- Create: `miniprogram/domain/pvp-effects.js`
- Create: `miniprogram/domain/pvp-state.js`

- [x] **Step 1: Write failing web-parity fixtures**

Cover durable/fast/attack presets, physical/special tie rules, displayed stats,
STAB, dual-type effectiveness, weather, response damage, variable power,
multi-hit rounding, energy, cooldown, action order, trait layers, HP, and
cleanup.

- [x] **Step 2: Verify RED**

Run `node tests/miniprogram-pvp-domain-static.test.js`.

- [x] **Step 3: Port pure rule modules**

Move the web rule behavior into CommonJS exports with no `window`, `document`,
`localStorage`, `fetch`, `Blob`, or URL dependencies.

- [x] **Step 4: Add normalized PVP state**

Keep ally and enemy state, shared weather, independent clear behavior, preset
defaults, and versioned storage.

- [x] **Step 5: Verify GREEN**

Run the focused fixtures and all existing PVP rule tests.

### Task 7: PVP Page

**Files:**
- Create: `tests/miniprogram-pvp-page-static.test.js`
- Modify: `miniprogram/pages/pvp/index.{js,wxml,wxss}`
- Create: `miniprogram/components/stat-grid/index.{js,json,wxml,wxss}`

- [x] **Step 1: Write failing page contract tests**

Require ally/enemy selectors, enemy preset buttons, effective nature/talent
markers, weather, buff controls, selected skills, descriptions, damage cards,
clear actions, and storage writes.

- [x] **Step 2: Verify RED**

Run `node tests/miniprogram-pvp-page-static.test.js`.

- [x] **Step 3: Implement both side panels**

Use compact native controls, one column on phone widths, and a shared
calculation refresh after every relevant field change.

- [x] **Step 4: Implement result cards**

Render final stat grids, nature arrows, talent markers, skill metadata,
response-only results, per-hit and total damage, effectiveness, and error
messages for non-damage skills.

- [x] **Step 5: Verify GREEN**

Run page contract, PVP domain, and all existing PVP tests.

### Task 8: Final Verification And Publication

**Files:**
- Modify: `README.md` if present, otherwise create `docs/wechat-mini-program.md`
- Modify: `AGENTS.md`
- Modify: this plan

- [x] **Step 1: Document maintenance**

Document data synchronization, developer-tool import, preview, real-device
testing, upload, versioning, and review submission.

- [x] **Step 2: Run all automated verification**

```powershell
node scripts/sync-miniprogram-data.js --check
Get-ChildItem tests -Filter *.test.js | Sort-Object Name | ForEach-Object { node $_.FullName }
git diff --check
```

- [ ] **Step 3: Compile in WeChat Developer Tools**

Confirm no app/page/WXML/WXSS/JavaScript build errors and open all three tabs.

- [ ] **Step 4: Run simulator and real-device checks**

Check common phone widths, storage persistence, team-to-analysis refresh, PVP
calculations, clear isolation, and a real-device preview.

- [x] **Step 5: Update logs, commit, and push**

Mark completed checkboxes, append exact verification evidence to `AGENTS.md`,
stage only scoped files, commit, and push `main`.
