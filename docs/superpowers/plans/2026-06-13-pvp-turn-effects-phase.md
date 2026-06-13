# PVP Turn Effects Phase Implementation Plan

> **For agentic workers:** Implement with TDD. Keep this phase limited to deterministic post-action effects; do not add HP damage settlement, energy deduction, cooldown history, switching, or undo here.

**Goal:** Add a pure turn-effect settlement layer so selected response/status/defense actions can apply confirmed buffs, debuffs, freeze layers, and next-action priority only when the action actually settles.

**Architecture:** Add `LKWG_PVP_EFFECT_RULES` as a pure browser/test module. The PVP panel gets one `结算本回合` button that applies the effect summary to the existing PVP state. Existing damage preview remains read-only.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Node static regression tests.

---

### Task 1: Pure Effect Rules

**Files:**
- Modify: `index.html`
- Create: `tests/pvp-turn-effects-static.test.js`

- [x] **Step 1: Write failing tests**

Cover:

- `水泡盾` does not grant `魔攻+70%` unless `应对攻击` succeeds.
- `有效预防` grants `nextPriority +1` only on successful `应对攻击`.
- `暴风雪` grants enemy `冻结+1`.
- `冰点` grants enemy `冻结+5`, and `应对防御` adds another `+5`.
- `泥浆铠甲` grants self `物攻+60%` and `物防+60%`; on successful `应对防御`, it doubles current positive buffs after adding its own buffs.
- `破防` grants enemy `双防-70%`; on successful `应对防御`, it records a defense cooldown block label.

- [x] **Step 2: Verify red**

Run: `node tests/pvp-turn-effects-static.test.js`

Expected: FAIL because `LKWG_PVP_EFFECT_RULES` does not exist.

- [x] **Step 3: Implement pure rules**

Implement text normalization, base/response clause splitting, stat mod parsing, freeze parsing, priority parsing, buff doubling, and per-side effect summaries.

- [x] **Step 4: Verify green**

Run: `node tests/pvp-turn-effects-static.test.js`

Expected: PASS.

### Task 2: PVP Panel Integration

**Files:**
- Modify: `index.html`
- Modify: `tests/pvp-turn-effects-static.test.js`
- Modify: `tests/pvp-support-defense-effects-static.test.js`

- [x] **Step 1: Write failing integration tests**

Require:

- `renderPvpTurnEffectPreview`
- `data-pvp-settle-turn`
- `applyPvpTurnEffects`
- response-capable status/defense skills remain selected as turn actions instead of immediately applying support buffs.

- [x] **Step 2: Verify red**

Run focused tests and confirm failures.

- [x] **Step 3: Implement integration**

Add the effect preview under the action-order preview and a `结算本回合` button. Applying the button mutates existing PVP state fields: `skillStatMods`, `statusLayers.freeze`, `nextPriority`, and `supportText`.

- [x] **Step 4: Full verification**

Run all tests, parse inline scripts, and run `git diff --check`.

### Task 3: Publish

**Files:**
- Modify: `AGENTS.md`

- [x] **Step 1: Append work log**
- [x] **Step 2: Stage only current files**
- [x] **Step 3: Commit and push `main`
