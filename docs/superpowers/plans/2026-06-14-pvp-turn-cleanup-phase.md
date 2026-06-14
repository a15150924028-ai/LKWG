# PVP Turn Cleanup Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic cleanup after a settled PVP turn so selected actions and one-shot next-attack bonuses do not repeat forever.

**Architecture:** Add a pure `LKWG_PVP_CLEANUP_RULES` module for post-settlement side cleanup. The PVP panel calls it at the end of the existing `结算本回合` flow, after HP/effects/energy/cooldown have been applied, leaving persistent state such as HP, energy, freeze layers, defense locks, and skill-cost overrides intact.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node static regression tests.

---

### Task 1: Pure Cleanup Rules

**Files:**
- Create: `tests/pvp-turn-cleanup-static.test.js`
- Modify: `index.html`

- [x] **Step 1: Write failing tests**

Cover clearing selected actions after settlement, clearing action snapshots, clearing one-shot next-attack power and hit-count bonuses, and preserving persistent state such as HP, energy, freeze layers, defense locks, and skill cost overrides.

- [x] **Step 2: Verify red**

Run: `node tests/pvp-turn-cleanup-static.test.js`

Expected: FAIL because `LKWG_PVP_CLEANUP_RULES` does not exist.

- [x] **Step 3: Implement pure module**

Expose `cleanupSideAfterTurn` and `cleanupTurn`.

- [x] **Step 4: Verify green**

Run: `node tests/pvp-turn-cleanup-static.test.js`

Expected: PASS for the pure cleanup module.

### Task 2: PVP Panel Integration

**Files:**
- Modify: `index.html`
- Modify: `tests/pvp-turn-cleanup-static.test.js`

- [x] **Step 1: Add failing integration assertions**

Require `applyPvpTurnCleanup`, `window.LKWG_PVP_CLEANUP_RULES.cleanupTurn`, and a call to `applyPvpTurnCleanup(context)` in the settle-turn flow.

- [x] **Step 2: Verify red**

Run: `node tests/pvp-turn-cleanup-static.test.js`

Expected: FAIL on missing integration.

- [x] **Step 3: Implement integration**

Apply cleanup at the end of `applyPvpTurnEffects()`, clear selected actions so users choose next turn manually, clear one-shot next-attack bonus fields, and append a short support label only when cleanup changed state.

- [x] **Step 4: Full verification**

Run all tests, parse inline scripts, and run `git diff --check`.

### Task 3: Publish

**Files:**
- Modify: `AGENTS.md`

- [x] **Step 1: Append work log**
- [x] **Step 2: Stage only current files**
- [x] **Step 3: Commit and push `main`
