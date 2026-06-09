# Agent Instructions

This repository keeps its development process in this file. Every agent must read this document before doing work in the repo, then append to the work log whenever it changes files.

## Required Start Procedure

Before making any code, content, or configuration change:

1. Read this full `AGENTS.md` file.
2. Review the latest entries in `Development Work Log` for project context.
3. Inspect the current workspace state with `git status --short`.
4. Preserve user changes that are already present in the worktree.
5. Keep changes scoped to the user's request unless the user explicitly expands the scope.

## Required Work Log Procedure

Whenever an agent changes, creates, deletes, formats, or generates any file in this repository, it must append a new entry to `Development Work Log` before finishing.

Each entry must include:

- Date and time, including timezone when available.
- Agent or tool name if known.
- User request or instruction being handled.
- Files changed.
- What changed and why.
- Verification performed, or a clear note that verification was not run.
- Current status, such as complete, partial, blocked, or needs review.

## Required GitHub Publish Procedure

Every time an agent updates files in this repository, it must publish that update to GitHub and make sure the update lands on `main`.

After verification and work-log updates:

1. Run `git status --short` and inspect the diff.
2. Stage only the files that belong to the current user request.
3. Commit the scoped changes with a clear commit message.
4. If working on a branch other than `main`, push the branch, merge it into `main`, then push `main`.
5. If already on `main`, push `main` to `origin`.
6. If unrelated local changes are present, do not stage them silently. Ask the user which files should be included.
7. If GitHub authentication, merge conflicts, or failed checks block publishing, document the blocker in the work log and tell the user.

Use this entry format:

```md
### YYYY-MM-DD HH:mm TZ - Agent Name

- Request: ...
- Files changed:
  - `path/to/file`
- Changes:
  - ...
- Verification: ...
- Status: ...
```

## Development Work Log

### 2026-06-08 17:53 +08:00 - Codex

- Request: Create or edit the agent markdown file so future agents use it as a work log and read it for context before doing new work.
- Files changed:
  - `AGENTS.md`
- Changes:
  - Added root-level agent instructions requiring every future agent to read this file before work.
  - Added an append-only development work log procedure for documenting every file update.
  - Added the first work log entry to start the project history.
- Verification: Checked the repository root, confirmed no existing agent markdown file was present, and reviewed recent git history for context.
- Status: Complete.

### 2026-06-08 19:02 +08:00 - Codex

- Request: Add a standing rule that every file update must be pushed to GitHub and merged to `main`.
- Files changed:
  - `AGENTS.md`
- Changes:
  - Added a required GitHub publish procedure for future agents.
  - Specified that updated files must be committed, pushed to GitHub, and landed on `main`.
  - Added safeguards for unrelated pending changes, authentication blockers, merge conflicts, and failed checks.
- Verification: Read `AGENTS.md`; checked `git status --short`; confirmed the repo is on `codex/bwiki-data-source`; ran `node tests/default-build-static.test.js`; ran `git diff --check`.
- Status: Complete.

### 2026-06-08 18:23 +08:00 - Codex

- Request: Implement the plan to switch the app's联网更新数据 database refresh from `rocomwiki.app/data/bundle.json` to the BWiki 洛克王国世界 WIKI source, without changing other app functions.
- Files changed:
  - `克制面查询.html`
  - `AGENTS.md`
- Changes:
  - Replaced the old联网更新数据 source constants and footer copy with BWiki source references.
  - Added a BWiki MediaWiki API fetch layer that reads 精灵图鉴、技能图鉴 and page wikitext, then converts the data into the existing bundle/database shape.
  - Kept the existing normalization, cache key, team storage, calculation, PVP, bloodline, and render paths unchanged.
  - Added short retry handling for BWiki API calls and kept updates scoped to browser-local database refresh.
- Verification: Ran Node static checks for the BWiki constants/fetcher/parser and old source removal; parsed all inline script blocks with `new Function`; ran a mocked BWiki bundle parser test for skill, monster, passive, and skill-pool mapping; verified BWiki API access with PowerShell `Invoke-WebRequest` returning HTTP 200 for 技能图鉴. Browser click verification was not run because no Browser tool or standard Chrome/Edge executable was available in this environment.
- Status: Complete.

### 2026-06-08 18:31 +08:00 - Codex

- Request: Fix the `联网更新数据` click failure that showed `更新失败：Failed to fetch。已使用本地缓存或内置示例。`
- Files changed:
  - `克制面查询.html`
  - `AGENTS.md`
- Changes:
  - Added a BWiki MediaWiki JSONP fallback for browser environments where direct `fetch()` to the BWiki API fails from the local HTML page.
  - Added a per-session JSONP mode flag so later BWiki batch requests skip repeated failed `fetch()` retries after the fallback succeeds once.
  - Kept the change scoped to the BWiki data refresh path and did not change team storage, calculations, rendering, PVP, or other app behavior.
- Verification: Watched a JSONP fallback static check fail before the fix; reran it after the fix and it passed. Ran static checks for JSONP mode, BWiki update-path requirements, inline script parsing with `new Function`, `Invoke-WebRequest` against a BWiki `callback=` API URL returning HTTP 200, and `git diff --check`. Browser click verification was not run because no local browser automation tool was available in this environment.
- Status: Complete.

### 2026-06-08 18:41 +08:00 - Codex

- Request: 未选择性格、天分时，默认踏实性格、生命、物防、魔防。
- Files changed:
  - `克制面查询.html`
  - `tests/default-build-static.test.js`
  - `AGENTS.md`
- Changes:
  - Added a static regression test for the default damage build constants and combo empty-state copy.
  - Updated team and PVP nature/talent combo empty states to show the effective defaults: 踏实性格、生命、物防、魔防.
  - Kept existing default stat calculation behavior unchanged.
- Verification: Watched `node tests/default-build-static.test.js` fail before the HTML change, then reran it after the change and it passed. Parsed all inline script blocks with `new Function`; ran `git diff --check`.
- Status: Complete.

### 2026-06-08 18:50 +08:00 - Codex

- Request: Redesign the UI/UX in a duplicate file only, keeping the current app files unchanged.
- Files changed:
  - `克制面查询-简洁版.html`
  - `AGENTS.md`
- Changes:
  - Created `克制面查询-简洁版.html` from the current working copy of `克制面查询.html`.
  - Added a CSS-only redesign override block to the duplicate for a simpler sticky command bar, clearer section hierarchy, cleaner cards and controls, improved spacing, and responsive mobile layout.
  - Left the original app HTML behavior, data refresh, team storage, calculations, and PVP logic unchanged.
- Verification: Parsed all inline scripts in `克制面查询-简洁版.html` with `new Function`; ran `node tests/default-build-static.test.js`; ran `git diff --check`; confirmed Playwright and standard browser commands were unavailable, so rendered browser verification was not run.
- Status: Complete.

### 2026-06-08 20:05 +08:00 - Codex

- Request: Delete invalid local skill pool overrides that no longer match BWiki monster names or aliases.
- Files changed:
  - `克制面查询.html`
  - `AGENTS.md`
- Changes:
  - Removed 39 dead `LCX_SKILL_POOL_OVERRIDES` entries whose top-level pool names do not match any current BWiki monster name or alias.
  - Kept the 336 matching skill pool overrides intact, including partially matching pools where at least one skill still resolves.
  - Left the duplicate simplified HTML file unchanged after restoring an accidental intermediate edit.
- Verification: Ran `node tests/default-build-static.test.js`; parsed all inline scripts in `克制面查询.html` with `new Function`; ran a BWiki monster-name/alias reconciliation check confirming 336 remaining pools and 0 invalid pool names.
- Status: Complete.

### 2026-06-08 20:19 +08:00 - Codex

- Request: Use the BWiki online data icon for the `过山车` skill icon.
- Files changed:
  - `克制面查询.html`
  - `tests/roller-icon-static.test.js`
  - `AGENTS.md`
- Changes:
  - Added `过山车` as a supplemental BWiki skill page because it is not listed in `技能图鉴`.
  - Added the BWiki skill icon URL for `过山车` so the patched skill and the “使用过山车” button can use the online data icon instead of the mechanical fallback.
  - Preserved the patched fallback skill icon from fetched or supplemental BWiki data.
  - Added a static regression test covering the supplemental page, icon URL, skill fetch inclusion, page icon mapping, and fallback icon preservation.
- Verification: Watched `node tests/roller-icon-static.test.js` fail before the HTML change, then reran it after the change and it passed. Ran `node tests/default-build-static.test.js`; parsed all inline scripts in `克制面查询.html` with `new Function`; ran `git diff --check`. A live BWiki API verification attempt was blocked by the site security policy with HTTP 567.
- Status: Complete.

### 2026-06-08 20:28 +08:00 - Codex

- Request: Fix the failed `联网更新数据` path and make the `过山车` icon update from online data instead of staying on the old fallback icon.
- Files changed:
  - `克制面查询.html`
  - `tests/bwiki-fallback-static.test.js`
  - `tests/roller-icon-static.test.js`
  - `AGENTS.md`
- Changes:
  - Added an online fallback bundle source at `https://rocomwiki.app/data/bundle.json` for cases where BWiki API/JSONP requests are blocked by site security policy.
  - Changed `updateDexData()` to use a BWiki-first `fetchRemoteBundle()` helper that falls back to the online bundle instead of failing the update.
  - Ensured existing `过山车` skill records from cached or fallback data receive the BWiki skill icon URL.
  - Updated footer and update-status copy to describe the BWiki-primary, fallback-source behavior.
  - Added a static regression test for the resilient update path and adjusted the roller icon test for the new icon fallback chain.
- Verification: Watched `node tests/bwiki-fallback-static.test.js` fail before the HTML change, then reran it after the change and it passed. Ran `node tests/roller-icon-static.test.js`; `node tests/default-build-static.test.js`; parsed all inline scripts in `克制面查询.html` with `new Function`; fetched `https://rocomwiki.app/data/bundle.json` and confirmed 489 monsters, 517 skills, and `过山车`; ran `git diff --check`.
- Status: Complete.

### 2026-06-08 20:36 +08:00 - Codex

- Request: Fix broken精灵和技能图片 so the app uses the website image assets.
- Files changed:
  - `克制面查询.html`
  - `tests/legacy-image-url-static.test.js`
  - `AGENTS.md`
- Changes:
  - Added `LEGACY_ASSET_BASE` for `https://rocomwiki.app`.
  - Changed legacy `/creature-atlas/...` and `/skill-icons/...` image paths to resolve against `rocomwiki.app` instead of the BWiki host.
  - Added cached-image repair so previously cached wrong BWiki-hosted creature and skill image URLs are corrected during data application.
  - Added a static regression test for legacy image URL mapping and cached icon repair.
- Verification: Watched `node tests/legacy-image-url-static.test.js` fail before the HTML change, then reran it after the change and it passed. Ran `node tests/bwiki-fallback-static.test.js`; `node tests/roller-icon-static.test.js`; `node tests/default-build-static.test.js`; parsed all inline scripts in `克制面查询.html` with `new Function`; verified representative `rocomwiki.app` creature and skill image URLs return HTTP 200 image responses; verified the BWiki `过山车` icon URL returns HTTP 200 image response; ran `git diff --check`.
- Status: Complete.

### 2026-06-08 20:54 +08:00 - Codex

- Request: Remove the active local skill pool overrides, use website skill pools by default, and keep a rollback path.
- Files changed:
  - `克制面查询.html`
  - `tests/local-skill-pool-rollback-static.test.js`
  - `AGENTS.md`
- Changes:
  - Renamed the active `LCX_SKILL_POOL_OVERRIDES` export to `LCX_LEGACY_SKILL_POOL_OVERRIDES` so local pools are no longer used by default.
  - Added a `roco-world-use-local-skill-pool-overrides` localStorage gate and `window.useLocalSkillPoolRollback()` helper for temporary rollback to the old local pools.
  - Preserved the last loaded website bundle as the source for recomputing data when the rollback flag is toggled.
  - Added a static regression test for the default website-skill-pool path and rollback helper.
- Verification: Watched `node tests/local-skill-pool-rollback-static.test.js` fail before the HTML change, then reran it after the change and it passed. Ran `node tests/bwiki-fallback-static.test.js`; `node tests/roller-icon-static.test.js`; `node tests/legacy-image-url-static.test.js`; `node tests/default-build-static.test.js`; parsed all inline scripts in `克制面查询.html` with `new Function`; ran `git diff --check`.
- Status: Complete.

### 2026-06-08 21:09 +08:00 - Codex

- Request: Remove the local `过山车` skill and Ark skill-pool patch now that website data contains the skill, and verify the skill still exists after removing the patch.
- Files changed:
  - `克制面查询.html`
  - `tests/roller-icon-static.test.js`
  - `tests/bwiki-fallback-static.test.js`
  - `tests/roller-source-data-live.test.js`
  - `AGENTS.md`
- Changes:
  - Removed the `ensureArkRollerSkill()` local patch that created a synthetic `过山车` skill and forced it into `机幕方舟`/`积木方舟` skill pools.
  - Kept the BWiki supplemental skill-page fetch and icon URL so `过山车` is still read from website data when BWiki does not list it in `技能图鉴`.
  - Updated static tests to reject the old local patch and added a live website-source check proving `机幕方舟` includes `过山车` in the fallback source skill pool.
- Verification: Watched `node tests/roller-icon-static.test.js` fail before the HTML change, then reran it after the change and it passed. Ran `node tests/roller-source-data-live.test.js`, which confirmed website source includes `过山车` in `机幕方舟`'s skill pool. Ran `node tests/bwiki-fallback-static.test.js`; `node tests/local-skill-pool-rollback-static.test.js`; `node tests/legacy-image-url-static.test.js`; `node tests/default-build-static.test.js`; parsed all inline scripts in `克制面查询.html` with `new Function`; ran `git diff --check`.
- Status: Complete.

### 2026-06-08 22:51 +08:00 - Codex

- Request: Fix `过山车` not appearing in `机幕方舟`'s skill pool after removing the local patch.
- Files changed:
  - `克制面查询.html`
  - `tests/website-skill-pool-merge-static.test.js`
  - `AGENTS.md`
- Changes:
  - Confirmed BWiki's `机幕方舟` page omits `过山车` from its skill fields while the online fallback website source includes it.
  - Added `mergeWebsiteSkillPools()` so successful BWiki refreshes are supplemented with website fallback skill pools by monster/skill name.
  - Mapped fallback website skill IDs to BWiki skill IDs when BWiki already has the skill, and carried website-only skill records forward when BWiki lacks them.
  - Kept the deleted local `过山车` patch removed; the fix uses online website data, not hardcoded local pool injection.
- Verification: Watched `node tests/website-skill-pool-merge-static.test.js` fail before the HTML change, then reran it after the change and it passed. Ran `node tests/roller-source-data-live.test.js`; `node tests/bwiki-fallback-static.test.js`; `node tests/roller-icon-static.test.js`; `node tests/local-skill-pool-rollback-static.test.js`; `node tests/legacy-image-url-static.test.js`; `node tests/default-build-static.test.js`; parsed all inline scripts in `克制面查询.html` with `new Function`; ran `git diff --check`.
- Status: Complete.

### 2026-06-09 08:25 +08:00 - Codex

- Request: Fix incorrect `隐藏条款` learners from the root cause, without special-value patches or one-off supplementation.
- Files changed:
  - `克制面查询.html`
  - `tests/bwiki-skill-learner-static.test.js`
  - `tests/website-skill-pool-merge-static.test.js`
  - `AGENTS.md`
- Changes:
  - Removed the broad `mergeWebsiteSkillPools()` fallback-source union that could import overly broad fallback learners into successful BWiki refreshes.
  - Added generic BWiki skill-page learner parsing for rendered learner lists such as default, bloodline, and skill-stone learners.
  - Applied BWiki skill-page learner relationships back into BWiki monster skill pools by normalized skill and monster names.
  - Replaced the old fallback-merge regression test with a BWiki learner parser test that verifies `隐藏条款` uses the 11 BWiki-listed learners and excludes fallback-only learners.
- Verification: Watched `node tests/bwiki-skill-learner-static.test.js` fail before the HTML change, then reran it after the change and it passed. Ran `node tests/bwiki-fallback-static.test.js`; `node tests/roller-icon-static.test.js`; `node tests/roller-source-data-live.test.js`; `node tests/local-skill-pool-rollback-static.test.js`; `node tests/legacy-image-url-static.test.js`; `node tests/default-build-static.test.js`; parsed all inline scripts in `克制面查询.html` with `new Function`; ran `git diff --check`.
- Status: Complete.

### 2026-06-09 08:37 +08:00 - Codex

- Request: Stop using the incorrect fallback JSON source; generate the local cache from BWiki only, and fix `过山车` from BWiki data.
- Files changed:
  - `克制面查询.html`
  - `tests/bwiki-only-update-static.test.js`
  - `tests/bwiki-skill-learner-static.test.js`
  - `tests/bwiki-rendered-monster-skills-live.test.js`
  - `tests/bwiki-fallback-static.test.js`
  - `tests/roller-source-data-live.test.js`
  - `AGENTS.md`
- Changes:
  - Removed `rocomwiki.app/data/bundle.json` from the online update path and deleted the legacy fallback fetch helper.
  - Changed `联网更新数据` so BWiki success overwrites the browser-local cache, while BWiki failure leaves the app on existing cache or built-in sample data.
  - Added BWiki rendered monster-page skill-card parsing, so skills present in rendered BWiki pages, such as `机幕方舟` learning `过山车`, are included without local hardcoding or fallback JSON.
  - Made supplemental BWiki skill learner parsing fail loudly instead of silently generating incomplete BWiki data.
  - Replaced fallback-source tests with BWiki-only and rendered-BWiki learner tests.
- Verification: Watched `node tests/bwiki-only-update-static.test.js` fail before removing the fallback source, then reran it after the change and it passed. Ran `node tests/bwiki-skill-learner-static.test.js`; `node tests/bwiki-rendered-monster-skills-live.test.js`; `node tests/roller-icon-static.test.js`; `node tests/local-skill-pool-rollback-static.test.js`; `node tests/legacy-image-url-static.test.js`; `node tests/default-build-static.test.js`; parsed all inline scripts in `克制面查询.html` with `new Function`; ran `git diff --check`.
- Status: Complete.
