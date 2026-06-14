# PVP HP Settlement Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic current-HP settlement for selected PVP turn actions.

**Architecture:** Add a pure `LKWG_PVP_HP_RULES` module for HP clamping, damage application, healing, and defense conversion healing such as `无畏之心`. The PVP panel stores each side's current HP in the existing side state, defaults it from the selected monster's battle HP, renders HP controls in the state panel, and applies HP settlement from the existing `结算本回合` button.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node static regression tests.

---

### Task 1: Pure HP Rules

**Files:**
- Create: `tests/pvp-hp-settlement-static.test.js`
- Modify: `index.html`

- [x] **Step 1: Write failing tests**

Cover normal damage, clamped healing, clamped damage, and `无畏之心` converting prevented damage into healing while taking zero actual damage.

- [x] **Step 2: Verify red**

Run: `node tests/pvp-hp-settlement-static.test.js`

Expected: FAIL because `LKWG_PVP_HP_RULES` does not exist.

- [x] **Step 3: Implement pure module**

Expose `clampHp`, `actionHasFearlessHeart`, `settleIncomingDamage`, and `resolveTurnHp`.

- [x] **Step 4: Verify green**

Run: `node tests/pvp-hp-settlement-static.test.js`

Expected: PASS.

### Task 2: PVP Panel Integration

**Files:**
- Modify: `index.html`
- Modify: `tests/pvp-hp-settlement-static.test.js`

- [x] **Step 1: Add failing integration assertions**

Require `currentHp`, HP controls, `currentPvpTurnHp`, `applyPvpTurnHp`, and HP summary text in the turn-settlement preview.

- [x] **Step 2: Verify red**

Run: `node tests/pvp-hp-settlement-static.test.js`

Expected: FAIL on missing panel integration.

- [x] **Step 3: Implement integration**

Normalize current HP from battle max HP, render current HP controls in the PVP state panel, compute outgoing damage for both selected actions, apply HP settlement before ordinary post-action effects, and append HP labels to support text.

- [x] **Step 4: Full verification**

Run all tests, parse inline scripts, and run `git diff --check`.

### Task 3: Publish

**Files:**
- Modify: `AGENTS.md`

- [x] **Step 1: Append work log**
- [x] **Step 2: Stage only current files**
- [x] **Step 3: Commit and push `main`
