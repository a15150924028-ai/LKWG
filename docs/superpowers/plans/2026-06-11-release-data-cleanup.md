# Release Data Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the repository to the neutral release application, its external local data package, and focused regression tests while preserving all battle, cute-layer, boss-form, bloodline, and roller behavior.

**Architecture:** `index.html` remains the only application entry point and loads only `data/local-bundle.json`. Normal mode never reads imported data; `#admin` and `#data-admin` expose a hidden import/export/clear toolbar backed by a dedicated localStorage key. Legacy ingestion code, generated source snapshots, and source-specific tests are backed up outside the repository before deletion.

**Tech Stack:** Static HTML/CSS/JavaScript, JSON, Node.js static regression tests, PowerShell backup and verification.

---

### Task 1: Create and verify the external backup

**Files:**
- Create outside repository: `C:\codex-work\backups\codex-lkwg-battle-before-source-cleanup-20260611.zip`

- [ ] **Step 1: Resolve and verify paths**

Run a PowerShell check that confirms the source resolves to `C:\codex-work\codex-lkwg-battle` and the backup resolves below `C:\codex-work\backups`.

- [ ] **Step 2: Create the ZIP**


- [ ] **Step 3: Verify the ZIP**

Open the ZIP with `System.IO.Compression.ZipFile`, confirm it contains `index.html`, `data/local-bundle.json`, the legacy application, generated snapshots, tools, and tests, and record the file size and SHA-256 hash.

### Task 2: Lock release behavior with failing tests

**Files:**
- Modify: `tests/local-bundle-external-static.test.js`
- Modify or replace focused tests that still target the legacy application.

- [ ] **Step 1: Add admin toolbar assertions**

Require normal mode to keep the toolbar hidden and admin hash mode to expose exactly `导入数据`, `导出数据`, and `清除导入数据`. Require a `hashchange` listener that re-renders the toolbar and reloads the correct data source.

- [ ] **Step 2: Add export and import validation assertions**

Require export of the active normalized package as `local-bundle.json`. Require import validation for `schemaVersion`, array fields, monster identity/types/references/six stats, skill identity/type/category or mode/power/cost/description, and rejection of forbidden fields, URLs, image extensions, and source metadata.

- [ ] **Step 3: Add release cleanliness assertions**

Reject `sourceCommit`, source-specific network functions, third-party URLs, image URLs, online-update copy, embedded large pools, CSV maintenance, single-file generation, and hidden override pools in `index.html` and `data/local-bundle.json`.

- [ ] **Step 4: Preserve core assertions**

Require `BLOODLINES`, tiny `FALLBACK_DATA`, `applyDexData`, all four lookup Maps, manual cute-layer state/effects, `超级糖果`, roller controls, `monster.skillIds`, and the complete `skills` pool.

- [ ] **Step 5: Run the test and confirm expected failure**

Run `node tests/local-bundle-external-static.test.js`. Expected: failure because export, hashchange rendering, strict validation, neutral footer copy, or source-field removal is incomplete.

### Task 3: Finish the release-only data and admin path

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Make the admin toolbar exact**

Rename controls to `导入数据` and `清除导入数据`, add `导出数据`, and keep the toolbar hidden by default.

- [ ] **Step 2: Render admin state on hash changes**

Implement `renderAdminBar()` using `isAdminMode()`, register `window.addEventListener("hashchange", ...)`, and reload data so leaving admin mode immediately returns to the official external package.

- [ ] **Step 3: Export the active package**

Keep a neutral copy of the last validated package, create a JSON Blob, download it as `local-bundle.json`, and do not export fixed bloodlines or PVP presets.

- [ ] **Step 4: Strengthen import validation**

Validate the required top-level fields and per-record fields. Recursively reject forbidden field names, source markers, URLs, and image filenames before writing localStorage.

- [ ] **Step 5: Remove release source metadata**

Remove `sourceCommit` from normalized runtime data and replace the footer with: `页面默认读取线上数据包；如数据包不可用，将使用内置兜底数据。本工具为非官方阵容与伤害计算辅助工具。`

- [ ] **Step 6: Run the focused test**

Run `node tests/local-bundle-external-static.test.js`. Expected: PASS.

### Task 4: Remove the backed-up legacy ingestion system

**Files:**
- Delete: `克制面查询.html`
- Delete: `tools/bwiki-data-pool-exporter.mjs`
- Delete: `data/generated/bwiki-html-pool-comparison.json`
- Delete: `data/generated/bwiki-monster-pool.json`
- Delete: `data/generated/bwiki-monster-skill-pool.json`
- Delete: `data/generated/bwiki-monster-stats.json`
- Delete: `data/generated/bwiki-skill-pool.json`
- Delete source-only tests under `tests/`.
- Retarget retained core tests to `index.html` and neutral fixtures where needed.

- [ ] **Step 1: Verify every delete target**

Resolve each target and assert it remains below `C:\codex-work\codex-lkwg-battle`.

- [ ] **Step 2: Delete exact files**

Use exact literal paths only. Do not use a recursive wildcard deletion.

- [ ] **Step 3: Retarget core regressions**

Keep tests for default build, boss forms, cute layers, hero traits, selected-skill damage, special power rules, support/defense effects, roller behavior, and local bundle structure. Remove source-specific assumptions from retained tests.

- [ ] **Step 4: Scan repository runtime files**

Confirm `index.html` and `data/local-bundle.json` contain no third-party URLs, source fields, image links, embedded data package, online update chain, or source-prefixed IDs.

### Task 5: Verify, log, commit, and publish

**Files:**
- Modify: `AGENTS.md`

- [ ] **Step 1: Run all retained tests**

Run every `tests/*.test.js`; expected: all pass without network access.

- [ ] **Step 2: Parse executable scripts**

Parse all executable script blocks in `index.html` with `new Function`; expected: no syntax error.

- [ ] **Step 3: Verify local HTTP delivery**

Serve the repository locally and confirm `index.html` and `data/local-bundle.json` return HTTP 200, schema version 1, 494 monsters, 499 skills, 184 passives, and no forbidden fields.

- [ ] **Step 4: Append the work log**


- [ ] **Step 5: Inspect and publish**

Run `git diff --check`, stage only scoped files, commit with a clear cleanup message, push `main`, and verify `origin/main` matches `HEAD`.
