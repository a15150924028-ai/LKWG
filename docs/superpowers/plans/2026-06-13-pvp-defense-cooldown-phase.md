# PVP Defense Cooldown Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic PVP defense-skill cooldown and defense-disable settlement.

**Architecture:** Add a pure `LKWG_PVP_COOLDOWN_RULES` module. The PVP panel uses it during `结算本回合`, stores the shared defense cooldown/disable counter in the existing `defenseBlockTurns` state field, and prevents defense skills from being selected while the counter is active.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node static regression tests.

---

### Task 1: Pure Cooldown Rules

**Files:**
- Modify: `index.html`
- Create: `tests/pvp-defense-cooldown-static.test.js`

- [x] **Step 1: Write failing tests**

Cover:

- Any defense skill used this turn gives `defenseBlockTurns = 1`.
- `壁垒` gives `0` when `应对攻击` succeeds.
- `破防` response effect overrides/shared-cooldowns the target defense to `2`.
- Existing `defenseBlockTurns` decrements by one on each settled turn before new blocks are applied.

- [x] **Step 2: Verify red**

Run: `node tests/pvp-defense-cooldown-static.test.js`

Expected: FAIL because `LKWG_PVP_COOLDOWN_RULES` does not exist.

- [x] **Step 3: Implement pure module**

Expose `isDefenseAction`, `baseDefenseCooldown`, `settleDefenseCounter`, and `resolveTurnCooldowns`.

- [x] **Step 4: Verify green**

Run: `node tests/pvp-defense-cooldown-static.test.js`

Expected: PASS.

### Task 2: PVP Panel Integration

**Files:**
- Modify: `index.html`
- Modify: `tests/pvp-defense-cooldown-static.test.js`

- [x] **Step 1: Add failing integration assertions**

Require `defenseSkillLocked`, `applyPvpTurnCooldowns`, `data-pvp-defense-lock`, `window.LKWG_PVP_COOLDOWN_RULES.resolveTurnCooldowns`, and disabled defense selection during active lock.

- [x] **Step 2: Verify red**

Run: `node tests/pvp-defense-cooldown-static.test.js`

Expected: FAIL on missing integration.

- [x] **Step 3: Implement integration**

Prevent selecting defense actions when `defenseBlockTurns > 0`, render lock text on defense skill slots, apply cooldown settlement before ordinary effect writes, and include cooldown labels in state text.

- [x] **Step 4: Full verification**

Run all tests, parse inline scripts, and run `git diff --check`.

### Task 3: Publish

**Files:**
- Modify: `AGENTS.md`

- [x] **Step 1: Append work log**
- [x] **Step 2: Stage only current files**
- [x] **Step 3: Commit and push `main`
