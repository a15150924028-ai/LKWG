# PVP Energy Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic PVP energy-cost settlement for selected actions, shared weather cost reduction, and confirmed permanent per-skill energy-cost changes.

**Architecture:** Add a pure `LKWG_PVP_ENERGY_RULES` module. The PVP panel uses it during turn settlement after effect settlement, writes current energy back to side state, and stores per-skill permanent cost overrides in `skillCostOverrides`.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node static regression tests.

---

### Task 1: Pure Energy Rules

**Files:**
- Modify: `index.html`
- Create: `tests/pvp-energy-static.test.js`

- [x] **Step 1: Write failing tests**

Cover base cost, state overrides, sandstorm/trait reductions, current-release cost before permanent changes, `水刃` response `本技能能耗永久-3`, and `无畏之心` response `本技能能耗永久+2`.

- [x] **Step 2: Verify red**

Run: `node tests/pvp-energy-static.test.js`

Expected: FAIL because `LKWG_PVP_ENERGY_RULES` does not exist.

- [x] **Step 3: Implement pure module**

Expose `baseSkillCost`, `currentSkillCost`, `effectiveSkillCost`, `resolveActionEnergy`, and `resolveTurnEnergy`.

- [x] **Step 4: Verify green**

Run: `node tests/pvp-energy-static.test.js`

Expected: PASS.

### Task 2: PVP Panel Integration

**Files:**
- Modify: `index.html`
- Modify: `tests/pvp-energy-static.test.js`

- [x] **Step 1: Add failing integration assertions**

Require `applyPvpTurnEnergy`, `data-pvp-energy-value`, `data-pvp-energy`, `skillCostOverrides`, and `window.LKWG_PVP_ENERGY_RULES.resolveTurnEnergy`.

- [x] **Step 2: Verify red**

Run: `node tests/pvp-energy-static.test.js`

Expected: FAIL on missing integration paths.

- [x] **Step 3: Implement integration**

Render current energy in the buff panel, add `+/-` controls, apply energy settlement inside `结算本回合`, display energy labels in turn-effect preview, and keep permanent cost overrides in state.

- [x] **Step 4: Full verification**

Run all tests, parse inline scripts, and run `git diff --check`.

### Task 3: Publish

**Files:**
- Modify: `AGENTS.md`

- [x] **Step 1: Append work log**
- [x] **Step 2: Stage only current files**
- [x] **Step 3: Commit and push `main`
