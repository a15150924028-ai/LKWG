# PVP Turn History Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add visible PVP turn results, one-step undo, and turn-log clearing to finish the current manual round simulator workflow.

**Architecture:** Add a small pure `LKWG_PVP_HISTORY_RULES` module for bounded log entries and snapshot restoration. The PVP panel stores `turnLog`, `undoSnapshot`, and `turnNumber` in `pvpSimState`, records a concise result after each successful `结算本回合`, and exposes `撤回上回合` plus `清空记录` controls without adding automatic switching or full battle automation.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node static regression tests.

---

### Task 1: Pure History Rules

**Files:**
- Create: `tests/pvp-turn-history-static.test.js`
- Modify: `index.html`

- [x] **Step 1: Write failing tests**

Cover bounded log insertion, log clearing, undo snapshot cloning, and keeping the latest entry first.

- [x] **Step 2: Verify red**

Run: `node tests/pvp-turn-history-static.test.js`

Expected: FAIL because `LKWG_PVP_HISTORY_RULES` does not exist.

- [x] **Step 3: Implement pure module**

Expose `cloneState`, `appendTurnLog`, and `clearTurnLog`.

- [x] **Step 4: Verify green**

Run: `node tests/pvp-turn-history-static.test.js`

Expected: PASS for the pure history module.

### Task 2: PVP Panel Integration

**Files:**
- Modify: `index.html`
- Modify: `tests/pvp-turn-history-static.test.js`

- [x] **Step 1: Add failing integration assertions**

Require `renderPvpTurnHistory`, `recordPvpTurnSettlement`, `undoPvpTurnSettlement`, `clearPvpTurnHistory`, `data-pvp-undo-turn`, and `data-pvp-clear-history`.

- [x] **Step 2: Verify red**

Run: `node tests/pvp-turn-history-static.test.js`

Expected: FAIL on missing panel integration.

- [x] **Step 3: Implement integration**

Render turn history below the settlement preview, save a pre-settlement snapshot, record a post-settlement summary when settlement changes state, restore the snapshot on undo, and clear only the visible log/snapshot on clear history.

- [x] **Step 4: Full verification**

Run all tests, parse inline scripts, and run `git diff --check`.

### Task 3: Publish

**Files:**
- Modify: `AGENTS.md`

- [x] **Step 1: Append work log**
- [x] **Step 2: Stage only current files**
- [x] **Step 3: Commit and push `main`
