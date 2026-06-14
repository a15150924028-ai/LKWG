# Compact Team Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the boss bloodline crown with the supplied image, remove the team battle summary, and compact the team editor into inset-labeled sections with restrained vertical spacing.

**Architecture:** Keep the existing combo controls and state handlers unchanged. Add a real local PNG asset for the boss bloodline, adjust `iconHtml` to render that asset, remove the summary render path, and scope compact CSS to `.pet-editor` so PVP and other forms retain their current layout.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, local PNG asset, Node static tests, Codex in-app Browser when local file policy permits.

---

### Task 1: Add Failing Layout and Asset Coverage

**Files:**
- Create: `tests/compact-team-editor-static.test.js`
- Modify: `tests/apple-layout-static.test.js`

- [ ] Add assertions that require `assets/bloodline-icons/boss.png`, the boss bloodline `icon` field, a dedicated bloodline-image branch in `iconHtml`, inset editor labels, a two-column monster/bloodline row at mobile widths, compact skill rows, and no `renderPetBattleSummary` or `.pet-summary` render.
- [ ] Run `node tests/compact-team-editor-static.test.js` and confirm it fails because the new asset/layout are absent.

### Task 2: Add the Boss Bloodline Asset

**Files:**
- Create: `assets/bloodline-icons/boss.png`
- Modify: `index.html`

- [ ] Copy the supplied 247x253 PNG without redrawing or converting it.
- [ ] Set `bloodline-boss.icon` to `assets/bloodline-icons/boss.png`.
- [ ] Update `iconHtml` so a bloodline with `item.icon` renders an `<img>` using that path, while elemental bloodlines keep their type badges.

### Task 3: Compact the Team Editor and Remove Summary

**Files:**
- Modify: `index.html`
- Test: `tests/compact-team-editor-static.test.js`
- Test: `tests/apple-layout-static.test.js`

- [ ] Change `.pet-card-layout` to one column and remove the `${renderPetBattleSummary(selectedMonster, pet)}` call.
- [ ] Remove the unused `renderPetBattleSummary` function and its `.pet-summary`-specific CSS.
- [ ] Style `.pet-editor .field > label` as a small inset legend on the field border.
- [ ] Keep `.pet-editor .form-row` at two equal columns, including below 760px.
- [ ] Reduce editor padding, gaps, combo heights, talent gaps, skill-row gaps, slot heights, and skill metadata heights while keeping readable touch targets.
- [ ] At ordinary mobile widths, keep each skill selector and its metadata on one row; only stack metadata at very narrow widths where necessary.
- [ ] Run both focused tests and confirm they pass.

### Task 4: Verify and Publish

**Files:**
- Modify: `AGENTS.md`
- Verify: `index.html`
- Verify: `tests/*.test.js`

- [ ] Run all Node static tests.
- [ ] Parse every inline script in `index.html` with `new Function`.
- [ ] Run `git diff --check`.
- [ ] Reload the existing in-app Browser page and visually compare the editor against the supplied screenshot when Browser policy permits; otherwise document the blocked visual gate in `design-qa.md`.
- [ ] Append the work-log entry, stage only scoped files, commit, and push `main`. Preserve the unrelated existing deletion of `克制面查询-简洁版.html`.
