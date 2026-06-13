# PVP Weather Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one shared PVP weather selector and apply the confirmed rain, sandstorm, and blizzard effects to both sides.

**Architecture:** Store weather once on `pvpSimState`, render one segmented control above both combatants, and route weather effects through small pure helpers. Damage calculation reads the shared weather for rain power, sandstorm cost, weather-dependent skill types, and blizzard freeze layers; selecting a weather skill updates the same shared state.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node static regression tests.

---

### Task 1: Weather Rules

**Files:**
- Modify: `index.html`
- Create: `tests/pvp-weather-static.test.js`

- [ ] **Step 1: Write the failing weather-rule test**

Assert that weather normalization, skill-to-weather mapping, rain multiplier, sandstorm cost reduction, ice immunity, and eight blizzard freeze layers are exposed through `LKWG_PVP_WEATHER_RULES`.

- [ ] **Step 2: Run the focused test**

Run: `node tests/pvp-weather-static.test.js`

Expected: FAIL because the weather rule module does not exist.

- [ ] **Step 3: Add the pure weather-rule module**

Implement `normalizeWeather`, `weatherFromSkill`, `weatherPowerMultiplier`, `weatherSkillCostReduction`, and `weatherStatusLayers` without reading DOM state.

- [ ] **Step 4: Run the focused test**

Run: `node tests/pvp-weather-static.test.js`

Expected: PASS.

### Task 2: Shared Weather UI And Calculator Integration

**Files:**
- Modify: `index.html`
- Modify: `tests/pvp-weather-static.test.js`

- [ ] **Step 1: Add failing integration assertions**

Require a shared `pvpSimState.weather`, a `data-pvp-weather` segmented control, local type icons, weather-colored selected buttons, automatic weather-skill updates, and weather inputs in `calcPvpDamage`.

- [ ] **Step 2: Run the focused test**

Run: `node tests/pvp-weather-static.test.js`

Expected: FAIL on missing UI and integration paths.

- [ ] **Step 3: Implement the UI and integration**

Render `无天气 / 雨天 / 沙暴 / 暴风雪` once above the two PVP sides. Use local water, ground, and ice icons and `TYPE_COLORS` for selected backgrounds. Apply rain as `weatherMultiplier = 1.75` for water attacks, sandstorm as ground cost `-2` with minimum zero, and blizzard as eight freeze layers for non-ice defenders. Selecting or using `落雨`, `沙涌`, or `冬至` updates the shared weather.

- [ ] **Step 4: Run focused and complete tests**

Run:

```powershell
node tests/pvp-weather-static.test.js
$tests = Get-ChildItem tests -Filter '*.test.js' | Sort-Object Name
foreach ($test in $tests) { node $test.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
```

Expected: all tests pass.

### Task 3: Verify And Publish

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Parse inline scripts and inspect the diff**

Run inline-script parsing with `new Function`, then `git diff --check` and `git status --short`.

- [ ] **Step 2: Append the work log**

Record the weather behavior, files, tests, browser verification status, and completion state.

- [ ] **Step 3: Commit only scoped files**

Stage `index.html`, `tests/pvp-weather-static.test.js`, this plan, and `AGENTS.md`. Keep the unrelated deletion of `克制面查询-简洁版.html` unstaged.

- [ ] **Step 4: Push main**

Commit with `Implement PVP weather effects` and push `main` to `origin`.
