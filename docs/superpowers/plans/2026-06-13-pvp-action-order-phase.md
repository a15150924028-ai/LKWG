# PVP Action Order Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a small turn-order and response-success core so the PVP panel can tell which selected action settles first and only show response damage when the opponent action actually triggers it.

**Architecture:** Add a pure `LKWG_PVP_TURN_RULES` module alongside the existing PVP rule modules. Existing PVP state remains unchanged; the UI computes a read-only preview from the two selected actions, current speed values, and optional priority values.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node static regression tests.

---

### Task 1: Pure Turn Rules

**Files:**
- Modify: `index.html`
- Create: `tests/pvp-turn-rules-static.test.js`

- [x] **Step 1: Write the failing test**

Assert that `LKWG_PVP_TURN_RULES` exposes response detection and order resolution:

```js
const sneak = { name: "偷袭", category: "attack", description: "造成物伤，应对状态：本次技能威力变为3倍。" };
const status = { name: "休息", category: "status" };
assert(turnRules.canRespondToAction(sneak, status).type === "attack-status");
```

- [x] **Step 2: Run focused test and verify failure**

Run: `node tests/pvp-turn-rules-static.test.js`

Expected: FAIL because the turn-rule module is not present.

- [x] **Step 3: Add the pure module**

Implement `actionCategory`, `canRespondToAction`, `priorityValue`, and `resolveTurnOrder`.

- [x] **Step 4: Run focused test and verify pass**

Run: `node tests/pvp-turn-rules-static.test.js`

Expected: PASS.

### Task 2: Integrate With PVP Panel

**Files:**
- Modify: `index.html`
- Modify: `tests/pvp-turn-rules-static.test.js`

- [x] **Step 1: Add failing integration assertions**

Require `renderPvpTurnPreview`, `data-pvp-turn-preview`, `responseTriggered`, and gated response damage.

- [x] **Step 2: Run focused test and verify failure**

Run: `node tests/pvp-turn-rules-static.test.js`

Expected: FAIL on missing integration paths.

- [x] **Step 3: Implement the preview and response gate**

Render one preview under weather. If both sides have selected actions, show response-success settlement, defense-response settlement, priority order, speed order, or random exact tie. In `calcPvpDamage`, show response damage only when `canRespondToAction(attackerAction, defenderAction)` returns `attack-status`.

- [x] **Step 4: Run focused and complete tests**

Run:

```powershell
node tests/pvp-turn-rules-static.test.js
$tests = Get-ChildItem tests -Filter '*.test.js' | Sort-Object Name
foreach ($test in $tests) { node $test.FullName; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
```

Expected: all tests pass.

### Task 3: Verify And Publish

**Files:**
- Modify: `AGENTS.md`

- [x] **Step 1: Browser verify**

Open `http://localhost:8000/`, verify the action preview renders without overflow on desktop and mobile, and inspect console warnings/errors.

- [x] **Step 2: Append work log**

Record files, behavior, tests, browser result, and status.

- [x] **Step 3: Commit and push**
