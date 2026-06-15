# WeChat Searchable Pickers And Team Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add searchable autocomplete selection to every team and PVP selector, and change the team page to a six-card overview with one active editor.

**Architecture:** Replace the current native picker internals with a reusable input-driven component while retaining its existing properties and `change` event shape, minimizing page churn. Keep filtering in a small pure utility for direct Node testing, then add `activeTeamIndex` and derived overview data to the team page without changing stored team or PVP schemas.

**Tech Stack:** WeChat Mini Program JavaScript, WXML, WXSS, CommonJS, Node.js static regression tests.

---

### Task 1: Search Filtering Contract

**Files:**
- Create: `lkwgwechat/miniprogram/utils/search-options.js`
- Create: `tests/miniprogram-search-picker-static.test.js`

- [ ] **Step 1: Write the failing pure-filter test**

Create fixtures that require blank options to be excluded from suggestions, Chinese substring matching, ASCII case-insensitive matching, stable source ordering, and a 20-result cap:

```js
const results = searchOptions([
  { id: "", label: "请选择" },
  { id: "fire", label: "Fire Dragon" },
  { id: "ice", label: "寒冰龙" }
], "FIRE", 20);

assert.deepStrictEqual(results, [{ id: "fire", label: "Fire Dragon", index: 1 }]);
assert.strictEqual(searchOptions(manyOptions, "", 20).length, 20);
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node tests/miniprogram-search-picker-static.test.js`

Expected: FAIL because `utils/search-options.js` and the searchable component contract do not exist.

- [ ] **Step 3: Implement the pure filter**

Export `normalizeQuery` and `searchOptions`:

```js
function searchOptions(options, query, limit = 20) {
  const keyword = normalizeQuery(query);
  return options
    .map((option, index) => ({ ...option, index }))
    .filter((option) => option.id && (!keyword || normalizeQuery(option.label).includes(keyword)))
    .slice(0, limit);
}
```

- [ ] **Step 4: Run the focused test**

Run: `node tests/miniprogram-search-picker-static.test.js`

Expected: PASS for all filter behavior.

- [ ] **Step 5: Commit**

```powershell
git add -- lkwgwechat/miniprogram/utils/search-options.js tests/miniprogram-search-picker-static.test.js
git commit -m "feat: add Mini Program option search"
```

### Task 2: Shared Searchable Field Component

**Files:**
- Modify: `lkwgwechat/miniprogram/components/field-picker/index.js`
- Modify: `lkwgwechat/miniprogram/components/field-picker/index.wxml`
- Modify: `lkwgwechat/miniprogram/components/field-picker/index.wxss`
- Modify: `tests/miniprogram-search-picker-static.test.js`

- [ ] **Step 1: Extend the component test**

Require an `<input>`, focus/input/blur handlers, suggestion rendering, clear and selection events, disabled handling, and no native `<picker>`:

```js
assert(pickerWxml.includes("<input"));
assert(pickerWxml.includes('bindinput="onInput"'));
assert(pickerWxml.includes('bindtap="onSelect"'));
assert(!pickerWxml.includes("<picker"));
for (const method of ["onFocus", "onInput", "onSelect", "onClear"]) {
  assert(pickerJs.includes(`${method}(`));
}
```

- [ ] **Step 2: Run the test and verify failure**

Run: `node tests/miniprogram-search-picker-static.test.js`

Expected: FAIL because the component still uses the native selector.

- [ ] **Step 3: Replace the component internals**

Keep `label`, `options`, `valueIndex`, `valueLabel`, `disabled`, and `compact`. Add local `query`, `focused`, and `suggestions`; synchronize `query` from `valueLabel`; emit the original index contract:

```js
onSelect(event) {
  const index = Number(event.currentTarget.dataset.index);
  const option = this.properties.options[index];
  this.setData({ query: option.label, focused: false, suggestions: [] });
  this.triggerEvent("change", { index });
}

onClear() {
  this.setData({ query: "", suggestions: [] });
  this.triggerEvent("change", { index: 0 });
}
```

Render an in-flow suggestion list capped by `searchOptions`, so parent cards cannot clip it. Show all first results on focus, filter on input, close after selection, and restore the committed label on blur when free text was not selected.

- [ ] **Step 4: Run component verification**

Run: `node tests/miniprogram-search-picker-static.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- lkwgwechat/miniprogram/components/field-picker lkwgwechat/miniprogram/utils/search-options.js tests/miniprogram-search-picker-static.test.js
git commit -m "feat: make Mini Program fields searchable"
```

### Task 3: Six-Card Team Switcher And Single Editor

**Files:**
- Modify: `lkwgwechat/miniprogram/pages/team/index.js`
- Modify: `lkwgwechat/miniprogram/pages/team/index.wxml`
- Modify: `lkwgwechat/miniprogram/pages/team/index.wxss`
- Modify: `tests/miniprogram-team-page-static.test.js`

- [ ] **Step 1: Change the team test to the approved layout**

Require six overview buttons, active-slot state and handler, and only one editor bound to `activePet`:

```js
assert(pageJs.includes("activeTeamIndex: 0"));
assert(pageJs.includes("selectTeamSlot("));
assert(pageWxml.includes('wx:for="{{teamOverview}}"'));
assert(pageWxml.includes('data-team-slot="{{slot.slot}}"'));
assert(pageWxml.includes("activePet"));
assert(!pageWxml.includes('wx:for="{{team}}"'));
```

Retain all existing assertions for passives, skill details, rotation, undo, clear and persistence.

- [ ] **Step 2: Run the test and verify failure**

Run: `node tests/miniprogram-team-page-static.test.js`

Expected: FAIL because the page still renders six complete editors.

- [ ] **Step 3: Add active-slot view state**

Add `activeTeamIndex`, build `teamOverview` from the normalized six-slot view, expose `activePet`, and switch slots without changing stored data:

```js
selectTeamSlot(event) {
  const index = Number(event.currentTarget.dataset.teamSlot);
  if (!Number.isInteger(index) || index < 0 || index >= this.data.team.length) return;
  this.setData({
    activeTeamIndex: index,
    activePet: this.data.team[index]
  });
}
```

When `applyTeam` refreshes data, clamp the active index and update `team`, `teamOverview`, and `activePet` together. All edit handlers use `activePet.slot` through their existing `data-pet-index`.

- [ ] **Step 4: Replace six editors with overview plus active editor**

Render a responsive three-column, two-row overview. Each card shows slot number, monster label, type labels and completion state. Keep exactly one existing editor below it, bound to `activePet`, with the approved searchable fields.

- [ ] **Step 5: Run focused team tests**

Run:

```powershell
node tests/miniprogram-search-picker-static.test.js
node tests/miniprogram-team-page-static.test.js
node tests/miniprogram-team-domain-static.test.js
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- lkwgwechat/miniprogram/pages/team tests/miniprogram-team-page-static.test.js
git commit -m "feat: add Mini Program team slot switcher"
```

### Task 4: PVP Adoption And Final Verification

**Files:**
- Modify: `tests/miniprogram-pvp-page-static.test.js`
- Modify: `AGENTS.md`
- Modify: `C:\codex-work\codex-localdatabase\02-项目\codex-lkwg-battle.md`

- [ ] **Step 1: Strengthen the PVP selector test**

Require the shared `field-picker` for both sides' monster, bloodline, nature, three talents, four skills and selected action. Preserve the existing handler and damage-rule assertions:

```js
assert.strictEqual(
  (pageWxml.match(/<field-picker/g) || []).length,
  12,
  "PVP must render six searchable fields per side"
);
assert(!pageWxml.includes("<picker"));
```

- [ ] **Step 2: Run PVP tests**

Run:

```powershell
node tests/miniprogram-search-picker-static.test.js
node tests/miniprogram-pvp-page-static.test.js
node tests/miniprogram-pvp-domain-static.test.js
```

Expected: all PASS. The PVP page needs no state-schema change because the shared component retains `{ detail: { index } }`.

- [ ] **Step 3: Run complete automated verification**

Run:

```powershell
node lkwgwechat/scripts/sync-miniprogram-data.js --check
node lkwgwechat/scripts/sync-miniprogram-pvp-rules.js --check
Get-ChildItem tests -Filter *.test.js | Sort-Object Name | ForEach-Object {
  node $_.FullName
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
```

Also parse every Mini Program `.js` with `new Function`, parse every `.json`, scan WXML for HTML-only tags and method calls, run `git diff --check`, and measure `lkwgwechat/miniprogram` total bytes. Expected package size remains safely below 2 MiB.

- [ ] **Step 4: Update records**

Append the required `AGENTS.md` work-log entry. Update the project note with only current status, the shared searchable-component decision, resolved selection/layout issues, and the remaining WeChat Developer Tools compile/real-device checks.

- [ ] **Step 5: Commit and publish**

Stage only files belonging to this request. Do not stage the existing local `lkwgwechat/project.config.json` change or unrelated deleted HTML file:

```powershell
git add -- lkwgwechat/miniprogram tests/miniprogram-search-picker-static.test.js tests/miniprogram-team-page-static.test.js tests/miniprogram-pvp-page-static.test.js AGENTS.md
git commit -m "feat: add searchable Mini Program team editing"
git push origin main
```

- [ ] **Step 6: External validation**

In WeChat Developer Tools, import `C:\codex-work\codex-lkwg-battle\lkwgwechat`, compile, search each selector category, switch all six team cards, verify both PVP sides, and perform a real-device preview. Document any IDE-only blocker without changing verified project behavior.
