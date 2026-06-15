# PVP Default Build Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add enemy default-build presets and show effective nature/talent indicators in both PVP race-stat cards without overriding manual selections.

**Architecture:** Add one shared effective-build resolver in `index.html` that returns the final nature and three unique talents from manual fields plus the active preset. Reuse that resolver in stat calculation, default-note rendering, race-stat indicators, combo placeholders, and preset active state. Keep all interaction in the existing PVP render/hydration flow.

**Tech Stack:** Static HTML, CSS, browser JavaScript, Node-based static regression tests.

---

### Task 1: Effective Build Resolver

**Files:**
- Create: `tests/pvp-default-build-presets-static.test.js`
- Modify: `index.html`

- [x] **Step 1: Write the failing resolver test**

Create a static/runtime test that extracts the main script and verifies:

```js
const physical = { stats: { atk: 120, spa: 90 } };
const special = { stats: { atk: 80, spa: 130 } };

assert(resolvePvpDefaultBuild("durable", physical).natureId === "nature-practical");
assert(resolvePvpDefaultBuild("fast", physical).natureId === "nature-jolly");
assert(resolvePvpDefaultBuild("fast", special).natureId === "nature-timid");
assert(resolvePvpDefaultBuild("attack", physical).natureId === "nature-brave");
assert(resolvePvpDefaultBuild("attack", special).natureId === "nature-quiet");
assert(resolvePvpDefaultBuild("attack", { stats: { atk: 100, spa: 100 } }).natureId === "nature-brave");
```

Also verify `resolveEffectivePvpBuild()` preserves manual fields, fills only
missing values, skips duplicate talents, and reports whether defaults remain in
use.

- [x] **Step 2: Run the test and verify RED**

Run:

```powershell
node tests/pvp-default-build-presets-static.test.js
```

Expected: FAIL because `resolvePvpDefaultBuild` and
`resolveEffectivePvpBuild` do not exist.

- [x] **Step 3: Implement the shared resolver**

Add preset constants and helpers:

```js
const DEFAULT_PVP_BUILD_PRESET = "durable";
const PVP_BUILD_PRESETS = [
  { id: "durable", label: "最肉" },
  { id: "fast", label: "最速" },
  { id: "attack", label: "最高攻击" }
];

function resolvePvpDefaultBuild(presetId, monster) { ... }
function resolveEffectivePvpBuild(state, monster) { ... }
```

Use physical attack when original `atk >= spa`. Fill missing talent slots in
preset order while skipping manually selected talent IDs.

Normalize `state.defaultBuildPreset` in `pvpSideState()`, initialize the enemy
to `durable`, and reset it to `durable` in `clearPvpSideState()`.

- [x] **Step 4: Route calculation through the resolver**

Change `finalBattleStats()` and talent checks so nature multipliers and talent
IV bonuses use the same effective nature/talents returned by
`resolveEffectivePvpBuild()`.

- [x] **Step 5: Run focused tests and verify GREEN**

Run:

```powershell
node tests/pvp-default-build-presets-static.test.js
node tests/default-build-static.test.js
node tests/pvp-damage-formula-static.test.js
```

Expected: PASS.

### Task 2: Enemy Preset Controls

**Files:**
- Modify: `tests/pvp-default-build-presets-static.test.js`
- Modify: `tests/pvp-compact-side-layout-static.test.js`
- Modify: `index.html`

- [x] **Step 1: Add failing UI contract assertions**

Require:

```js
sideSource.includes('data-pvp-build-preset="')
sideSource.includes('side === "enemy"')
hydrateSource.includes('state.defaultBuildPreset = button.dataset.pvpBuildPreset')
```

Require three equal columns, compact height, rounded corners, blue active fill,
and a phone-width one-row rule.

- [x] **Step 2: Run tests and verify RED**

Run:

```powershell
node tests/pvp-default-build-presets-static.test.js
node tests/pvp-compact-side-layout-static.test.js
```

Expected: FAIL because the preset row and CSS do not exist.

- [x] **Step 3: Render and hydrate the preset row**

Render the buttons only for `side === "enemy"` below the nature/talent row.
Use `resolveEffectivePvpBuild()` to mark a button active only while at least one
nature/talent field is empty. Clicking a button changes
`state.defaultBuildPreset` and rerenders results. Clicking the active button
does not clear it.

- [x] **Step 4: Add compact Apple-style CSS**

Add equal-width three-column controls with:

```css
grid-template-columns: repeat(3, minmax(0, 1fr));
min-height: 28px;
border-radius: 9px;
```

Use the existing blue control color for the active state. Keep the row on one
line at phone widths without adding large vertical gaps.

- [x] **Step 5: Run focused tests and verify GREEN**

Run:

```powershell
node tests/pvp-default-build-presets-static.test.js
node tests/pvp-compact-side-layout-static.test.js
```

Expected: PASS.

### Task 3: Race-Stat Indicators And Notes

**Files:**
- Modify: `tests/pvp-default-build-presets-static.test.js`
- Modify: `index.html`

- [x] **Step 1: Add failing indicator assertions**

Require `renderPvpPanelStats()` to use the effective build and render:

```html
class="stat-cell nature-up"
class="stat-cell nature-down"
class="pvp-nature-arrow"
class="pvp-talent-mark"
```

Require the talent marker text to be `＋`, and reject `+60`.

- [x] **Step 2: Run the test and verify RED**

Run:

```powershell
node tests/pvp-default-build-presets-static.test.js
```

Expected: FAIL because the indicator markup and styles do not exist.

- [x] **Step 3: Render indicators from the effective build**

Resolve the effective nature pair and talent stats once per card. Add:

- subtle green cell background and `↑` for the boosted nature stat;
- subtle red cell background and `↓` for the reduced nature stat;
- bold green `＋` beside each talent-enhanced stat.

Allow a cell to contain both markers.

- [x] **Step 4: Render the effective default note**

When any field is empty, show the effective default nature and talents being
used. When nature and all three talents are manual, show
`当前性格、天分已手动配置。`.

Use the same resolver for ally and enemy notes.

- [x] **Step 5: Run focused and full verification**

Run:

```powershell
node tests/pvp-default-build-presets-static.test.js
node tests/default-build-static.test.js
node tests/pvp-compact-side-layout-static.test.js
Get-ChildItem tests -Filter *.test.js | Sort-Object Name | ForEach-Object { node $_.FullName }
```

Parse every inline script with `new Function`, run `git diff --check`, and
verify the local page in the in-app Browser at desktop and phone widths.

### Task 4: Documentation And Publication

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/superpowers/plans/2026-06-15-pvp-default-build-presets.md`

- [x] **Step 1: Mark completed plan checkboxes**

Update every completed step from `- [ ]` to `- [x]`.

- [x] **Step 2: Append the work log**

Record the request, changed files, shared resolver, preset interactions,
indicators, tests, browser verification, and final status.

- [x] **Step 3: Stage only scoped files**

Stage:

```text
AGENTS.md
index.html
tests/pvp-default-build-presets-static.test.js
tests/pvp-compact-side-layout-static.test.js
docs/superpowers/plans/2026-06-15-pvp-default-build-presets.md
```

Do not stage the unrelated deleted simplified HTML or WeChat project config
files.

- [x] **Step 4: Commit and push**

Commit with:

```text
feat: add PVP default build presets
```

Push `main` to `origin`.
