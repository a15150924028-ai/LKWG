# PVP Trait Layers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a non-negative, unlimited manual trait-layer control to eligible PVP monsters and make those layers the sole source of their cumulative trait effects.

**Architecture:** Create a small CommonJS/browser-compatible trait rules module containing evolution-chain eligibility, boss-form overrides, defaults, and per-layer effects. The HTML owns UI state and rendering, while the rules module returns stat, power, hit-count, skill-cost, and energy adjustments consumed by the existing PVP calculation pipeline.

**Tech Stack:** Static HTML/CSS/JavaScript, CommonJS-compatible browser modules, Node.js `assert` tests.

---

## File Structure

- Create `pvp_trait_rules.js`: pure trait-layer registry and calculation helpers with no DOM dependency.
- Create `tests/pvp-trait-layers.test.js`: unit tests for eligibility, defaults, boss overrides, bounds, and every effect category.
- Create `tests/html-pvp-trait-layer-integration.test.js`: static integration checks that the HTML loads and uses the rules module.
- Modify `克制面查询.html`: load the module, store/reset layer state, render controls, bind buttons, and feed effects into PVP calculation.
- Modify `README.md`: document the new test commands and trait-layer behavior.

### Task 1: Build the trait-layer rule registry

**Files:**
- Create: `pvp_trait_rules.js`
- Test: `tests/pvp-trait-layers.test.js`

- [ ] **Step 1: Write failing registry and default-layer tests**

Create `tests/pvp-trait-layers.test.js` with assertions covering:

```javascript
const assert = require("node:assert/strict");
const rules = require("../pvp_trait_rules.js");

const monster = (name, chainId) => ({ name, chainId });

assert.equal(rules.resolveTraitRule(monster("蹦床松鼠", "049")).traitName, "囤积");
assert.equal(rules.defaultTraitLayers(monster("蹦床松鼠", "049")), 10);
assert.equal(rules.defaultTraitLayers(monster("抱枕松鼠", "049")), 10);
assert.equal(rules.defaultTraitLayers(monster("音速犬", "chain-speeddog")), 10);
assert.equal(rules.defaultTraitLayers(monster("护主犬", "chain-speeddog")), 10);

const stormDog = rules.resolveTraitRule(monster("风暴战犬", "chain-speeddog"));
assert.equal(stormDog.traitName, "全神贯注");
assert.equal(rules.defaultTraitLayers(monster("风暴战犬", "chain-speeddog")), 10);

assert.equal(rules.resolveTraitRule(monster("绿耳松鼠", "049")).traitName, "囤积");
assert.equal(rules.resolveTraitRule(monster("皇家狮鹫（高山地的样子）", "165")).traitName, "乘风连击");
assert.equal(rules.resolveTraitRule(monster("普通测试精灵", "none")), null);
assert.equal(rules.normalizeTraitLayers(-1), 0);
assert.equal(rules.normalizeTraitLayers(37), 37);
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
node tests/pvp-trait-layers.test.js
```

Expected: failure because `pvp_trait_rules.js` does not exist.

- [ ] **Step 3: Implement the browser/CommonJS module and complete registry**

Create `pvp_trait_rules.js` using this public API:

```javascript
(function init(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.LKWG_PVP_TRAIT_RULES = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function buildRules() {
  const RULES = [
    { chainIds: ["season-s2-afec977b0e76"], names: ["巨鼓象"], traitName: "合拍", statPerLayer: { atk: 0.2, defense: 0.2 } },
    { chainIds: ["049"], traitName: "囤积", defaultLayers: 10, statPerLayer: { defense: 0.1, spd: 0.1 } },
    { chainIds: ["181"], traitName: "身经百练", powerPercentPerLayer: 0.2, actionTypes: ["water", "fighting"] },
    { chainIds: ["165"], traitName: "乘风连击", hitCountPerLayer: 1 },
    { chainIds: ["239"], traitName: "洄游", costReductionPerLayer: 1 },
    { chainIds: ["212", "216"], traitName: "拨浪鼓", flatPowerPerLayer: 10, actionTypes: ["poison", "cute"] },
    { chainIds: ["085"], traitName: "嫁祸", hitCountPerLayer: 2 },
    { chainIds: ["102"], traitName: "自由飘", hitCountPerLayer: 2 },
    { chainIds: ["185"], traitName: "守护者", costReductionPerLayer: 1 },
    { chainIds: ["096"], traitName: "咔咔冲刺", hitCountPerLayer: 1 },
    { chainIds: ["221"], traitName: "定向精炼", flatPowerPerLayer: 10, actionTypes: ["mechanical", "ground"] },
    { chainIds: ["chain-chicken"], names: ["绅士鸡"], traitName: "指挥家", statPerLayer: { atk: 0.2, spa: 0.2 } },
    { chainIds: ["chain-chicken"], names: ["武者鸡"], traitName: "斗技", flatPowerPerLayer: 20 },
    { chainIds: ["171"], traitName: "消波块", costReductionPerLayer: 1, actionTypes: ["ground"] },
    { chainIds: ["323"], traitName: "血型吸引", flatPowerPerLayer: 10 },
    { chainIds: ["258"], traitName: "恶魔的晚宴", statPerLayer: { atk: 0.5, spa: 0.5 } },
    { chainIds: ["chain-dimo"], names: ["迪莫", "圣光迪莫"], traitName: "最好的伙伴", statPerLayer: { atk: 0.2, spa: 0.2, defense: 0.2, spd: 0.2, spe: 0.2 }, energyPerLayer: 2 },
    { chainIds: ["327"], traitName: "搜刮", statPerLayer: { spa: 0.2 } },
    { chainIds: ["chain-speeddog"], names: ["护主犬", "音速犬"], traitName: "专注力", defaultLayers: 10, statPerLayer: { atk: 0.1 } },
    { chainIds: ["chain-speeddog"], names: ["风暴战犬"], traitName: "全神贯注", defaultLayers: 10, statPerLayer: { atk: 0.1 } }
  ];

  const BOSS_TRAIT_NAMES = {
    "风暴战犬": "全神贯注",
    "黑猫密探": "先知",
    "恶魔狼王": "悼亡",
    "神谕鲨": "水翼飞升",
    "奇梦咪": "三鼓作气",
    "棋契陛下": "御驾亲征",
    "花魁蜂后": "虫群突袭",
    "烈火战神": "爆燃",
    "波普鹿": "超级电池"
  };

  function normalizeTraitLayers(value) {
    return Math.max(0, Math.round(Number(value) || 0));
  }

  function matchesRule(monster, rule) {
    const name = String(monster?.name || "");
    const chainId = String(monster?.chainId || "");
    if (rule.names?.length && !rule.names.some((item) => name === item || name.startsWith(`${item}（`))) return false;
    return rule.chainIds.includes(chainId);
  }

  function resolveTraitRule(monster) {
    return RULES.find((rule) => matchesRule(monster, rule)) || null;
  }

  function defaultTraitLayers(monster) {
    return normalizeTraitLayers(resolveTraitRule(monster)?.defaultLayers || 0);
  }

  function traitName(monster) {
    return BOSS_TRAIT_NAMES[monster?.name] || resolveTraitRule(monster)?.traitName || "";
  }

  function resolveTraitEffects(monster, layers, action = null) {
    const rule = resolveTraitRule(monster);
    const count = normalizeTraitLayers(layers);
    const actionAllowed = !rule?.actionTypes?.length || rule.actionTypes.includes(action?.type);
    const statMods = { hp: 0, atk: 0, defense: 0, spa: 0, spd: 0, spe: 0 };
    if (rule) {
      Object.entries(rule.statPerLayer || {}).forEach(([key, value]) => {
        statMods[key] = value * count;
      });
    }
    return {
      rule,
      layers: count,
      traitName: traitName(monster),
      statMods,
      flatPower: actionAllowed ? (rule?.flatPowerPerLayer || 0) * count : 0,
      powerMultiplier: actionAllowed ? 1 + (rule?.powerPercentPerLayer || 0) * count : 1,
      hitCountAdd: actionAllowed ? (rule?.hitCountPerLayer || 0) * count : 0,
      skillCostReduction: actionAllowed ? (rule?.costReductionPerLayer || 0) * count : 0,
      energyGain: (rule?.energyPerLayer || 0) * count
    };
  }

  return {
    RULES,
    BOSS_TRAIT_NAMES,
    normalizeTraitLayers,
    resolveTraitRule,
    defaultTraitLayers,
    traitName,
    resolveTraitEffects
  };
});
```

- [ ] **Step 4: Extend tests for every effect category**

Add exact assertions:

```javascript
assert.deepEqual(
  rules.resolveTraitEffects(monster("巨鼓象", "season-s2-afec977b0e76"), 3).statMods,
  { hp: 0, atk: 0.6, defense: 0.6, spa: 0, spd: 0, spe: 0 }
);
assert.equal(rules.resolveTraitEffects(monster("海豹船长", "181"), 2, { type: "water" }).powerMultiplier, 1.4);
assert.equal(rules.resolveTraitEffects(monster("海豹船长", "181"), 2, { type: "fire" }).powerMultiplier, 1);
assert.equal(rules.resolveTraitEffects(monster("皇家狮鹫（崖间地的样子）", "165"), 4).hitCountAdd, 4);
assert.equal(rules.resolveTraitEffects(monster("龙鱼", "239"), 3).skillCostReduction, 3);
assert.equal(rules.resolveTraitEffects(monster("寒音蛇（本来的样子）", "212"), 2, { type: "poison" }).flatPower, 20);
assert.equal(rules.resolveTraitEffects(monster("武者鸡", "chain-chicken"), 3).flatPower, 60);
assert.equal(rules.resolveTraitEffects(monster("嗜波螺", "171"), 4, { type: "ground" }).skillCostReduction, 4);
assert.equal(rules.resolveTraitEffects(monster("迪莫", "chain-dimo"), 2).energyGain, 4);
```

- [ ] **Step 5: Run the unit test**

Run:

```powershell
node tests/pvp-trait-layers.test.js
```

Expected: `pvp trait layer rules ok`.

- [ ] **Step 6: Commit the isolated rules module**

```powershell
git add -- pvp_trait_rules.js tests/pvp-trait-layers.test.js
git commit -m "Add PVP trait layer rules"
```

### Task 2: Integrate trait layers into PVP state and calculation

**Files:**
- Modify: `克制面查询.html:1565-1567`
- Modify: `克制面查询.html:1913-1914`
- Modify: `克制面查询.html:3440-3478`
- Modify: `克制面查询.html:3707-3830`
- Modify: `克制面查询.html:4279-4375`
- Test: `tests/html-pvp-trait-layer-integration.test.js`

- [ ] **Step 1: Write failing static integration checks**

Create `tests/html-pvp-trait-layer-integration.test.js`:

```javascript
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "克制面查询.html"), "utf8");

assert.match(html, /<script src="\.\/pvp_trait_rules\.js"><\/script>/);
assert.match(html, /traitLayers:\s*0/);
assert.match(html, /defaultTraitLayers\(monster\)/);
assert.match(html, /resolveTraitEffects\(attacker,\s*attackerState\?\.traitLayers/);
assert.match(html, /data-pvp-trait-layer=/);
assert.match(html, /Math\.max\(0,/);

console.log("html pvp trait layer integration ok");
```

- [ ] **Step 2: Run the integration test and verify it fails**

Run:

```powershell
node tests/html-pvp-trait-layer-integration.test.js
```

Expected: failure because the module and state are not connected.

- [ ] **Step 3: Load the module and add normalized state**

Add:

```html
<script src="./pvp_trait_rules.js"></script>
```

Add `traitLayers: 0` to both PVP side initial states.

In `pvpSideState(side)` normalize with:

```javascript
state.traitLayers = window.LKWG_PVP_TRAIT_RULES.normalizeTraitLayers(state.traitLayers);
```

In `clearPvpSideState(state)` set:

```javascript
state.traitLayers = 0;
```

Add:

```javascript
function resetPvpTraitLayers(state, monster) {
  state.traitLayers = window.LKWG_PVP_TRAIT_RULES.defaultTraitLayers(monster);
}
```

Call it whenever the selected monster changes, after `state.monsterId` has been assigned. Do not call it when bloodline, nature, talent, or skill changes.

- [ ] **Step 4: Replace cumulative automatic effects with layer effects**

At the start of `passiveStatMods(monster, state)`, obtain:

```javascript
const layerRule = window.LKWG_PVP_TRAIT_RULES.resolveTraitRule(monster);
const layerEffects = window.LKWG_PVP_TRAIT_RULES.resolveTraitEffects(monster, state?.traitLayers);
```

Merge `layerEffects.statMods` once. Skip old automatic handling only when it corresponds to `layerRule.traitName`. In particular, remove the separate `专注力` hard-coded `+100%` branch and the `囤积` energy branch for eligible monsters. Keep unrelated instantaneous passive logic intact.

- [ ] **Step 5: Feed action-dependent layer effects into damage**

In `calcPvpDamage`, resolve:

```javascript
const attackerTraitEffects = window.LKWG_PVP_TRAIT_RULES.resolveTraitEffects(
  attacker,
  attackerState?.traitLayers,
  battleAction
);
```

Apply:

```javascript
const traitAdjustedPower = Math.max(1,
  (Number(variableDamage.power) + attackerTraitEffects.flatPower)
  * attackerTraitEffects.powerMultiplier
);
const hitCount = Math.max(
  1,
  (Number(variableDamage.hitCount) || 1) + attackerTraitEffects.hitCountAdd
);
const traitSkillCost = Math.max(
  0,
  (attackerState?.skillCostOverrides?.[battleAction.id] ?? battleAction.pp)
  - attackerTraitEffects.skillCostReduction
);
```

Pass `traitSkillCost` as `currentSkillCost` to `resolvePvpVariableDamage`. Include layer-derived energy in the existing capped energy context:

```javascript
attackerEnergy: Math.min(
  DEFAULT_PVP_ENERGY,
  (Number(attackerState?.energy) || DEFAULT_PVP_ENERGY) + attackerTraitEffects.energyGain
)
```

Do not append trait-layer labels to `attackerLabels`, `defenderLabels`, or the red damage-detail line.

- [ ] **Step 6: Run calculation and integration tests**

Run:

```powershell
node tests/pvp-trait-layers.test.js
node tests/html-pvp-trait-layer-integration.test.js
node tests/pvp-variable-damage.test.js
node --check pvp_trait_rules.js
```

Expected: all scripts print their success message; syntax check exits `0`.

- [ ] **Step 7: Commit calculation integration**

```powershell
git add -- 克制面查询.html tests/html-pvp-trait-layer-integration.test.js
git commit -m "Integrate trait layers into PVP damage"
```

### Task 3: Render and bind the trait-layer controls

**Files:**
- Modify: `克制面查询.html` CSS near `.pvp-buff-panel`
- Modify: `克制面查询.html:4445-4480`
- Modify: `克制面查询.html:4764-4780`
- Test: `tests/html-pvp-trait-layer-integration.test.js`

- [ ] **Step 1: Extend the failing HTML assertions**

Add:

```javascript
assert.match(html, /特性层数/);
assert.match(html, /data-pvp-trait-layer="[^"]+"/);
assert.match(html, /data-delta="-1"/);
assert.match(html, /data-delta="1"/);
assert.match(html, /pvp-trait-layer-row/);
```

Run:

```powershell
node tests/html-pvp-trait-layer-integration.test.js
```

Expected: failure because the row is not rendered.

- [ ] **Step 2: Render one compact row only for eligible monsters**

Inside `renderPvpManualBuffPanel(side, state)`, resolve the selected monster and rule:

```javascript
const monster = monsterById.get(state?.monsterId);
const traitRule = window.LKWG_PVP_TRAIT_RULES.resolveTraitRule(monster);
const traitName = window.LKWG_PVP_TRAIT_RULES.traitName(monster);
const traitLayers = window.LKWG_PVP_TRAIT_RULES.normalizeTraitLayers(state?.traitLayers);
```

Append after `.pvp-buff-grid` only when `traitRule` exists:

```html
<div class="pvp-trait-layer-row">
  <div class="pvp-trait-layer-copy">
    <strong>特性层数 · ${escapeHtml(traitName)}</strong>
  </div>
  <div class="pvp-buff-controls">
    <button class="pvp-buff-button" type="button"
      data-pvp-trait-layer="${side}" data-delta="-1">-</button>
    <span class="pvp-buff-value"
      data-pvp-trait-layer-value="${side}">${traitLayers}</span>
    <button class="pvp-buff-button" type="button"
      data-pvp-trait-layer="${side}" data-delta="1">+</button>
  </div>
</div>
```

- [ ] **Step 3: Add stable responsive styling**

Use a separate full-width row with no nested card:

```css
.pvp-trait-layer-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(132px, 0.8fr);
  gap: 10px;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
}
.pvp-trait-layer-copy {
  min-width: 0;
  color: var(--muted);
}
.pvp-trait-layer-copy strong {
  display: block;
  overflow: hidden;
  color: var(--ink);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pvp-trait-layer-row .pvp-buff-controls {
  grid-template-columns: 36px minmax(56px, 1fr) 36px;
}
@media (max-width: 520px) {
  .pvp-trait-layer-row {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Bind buttons with a zero floor and no upper clamp**

In the PVP side binding loop:

```javascript
root.querySelectorAll(`[data-pvp-trait-layer="${side}"]`).forEach((button) => {
  button.addEventListener("click", () => {
    const delta = Number(button.dataset.delta) || 0;
    state.traitLayers = Math.max(
      0,
      window.LKWG_PVP_TRAIT_RULES.normalizeTraitLayers(state.traitLayers) + delta
    );
    refreshPvpManualBuffPanel(root, side);
    refreshPvpDamageOutputs(root);
  });
});
```

Extend `refreshPvpManualBuffPanel` to update `[data-pvp-trait-layer-value]`.

- [ ] **Step 5: Run all automated tests**

Run:

```powershell
node tests/pvp-trait-layers.test.js
node tests/html-pvp-trait-layer-integration.test.js
node tests/pvp-variable-damage.test.js
node tests/html-skill-overrides.test.js
node tests/relation-table.test.js
node --check pvp_trait_rules.js
node --check pvp_damage_rules.js
```

Expected: all tests pass and both syntax checks exit `0`.

- [ ] **Step 6: Commit the UI**

```powershell
git add -- 克制面查询.html tests/html-pvp-trait-layer-integration.test.js
git commit -m "Add PVP trait layer controls"
```

### Task 4: Browser verification and regression checks

**Files:**
- Modify if needed: `克制面查询.html`
- Modify: `README.md`

- [ ] **Step 1: Open the local HTML in the in-app browser**

Open:

```text
file:///C:/codex-work/codex-lkwg/%E5%85%8B%E5%88%B6%E9%9D%A2%E6%9F%A5%E8%AF%A2.html
```

Verify desktop and narrow mobile widths.

- [ ] **Step 2: Verify default and reset behavior**

Check:

1. Select 蹦床松鼠 or another chain `049` member: row appears at `10`.
2. Select 音速犬 or 护主犬: row appears at `10`.
3. Select 风暴战犬: label is `全神贯注`, not `专注力`, and value is `10`.
4. Select 巨鼓象: value starts at `0`.
5. Select an unsupported monster: row disappears.
6. Switch back to 蹦床松鼠: value resets to `10`.

- [ ] **Step 3: Verify calculations without duplicate effects**

Check:

1. 蹦床松鼠 at 10 layers: physical and magical defense are exactly the base PVP values with `+100%`, not `+200%`.
2. Reduce to 7: both defenses update to `+70%`.
3. 音速犬 at 10: physical attack receives exactly `+100%`.
4. Reduce to 0: the physical attack bonus disappears.
5. 巨鼓象 at 3: physical attack and physical defense each receive `+60%`.
6. A trait that adds hit count renders damage in `x×y` format with the increased hit count.
7. Trait-layer effects do not create an extra red trait line in damage details.

- [ ] **Step 4: Verify layout**

Check:

- The new row does not increase individual controls beyond the existing normal size.
- Labels do not overlap buttons at 491px, 599px, and desktop widths.
- Minus, integer value, and plus remain on one line.
- Existing buff controls retain their current positions.

- [ ] **Step 5: Document tests**

Add to `README.md`:

````markdown
## Verification

Run:

```powershell
node tests/pvp-trait-layers.test.js
node tests/html-pvp-trait-layer-integration.test.js
node tests/pvp-variable-damage.test.js
node tests/html-skill-overrides.test.js
node tests/relation-table.test.js
```

PVP cumulative trait effects use the manual trait-layer value as their only source. 蹦床松鼠进化链、音速犬和护主犬默认 10 层；其他 supported traits default to 0.
````

- [ ] **Step 6: Run final verification**

Run:

```powershell
git diff --check
node tests/pvp-trait-layers.test.js
node tests/html-pvp-trait-layer-integration.test.js
node tests/pvp-variable-damage.test.js
node tests/html-skill-overrides.test.js
node tests/relation-table.test.js
```

Expected: `git diff --check` prints nothing and all tests pass.

- [ ] **Step 7: Commit and push**

```powershell
git add -- README.md 克制面查询.html pvp_trait_rules.js tests/pvp-trait-layers.test.js tests/html-pvp-trait-layer-integration.test.js
git commit -m "Complete PVP trait layer support"
git push origin main
```
