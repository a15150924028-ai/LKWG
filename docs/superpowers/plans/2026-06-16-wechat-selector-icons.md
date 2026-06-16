# WeChat Selector Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add web-equivalent icons and nature stat details to Mini Program bloodline, talent, and nature selectors.

**Architecture:** Extend the existing search asset sync script to copy/extract required icon files. Add display metadata to constants and let the shared `field-picker` render icons/details for all pages without duplicating page-specific UI.

**Tech Stack:** WeChat Mini Program WXML/WXSS/JS, Node.js sync scripts, static regression tests.

---

### Task 1: Sync Selector Icon Assets

- [ ] Add failing assertions for type icons, boss bloodline icon, and six stat icons.
- [ ] Extend `sync-miniprogram-search-assets.js` to copy type/bloodline icons and extract stat icons.
- [ ] Run `node tests/miniprogram-search-assets-static.test.js`.

### Task 2: Add Option Display Metadata

- [ ] Add failing assertions that bloodline, nature, and talent options carry icon/detail metadata.
- [ ] Update `constants.js` and page option adapters to preserve metadata.
- [ ] Run focused search/team/PVP tests.

### Task 3: Render Icons In Field Picker

- [ ] Add failing assertions for selected and suggestion icon rendering.
- [ ] Update component JS/WXML/WXSS to render image/text icons and option details.
- [ ] Run focused component/page tests.

### Task 4: Verify And Publish

- [ ] Run all synchronization checks and all Node tests.
- [ ] Parse Mini Program JS/JSON, scan WXML, check package size, and attempt WeChat CLI preview.
- [ ] Update AGENTS.md and the project note.
- [ ] Commit scoped files and push `main`, excluding unrelated local changes.
