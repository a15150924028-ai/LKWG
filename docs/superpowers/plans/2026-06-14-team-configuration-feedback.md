# Team Configuration Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Highlight a team overview card and show `配置完成` when its monster, bloodline, nature, three talents, and four skills are all selected, without coupling completion to the optional roller-coaster skill.

**Architecture:** Add one pure `isTeamPetConfigured` predicate and one overview synchronization function in `index.html`. Rendering derives persistent completion from team data, while an in-memory set tracks completed positions so only an incomplete-to-complete transition receives the one-shot animation class.

**Tech Stack:** Vanilla HTML, CSS, JavaScript, Node static assertion tests, Codex in-app Browser.

---

### Task 1: Add Completion Regression Coverage

**Files:**
- Create: `tests/team-configuration-feedback-static.test.js`
- Test: `index.html`

- [ ] **Step 1: Write the failing static test**

Create a Node assertion test that reads `index.html` and requires:

```js
assert.match(html, /function isTeamPetConfigured\(pet\)/);
assert.match(html, /Boolean\(pet\?\.monsterId\)/);
assert.match(html, /Boolean\(pet\?\.bloodlineId\)/);
assert.match(html, /Boolean\(pet\?\.natureId\)/);
assert.match(html, /pet\?\.talentIds\?\.length === 3/);
assert.match(html, /pet\?\.skills\?\.length === 4/);
assert.doesNotMatch(completionFunction, /rollerSkillId/);
assert.match(html, /team-overview-slot[^`]*configured/);
assert.match(html, /team-slot-complete/);
assert.match(html, /配置完成/);
assert.match(html, /team-overview-slot\.completion-pop/);
assert.match(html, /@media \(prefers-reduced-motion: reduce\)/);
```

Also extract `isTeamPetConfigured` into a `new Function` harness and verify complete, missing-required-field, and roller-skill-independent inputs.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
node tests/team-configuration-feedback-static.test.js
```

Expected: FAIL because `isTeamPetConfigured` and the completed card styles do not exist.

### Task 2: Implement Completion State and Feedback

**Files:**
- Modify: `index.html:2119`
- Modify: `index.html:5180`
- Modify: `index.html:5306`
- Test: `tests/team-configuration-feedback-static.test.js`

- [ ] **Step 1: Add persistent completion and one-shot animation styles**

Add:

```css
.team-overview-slot.configured {
  border-color: #31a56d;
  background: #effaf4;
}

.team-overview-slot.active.configured {
  border-color: var(--primary);
  box-shadow: inset 0 0 0 1px var(--primary), 0 0 0 3px rgba(49, 165, 109, 0.16);
}

.team-slot-complete {
  /* compact visible badge */
}

.team-overview-slot.completion-pop {
  animation: teamCompletionPop 720ms ease-out;
}

@keyframes teamCompletionPop {
  /* brief scale and green ring feedback */
}

@media (prefers-reduced-motion: reduce) {
  .team-overview-slot.completion-pop {
    animation: none;
  }
}
```

- [ ] **Step 2: Add the pure completion predicate**

Implement:

```js
function isTeamPetConfigured(pet) {
  return Boolean(pet?.monsterId)
    && Boolean(pet?.bloodlineId)
    && Boolean(pet?.natureId)
    && pet?.talentIds?.length === 3
    && pet.talentIds.every(Boolean)
    && pet?.skills?.length === 4
    && pet.skills.every((skill) => Boolean(skill?.skillId));
}
```

Do not reference `rollerSkillId`.

- [ ] **Step 3: Track transitions and render the badge**

Add an in-memory `Set` of completed position indexes, a pending animation set, and an initialization flag. The first overview render seeds the completed set without scheduling animation, so reloading saved complete data does not replay feedback. On later renders, compare the new completion set with the previous set. Add `configured` for all complete positions and `completion-pop` only for new transitions. Render:

```html
<span class="team-slot-complete">配置完成</span>
```

Clear pending animation entries after the card DOM is created so unrelated rerenders do not replay it.

- [ ] **Step 4: Synchronize non-rerendering combo updates**

Create `refreshTeamOverview(team)` to replace only `.team-overview` using the same transition logic. Call it after bloodline, nature, talent, and roller-skill selections, but ensure roller-skill-only changes cannot create a transition because the predicate ignores `rollerSkillId`. Existing monster and regular skill paths may continue to call `renderTeam(current)`.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```powershell
node tests/team-configuration-feedback-static.test.js
```

Expected: PASS.

### Task 3: Verify Runtime Behavior and Publish

**Files:**
- Modify: `AGENTS.md`
- Verify: `index.html`
- Verify: `tests/*.test.js`

- [ ] **Step 1: Run all automated checks**

Run:

```powershell
Get-ChildItem tests -Filter *.test.js | Sort-Object Name | ForEach-Object { node $_.FullName }
```

Expected: every test exits successfully.

Run:

```powershell
@'
const fs = require("fs");
const html = fs.readFileSync("index.html", "utf8");
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
scripts.forEach((match, index) => new Function(match[1]));
console.log(`Parsed ${scripts.length} inline scripts.`);
'@ | node -
git diff --check
```

Expected: all inline scripts parse and `git diff --check` reports no errors.

- [ ] **Step 2: Verify in the in-app Browser**

Reload `file:///C:/codex-work/codex-lkwg-battle/index.html`, configure one slot with monster, bloodline, nature, three talents, and four skills, and confirm:

- the card shows `配置完成`;
- the card receives one short completion animation;
- changing or clearing the roller-coaster target does not remove or replay completion;
- clearing a required field removes completion;
- refilling it restores completion and replays the animation;
- the active blue outline remains visible.

- [ ] **Step 3: Append the work log**

Add an `AGENTS.md` entry listing the plan, implementation, test, verification, and publish status.

- [ ] **Step 4: Inspect and publish scoped files**

Run:

```powershell
git status --short
git diff -- index.html tests/team-configuration-feedback-static.test.js docs/superpowers/plans/2026-06-14-team-configuration-feedback.md AGENTS.md
git add -- index.html tests/team-configuration-feedback-static.test.js docs/superpowers/plans/2026-06-14-team-configuration-feedback.md AGENTS.md
git commit -m "Add team configuration completion feedback"
git push origin main
```
