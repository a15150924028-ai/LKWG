# PVP Skill Data Phase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair the four confirmed key skill descriptions and remove four confirmed invalid isolated skill records without changing PVP calculation behavior yet.

**Architecture:** Keep `data/local-bundle.json` as the runtime source of skill facts. Add a focused Node static regression test that loads the real JSON, verifies the repaired descriptions and rejects the invalid records and stale monster references.

**Tech Stack:** Static HTML/JavaScript, JSON, Node.js assertion scripts.

---

### Task 1: Add Skill Data Regression Test

**Files:**
- Create: `tests/pvp-skill-data-cleanup-static.test.js`

- [ ] **Step 1: Write the failing test**

```js
const assert = require("assert");
const fs = require("fs");
const path = require("path");

const bundle = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "local-bundle.json"), "utf8"));
const skillsByName = new Map(bundle.skills.map((skill) => [skill.name, skill]));

const expectedDescriptions = {
  "偷袭": "造成物伤，应对状态：本次技能威力变为3倍。",
  "技巧打击": "造成物伤，应对状态：本次技能威力变为10倍。",
  "有效预防": "减伤50%，应对攻击：下一次行动获得先手+1。",
  "无畏之心": "减伤100%，应对攻击：将减免的伤害转化为等量生命恢复，且本技能能耗永久+2。"
};

for (const [name, description] of Object.entries(expectedDescriptions)) {
  assert.equal(skillsByName.get(name)?.description, description, `${name} description should be repaired`);
}

for (const name of ["水星水", "冰荆棘", "冰刺", "极速冷冻"]) {
  assert.equal(skillsByName.has(name), false, `${name} should be removed`);
  assert.equal(
    bundle.monsters.some((monster) => monster.skillIds.includes(`skill-${name}`)),
    false,
    `${name} should not remain in a monster skill pool`
  );
}

console.log("PVP skill data cleanup static test passed.");
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
node tests/pvp-skill-data-cleanup-static.test.js
```

Expected: FAIL because the four descriptions are still `耗能` and the invalid skills still exist.

### Task 2: Repair Local Skill Facts

**Files:**
- Modify: `data/local-bundle.json`

- [ ] **Step 1: Replace the four confirmed descriptions**

Use the exact normalized local descriptions asserted by Task 1. Preserve all other skill fields.

- [ ] **Step 2: Remove the four invalid skill objects**

Remove only:

```text
skill-水星水
skill-冰荆棘
skill-冰刺
skill-极速冷冻
```

- [ ] **Step 3: Remove stale references if present**

Filter those four IDs from every `monster.skillIds` array. Do not modify any other monster or skill-pool relationship.

- [ ] **Step 4: Run focused test**

Run:

```powershell
node tests/pvp-skill-data-cleanup-static.test.js
```

Expected: PASS.

### Task 3: Verify The Data Bundle

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Run JSON and import validation**

Run:

```powershell
node tests/local-bundle-import-validation.test.js
node tests/local-bundle-external-static.test.js
node tests/local-bundle-evolution-static.test.js
```

Expected: all PASS.

- [ ] **Step 2: Run existing PVP static tests**

Run:

```powershell
Get-ChildItem tests\pvp-*-static.test.js | ForEach-Object { node $_.FullName }
```

Expected: all PASS.

- [ ] **Step 3: Parse inline scripts and check whitespace**

Run the existing inline-script parse check used by the repository, then:

```powershell
git diff --check
```

Expected: no parse errors and no whitespace errors.

- [ ] **Step 4: Append work log**

Add a dated `Codex` entry to `AGENTS.md` describing the request, changed files, verification, and status.

### Task 4: Publish The Phase

**Files:**
- Stage only:
  - `data/local-bundle.json`
  - `tests/pvp-skill-data-cleanup-static.test.js`
  - `docs/superpowers/specs/2026-06-13-pvp-turn-simulator-design.md`
  - `docs/superpowers/plans/2026-06-13-pvp-skill-data-phase.md`
  - `AGENTS.md`

- [ ] **Step 1: Inspect scoped diff**

Run:

```powershell
git status --short
git diff -- data/local-bundle.json tests/pvp-skill-data-cleanup-static.test.js docs/superpowers/specs/2026-06-13-pvp-turn-simulator-design.md docs/superpowers/plans/2026-06-13-pvp-skill-data-phase.md AGENTS.md
```

- [ ] **Step 2: Commit**

```powershell
git add -- data/local-bundle.json tests/pvp-skill-data-cleanup-static.test.js docs/superpowers/specs/2026-06-13-pvp-turn-simulator-design.md docs/superpowers/plans/2026-06-13-pvp-skill-data-phase.md AGENTS.md
git commit -m "Repair PVP skill source data"
```

- [ ] **Step 3: Push main**

```powershell
git push origin main
```

Expected: `main` is updated on GitHub while the unrelated deleted simplified HTML file remains unstaged.
