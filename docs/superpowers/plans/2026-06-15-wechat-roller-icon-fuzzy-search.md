# WeChat Roller Icon And Fuzzy Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the web roller icon to the Mini Program and restore web-equivalent fuzzy autocomplete across all team and PVP selectors.

**Architecture:** Add one deterministic synchronization script that extracts the embedded roller PNG and pinyin map from `index.html`, keeping the web version authoritative. Extend option records with aliases, then replace contains-only filtering with the web scoring model while preserving the existing `{ index }` picker event contract.

**Tech Stack:** Node.js, WeChat Mini Program JavaScript/WXML/WXSS, CommonJS static tests.

---

### Task 1: Synchronize Web Search Assets

**Files:**
- Create: `lkwgwechat/scripts/sync-miniprogram-search-assets.js`
- Create: `lkwgwechat/miniprogram/utils/generated/pinyin-map.js`
- Create: `lkwgwechat/miniprogram/assets/roller-skill.png`
- Create: `tests/miniprogram-search-assets-static.test.js`

- [ ] Write a failing test requiring a valid PNG matching the web base64 bytes, a generated pinyin CommonJS module, and a passing `--check` mode.
- [ ] Run `node tests/miniprogram-search-assets-static.test.js` and confirm failure because the synchronization script and generated assets are absent.
- [ ] Implement deterministic extraction from the web `PINYIN_MAP` object and `.roller-icon` data URI.
- [ ] Generate the two runtime assets and rerun the focused test until it passes.

### Task 2: Port Web Fuzzy Ranking

**Files:**
- Modify: `lkwgwechat/miniprogram/utils/search-options.js`
- Modify: `lkwgwechat/miniprogram/data/catalog.js`
- Modify: `lkwgwechat/miniprogram/pages/team/index.js`
- Modify: `lkwgwechat/miniprogram/pages/pvp/index.js`
- Modify: `tests/miniprogram-search-picker-static.test.js`

- [ ] Add failing cases for aliases, full pinyin, pinyin initials, bounded typo distance, ranking, stable ties, 20-result cap, and no-match fallback.
- [ ] Confirm the current contains-only implementation fails those cases.
- [ ] Port web normalization, pinyin conversion, initials, Levenshtein distance, scoring and stable ranking.
- [ ] Preserve aliases in catalog and page option adapters so all selector categories use the same search contract.
- [ ] Run the focused search, team and PVP tests.

### Task 3: Add The Roller Button Icon

**Files:**
- Modify: `lkwgwechat/miniprogram/pages/team/index.wxml`
- Modify: `lkwgwechat/miniprogram/pages/team/index.wxss`
- Modify: `tests/miniprogram-team-page-static.test.js`

- [ ] Add a failing assertion requiring the synchronized PNG in the “使用过山车” button.
- [ ] Add a compact `<image>` without changing the equal-width toolbar layout.
- [ ] Run the team page and search-asset tests.

### Task 4: Verify, Document And Publish

**Files:**
- Modify: `AGENTS.md`
- Modify: `C:\codex-work\codex-localdatabase\02-项目\codex-lkwg-battle.md`

- [ ] Run all three synchronization scripts in `--check` mode.
- [ ] Run all Node tests, parse Mini Program JavaScript/JSON, scan WXML, run `git diff --check`, and measure package bytes.
- [ ] Attempt WeChat CLI preview and record any IDE-service timeout.
- [ ] Update only project status, decisions, resolved issues and next steps in the external project note.
- [ ] Stage only scoped files, commit, and push `main`; exclude the existing local `project.config.json` change and unrelated deleted HTML file.
