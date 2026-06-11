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

### 2026-06-09 09:00 +08:00 - Codex

- Request: Use BWiki rendered webpage data for monster passives instead of stale wikitext passive fields.
- Files changed:
  - `克制面查询.html`
  - `tests/bwiki-rendered-monster-profile-static.test.js`
  - `tests/bwiki-skill-learner-static.test.js`
  - `AGENTS.md`
- Changes:
  - Added rendered BWiki monster profile parsing so the same rendered monster-page request now returns skill-card names plus passive name and passive description.
  - Applied rendered passive data back into the BWiki bundle's monster passive IDs and passive records, replacing stale wikitext descriptions such as 龙鱼 `洄游` `永久-1` with the rendered webpage value `永久-2`.
  - Kept rendered monster skill-card behavior intact while avoiding a second rendered-page fetch for the same monster.
  - Added a static regression test for rendered passive parsing and bundle application, and updated the existing skill learner test to assert the new rendered profile application path.
- Verification: Watched `node tests/bwiki-rendered-monster-profile-static.test.js` fail before implementation, then reran it after the change and it passed. Ran `node tests/bwiki-only-update-static.test.js`; `node tests/bwiki-skill-learner-static.test.js`; `node tests/bwiki-rendered-monster-profile-static.test.js`; `node tests/bwiki-rendered-monster-skills-live.test.js`; `node tests/roller-icon-static.test.js`; `node tests/local-skill-pool-rollback-static.test.js`; `node tests/legacy-image-url-static.test.js`; `node tests/default-build-static.test.js`; parsed all inline scripts in `克制面查询.html` with `new Function`; live-checked the BWiki rendered 龙鱼 page parses `洄游` with `永久-2`; ran `git diff --check`.
- Status: Complete.

### 2026-06-09 09:43 +08:00 - Codex

- Request: Fix the online update failure `BWiki 过山车 技能学习精灵解析为空`.
- Files changed:
  - `克制面查询.html`
  - `tests/bwiki-empty-supplemental-learner-static.test.js`
  - `tests/bwiki-only-update-static.test.js`
  - `AGENTS.md`
- Changes:
  - Changed BWiki skill learner fetching so an empty learner list returns an empty map entry that is filtered out instead of failing the whole update.
  - Kept `过山车` skill-pool sourcing on rendered monster skill cards, because the BWiki `过山车` skill page currently shows default, bloodline, and skill-stone learner counts as 0.
  - Added a regression test proving empty supplemental learner pages do not block BWiki-only updates.
  - Updated the BWiki-only static test to reject the old empty-learner failure message.
- Verification: Watched `node tests/bwiki-empty-supplemental-learner-static.test.js` fail on the old empty-learner throw, then reran it after the change and it passed. Ran `node tests/bwiki-only-update-static.test.js`; `node tests/bwiki-empty-supplemental-learner-static.test.js`; `node tests/bwiki-skill-learner-static.test.js`; `node tests/bwiki-rendered-monster-profile-static.test.js`; `node tests/bwiki-rendered-monster-skills-live.test.js`; `node tests/roller-icon-static.test.js`; `node tests/local-skill-pool-rollback-static.test.js`; `node tests/legacy-image-url-static.test.js`; `node tests/default-build-static.test.js`; parsed all inline scripts in `克制面查询.html` with `new Function`; live-checked that the BWiki `过山车` learner page is empty; ran `git diff --check`.
- Status: Complete.

### 2026-06-09 10:05 +08:00 - Codex

- Request: Update wikitext-derived data by reading BWiki rendered HTML and replacing stale wikitext values.
- Files changed:
  - `克制面查询.html`
  - `tests/bwiki-rendered-monster-profile-static.test.js`
  - `tests/bwiki-rendered-skill-profile-static.test.js`
  - `AGENTS.md`
- Changes:
  - Added rendered BWiki monster stat parsing and applied rendered stats back into monster records, so rendered page values replace stale wikitext stats.
  - Removed the local latest monster stat override pool and its application pass.
  - Added rendered BWiki skill page parsing for element, energy cost, category, power, and description, then applied those rendered values over wikitext skill fields.
  - Removed the local S2 skill override pool and its application pass so skill data comes from BWiki rendered pages instead of local patches.
  - Added regression tests for rendered monster stats and rendered skill fields replacing stale wikitext data.
- Verification: Watched `node tests/bwiki-rendered-monster-profile-static.test.js` fail before rendered stats parsing, then reran it after the change and it passed. Watched `node tests/bwiki-rendered-skill-profile-static.test.js` fail before rendered skill parsing, then reran it after the change and it passed. Ran `node tests/bwiki-only-update-static.test.js`; `node tests/bwiki-empty-supplemental-learner-static.test.js`; `node tests/bwiki-skill-learner-static.test.js`; `node tests/bwiki-rendered-monster-profile-static.test.js`; `node tests/bwiki-rendered-skill-profile-static.test.js`; `node tests/bwiki-rendered-monster-skills-live.test.js`; `node tests/roller-icon-static.test.js`; `node tests/local-skill-pool-rollback-static.test.js`; `node tests/legacy-image-url-static.test.js`; `node tests/default-build-static.test.js`; parsed all inline scripts in `克制面查询.html` with `new Function`; live-checked rendered BWiki 龙鱼 stats/passive and rendered BWiki 潮涌/过山车 skill fields; ran `git diff --check`.
- Status: Complete.

### 2026-06-09 10:31 +08:00 - Codex

- Request: Fix online update failure caused by BWiki index parsing `文件:技能图标 ...png` pages as skill titles.
- Files changed:
  - `克制面查询.html`
  - `tests/bwiki-index-title-static.test.js`
  - `AGENTS.md`
- Changes:
  - Updated BWiki index parsing to inspect all link titles in a card and prefer the first non-file page title, avoiding icon file pages such as `文件:技能图标 铁蒺藜.png`.
  - Kept icon URL extraction from the image link unchanged.
  - Added a static regression test for BWiki cards where the icon file link appears before the actual skill page link.
- Verification: Watched `node tests/bwiki-index-title-static.test.js` fail before the parser change, then reran it after the change and it passed. Ran a live BWiki 技能图鉴 index parse check confirming `fileTitleCount: 0`. Ran `node tests/bwiki-index-title-static.test.js`; `node tests/bwiki-only-update-static.test.js`; `node tests/bwiki-empty-supplemental-learner-static.test.js`; `node tests/bwiki-skill-learner-static.test.js`; `node tests/bwiki-rendered-monster-profile-static.test.js`; `node tests/bwiki-rendered-skill-profile-static.test.js`; `node tests/bwiki-rendered-monster-skills-live.test.js`; `node tests/roller-icon-static.test.js`; `node tests/local-skill-pool-rollback-static.test.js`; `node tests/legacy-image-url-static.test.js`; `node tests/default-build-static.test.js`; parsed all inline scripts in `克制面查询.html` with `new Function`; ran `git diff --check`.
- Status: Complete.

### 2026-06-09 10:40 +08:00 - Codex

- Request: Fix the online update failure `BWiki 纤维化 JSONP 请求失败`.
- Files changed:
  - `克制面查询.html`
  - `tests/bwiki-rendered-skill-profile-static.test.js`
  - `AGENTS.md`
- Changes:
  - Changed rendered BWiki skill-profile fetching so one failed rendered skill page, such as `纤维化`, is skipped instead of failing the whole BWiki update.
  - Changed rendered BWiki monster-profile fetching the same way, so individual rendered page failures keep the existing wikitext-derived base data.
  - Added a regression test proving a failed rendered skill page is skipped while successful rendered skill pages still apply.
- Verification: Watched `node tests/bwiki-rendered-skill-profile-static.test.js` fail before the HTML change, then reran it after the change and it passed. Ran `node tests/bwiki-index-title-static.test.js`; `node tests/bwiki-only-update-static.test.js`; `node tests/bwiki-empty-supplemental-learner-static.test.js`; `node tests/bwiki-skill-learner-static.test.js`; `node tests/bwiki-rendered-monster-profile-static.test.js`; `node tests/bwiki-rendered-skill-profile-static.test.js`; `node tests/roller-icon-static.test.js`; `node tests/local-skill-pool-rollback-static.test.js`; `node tests/legacy-image-url-static.test.js`; `node tests/default-build-static.test.js`; parsed all inline scripts in `克制面查询.html` with `new Function`; ran `git diff --check`. `node tests/bwiki-rendered-monster-skills-live.test.js` could not complete because BWiki returned HTTP 567 for the live `机幕方舟` parse request.
- Status: Complete.

### 2026-06-09 11:16 +08:00 - Codex

- Request: Explain `FALLBACK_DATA` and delete the old local skill pool rollback data without breaking functionality.
- Files changed:
  - `克制面查询.html`
  - `tests/local-skill-pool-rollback-static.test.js`
  - `tests/no-local-skill-pool-rollback-static.test.js`
  - `AGENTS.md`
- Changes:
  - Removed the 336-entry `LCX_LEGACY_SKILL_POOL_OVERRIDES` object and the browser-console rollback helper.
  - Removed the local skill-pool rollback localStorage gate and the `applyLocalSkillPoolOverrides()` application path.
  - Changed dex data application so normalized BWiki/cache data is applied directly.
  - Replaced the rollback-presence static test with a removal-regression test that rejects old local skill-pool override code.
- Verification: Watched `node tests/no-local-skill-pool-rollback-static.test.js` fail before deleting the old pool, then reran it after the change and it passed. Ran `node tests/bwiki-empty-supplemental-learner-static.test.js`; `node tests/bwiki-index-title-static.test.js`; `node tests/bwiki-only-update-static.test.js`; `node tests/bwiki-rendered-monster-profile-static.test.js`; `node tests/bwiki-rendered-skill-profile-static.test.js`; `node tests/bwiki-skill-learner-static.test.js`; `node tests/default-build-static.test.js`; `node tests/legacy-image-url-static.test.js`; `node tests/no-local-skill-pool-rollback-static.test.js`; `node tests/roller-icon-static.test.js`; parsed all inline scripts in `克制面查询.html` with `new Function`; ran `git diff --check`. `node tests/bwiki-rendered-monster-skills-live.test.js` could not complete because BWiki returned HTTP 567 for the live `机幕方舟` parse request.
- Status: Complete.

### 2026-06-09 11:34 +08:00 - Codex

- Request: Optimize `联网更新数据` speed by adding rendered BWiki page caching and progress display only.
- Files changed:
  - `克制面查询.html`
  - `tests/bwiki-rendered-cache-progress-static.test.js`
  - `tests/bwiki-empty-supplemental-learner-static.test.js`
  - `tests/bwiki-rendered-skill-profile-static.test.js`
  - `AGENTS.md`
- Changes:
  - Added a localStorage cache for parsed rendered BWiki skill and monster profiles, keyed by BWiki revision ID or timestamp.
  - Changed rendered skill and monster profile fetching to reuse matching cached profiles and only request pages whose revision is new or uncached.
  - Added progress text for BWiki index, base page, skill render page, and monster render page stages, including cache-hit counts for render stages.
  - Updated static tests for the new revision-aware rendered profile fetching path.
- Verification: Watched `node tests/bwiki-rendered-cache-progress-static.test.js` fail before the cache/progress implementation, then reran it after the change and it passed. Ran `node tests/bwiki-empty-supplemental-learner-static.test.js`; `node tests/bwiki-index-title-static.test.js`; `node tests/bwiki-only-update-static.test.js`; `node tests/bwiki-rendered-cache-progress-static.test.js`; `node tests/bwiki-rendered-monster-profile-static.test.js`; `node tests/bwiki-rendered-skill-profile-static.test.js`; `node tests/bwiki-skill-learner-static.test.js`; `node tests/default-build-static.test.js`; `node tests/legacy-image-url-static.test.js`; `node tests/no-local-skill-pool-rollback-static.test.js`; `node tests/roller-icon-static.test.js`; parsed all inline scripts in `克制面查询.html` with `new Function`; ran `git diff --check`; ran `node tests/bwiki-rendered-monster-skills-live.test.js`, which parsed the live BWiki `机幕方舟` rendered skill cards and confirmed `过山车`.
- Status: Complete.

### 2026-06-09 16:23 +08:00 - Codex

- Request: Fix the online update failure `BWiki 页面批量读取 JSONP 请求失败`.
- Files changed:
  - `克制面查询.html`
  - `tests/bwiki-wikitext-batch-resilience-static.test.js`
  - `AGENTS.md`
- Changes:
  - Added a resilient BWiki wikitext batch reader that retries failed page batches by splitting them into smaller batches.
  - Changed unrecoverable single-page wikitext failures to skip only that page instead of failing the whole online update.
  - Kept the update source BWiki-only and did not add any fallback data source.
  - Added a regression test covering batch failure, split retry, single-page skip, and warning behavior.
- Verification: Watched `node tests/bwiki-wikitext-batch-resilience-static.test.js` fail before implementation, then reran it after the change and it passed. Ran `node tests/bwiki-empty-supplemental-learner-static.test.js`; `node tests/bwiki-index-title-static.test.js`; `node tests/bwiki-only-update-static.test.js`; `node tests/bwiki-rendered-cache-progress-static.test.js`; `node tests/bwiki-rendered-monster-profile-static.test.js`; `node tests/bwiki-rendered-skill-profile-static.test.js`; `node tests/bwiki-skill-learner-static.test.js`; `node tests/bwiki-wikitext-batch-resilience-static.test.js`; `node tests/default-build-static.test.js`; `node tests/legacy-image-url-static.test.js`; `node tests/no-local-skill-pool-rollback-static.test.js`; `node tests/roller-icon-static.test.js`; parsed all inline scripts in `克制面查询.html` with `new Function`; ran `git diff --check`; ran `node tests/bwiki-rendered-monster-skills-live.test.js`, which parsed the live BWiki `机幕方舟` rendered skill cards and confirmed `过山车`.
- Status: Complete.

### 2026-06-09 16:32 +08:00 - Codex

- Request: Fix PVP skill selection showing no damage for selected attack skills.
- Files changed:
  - `克制面查询.html`
  - `tests/pvp-selected-skill-damage-static.test.js`
  - `AGENTS.md`
- Changes:
  - Fixed rendered BWiki skill profile parsing to recognize the current `威力` label as well as the older/reversed `力威` label.
  - Prevented the rendered skill description parser from treating `威力` as effect text.
  - Added a regression test using `炽伤`-style rendered skill data so selected PVP attack skills keep numeric power after rendered profile application.
- Verification: Watched `node tests/pvp-selected-skill-damage-static.test.js` fail before the HTML change, then reran it after the change and it passed. Ran all non-live Node tests in `tests`; parsed all inline scripts in both HTML files with `new Function`; ran `git diff --check`, which exited 0 with Git's LF-to-CRLF warning for `克制面查询.html`. Browser verification was not run because the in-app Browser navigation/screenshot tool was not exposed in this turn.
- Status: Complete.

### 2026-06-09 16:39 +08:00 - Codex

- Request: Continue fixing the PVP selected-skill damage issue after the previous parser-only fix did not resolve the user's browser state.
- Files changed:
  - `克制面查询.html`
  - `tests/bwiki-rendered-cache-progress-static.test.js`
  - `tests/pvp-selected-skill-damage-static.test.js`
  - `AGENTS.md`
- Changes:
  - Added cached skill power repair during dex data application so existing browser-local database entries with `power: null` recover numeric attack power from raw BWiki fields.
  - Bumped the rendered BWiki profile cache key/version from v1 to v2 so old rendered skill profiles that cached null attack power are not reused.
  - Extended the PVP selected-skill regression test to cover broken cached `炽伤` data and cache-version invalidation.
- Verification: Watched `node tests/pvp-selected-skill-damage-static.test.js` fail on missing cached-skill repair before the HTML change, then reran it after the change and it passed. Ran all non-live Node tests in `tests`; parsed all inline scripts in both HTML files with `new Function`; ran `git diff --check`, which exited 0 with Git's LF-to-CRLF warnings only.
- Status: Complete.

### 2026-06-09 16:50 +08:00 - Codex

- Request: Find the root cause for the PVP selected-skill damage issue still appearing, without special-value patches.
- Files changed:
  - `克制面查询-简洁版.html`
  - `tests/simple-html-sync-static.test.js`
  - `AGENTS.md`
- Changes:
  - Identified that the reported `阿米亚特`/`缠丝劲` UI was coming from the stale simplified HTML duplicate, not the main HTML that had received the recent BWiki/PVP fixes.
  - Synced `克制面查询-简洁版.html` to reuse the current main app script/data logic while preserving the simplified page shell and CSS.
  - Removed the simplified duplicate's stale local skill-pool overrides, S2 skill overrides, local stat overrides, and old `过山车` patch by replacing its script tail with the main file's current script tail.
  - Added a regression test to keep the simplified HTML script/data logic identical to the main HTML and reject stale local override code from returning.
- Verification: Confirmed BWiki `缠丝劲` has `技能类别=物攻`, `威力=25`, and `效果=造成物伤，2连击。`; ran `node tests/simple-html-sync-static.test.js`; ran `node tests/pvp-selected-skill-damage-static.test.js`; ran all non-live Node tests in `tests`; parsed all inline scripts in both HTML files with `new Function`; ran `git diff --check`, which exited 0 with Git's LF-to-CRLF warning for `克制面查询-简洁版.html`.
- Status: Complete.

### 2026-06-09 17:01 +08:00 - Codex

- Request: Re-check the main app root cause for PVP selected skills still showing no damage, using the prior skill-pool/stat-pool context and avoiding special-value patches.
- Files changed:
  - `克制面查询.html`
  - `克制面查询-简洁版.html`
  - `tests/pvp-selected-skill-damage-static.test.js`
  - `AGENTS.md`
- Changes:
  - Added generic cached skill category repair during dex data application so old browser-local BWiki cache entries recover canonical `physical`/`special`/`attack` categories from current, rendered, and nested raw BWiki fields.
  - Extended cached skill power repair to read nested BWiki raw/rendered fields such as `raw.raw["威力"]`, fixing stale normalized cache entries without hardcoded skill-name patches.
  - Applied cached category repair before cached power repair, because PVP damage rejects non-attack categories before checking numeric power.
  - Passed the selected PVP skill slot from the action object into variable damage rules, matching where `pvpActionFromState()` stores the slot.
  - Synced the simplified duplicate's script tail from the main app so both HTML entries use the same repaired data and PVP logic.
- Verification: Watched `node tests/pvp-selected-skill-damage-static.test.js` fail before the production change because `repairCachedSkillCategory` was missing, then reran it after the change and it passed. Ran all non-live Node tests in `tests`; parsed all inline scripts in both HTML files with `new Function`; ran `git diff --check`, which exited 0 with Git's LF-to-CRLF warnings only.
- Status: Complete.

### 2026-06-09 17:13 +08:00 - Codex

- Request: Fix PVP battle hero traits not displaying for examples including 音速犬、火神、蹦床松鼠、波普鹿、风暴战犬、梦想三三.
- Files changed:
  - `克制面查询.html`
  - `克制面查询-简洁版.html`
  - `tests/pvp-hero-trait-display-static.test.js`
  - `AGENTS.md`
- Changes:
  - Changed PVP hero-trait matching so named rules can resolve by monster name, aliases, BWiki title/name fields, and boss/form suffixes even when BWiki/cache data does not provide a usable evolution-chain ID.
  - Added generic matching from BWiki raw and nested cached `特性` / `英雄特性` fields back to the hero-trait rule table, so chain-ID-only rules can still display when the source data has the trait name.
  - Added 蹦床松鼠 and its line names to the existing 囤积 rule.
  - Synced the simplified duplicate's script tail from the main app so both HTML entries use the same repaired PVP trait logic.
  - Added a static regression test covering the reported examples, named boss/form suffix matching, and raw/nested BWiki trait-name matching.
- Verification: Watched `node tests/pvp-hero-trait-display-static.test.js` fail before the production change on 音速犬 without a chain ID, then reran it after the change and it passed. Ran all non-live Node tests in `tests`; parsed all inline scripts in both HTML files with `new Function`; ran `git diff --check`, which exited 0 with Git's LF-to-CRLF warnings only.
- Status: Complete.

### 2026-06-09 17:45 +08:00 - Codex

- Request: Fix PVP issues where 水泡盾减伤词条 was missing and clicking 羽化加速 did not add 技能威力+20, without special-value patches.
- Files changed:
  - `克制面查询.html`
  - `克制面查询-简洁版.html`
  - `tests/pvp-support-defense-effects-static.test.js`
  - `AGENTS.md`
- Changes:
  - Added generic support-skill effect parsing for flat skill power, percentage skill power, and hit-count bonuses from status/defense skill text such as 全技能威力+20.
  - Changed PVP support skill clicks to record those parsed support effects into the existing later-damage state fields and show them in the recorded support text.
  - Reworked defense skill reduction parsing into a generic effect object that supports 减伤N%、伤害降低N%、伤害减少N%、伤害减免N%, and exposes a visible reduction label in damage details.
  - Kept the old `defenseReductionMultiplier()` wrapper for existing callers while using the richer reduction effect in PVP damage output.
  - Synced the simplified duplicate's script tail from the main app so both HTML entries use the same repaired PVP support/defense logic.
  - Added a static regression test covering 水泡盾-style compact 减伤80% labels and 羽化加速-style 全技能威力+20 support-state application.
- Verification: Watched `node tests/pvp-support-defense-effects-static.test.js` fail before the production change because `supportSkillEffects` was missing, then reran it after the change and it passed. Ran all non-live Node tests in `tests`; parsed all inline scripts in both HTML files with `new Function`; ran `git diff --check`, which exited 0 with Git's LF-to-CRLF warnings only.
- Status: Complete.

### 2026-06-09 20:21 +08:00 - Codex

- Request: First fix Dimo's PVP trait to 20% per layer, then fix Water Shield damage reduction; stop maintaining the simplified HTML version.
- Files changed:
  - `克制面查询.html`
  - `tests/pvp-hero-trait-display-static.test.js`
  - `tests/pvp-support-defense-effects-static.test.js`
  - `tests/simple-html-sync-static.test.js`
  - `AGENTS.md`
- Changes:
  - Updated the PVP `最好的伙伴` trait rule so Dimo gains 20% per layer to physical attack, physical defense, magic attack, magic defense, and speed.
  - Added a regression check proving Dimo resolves `最好的伙伴` at 20% per layer.
  - Fixed the root cause for Water Shield by keeping defense-category skills selectable as PVP actions instead of consuming them as support buffs, allowing the existing defense-reduction rule to apply and display.
  - Added a regression check proving defense skills with response buffs are not swallowed by support-skill handling.
  - Removed the obsolete simplified-HTML sync test because the simplified version is no longer maintained.
- Verification: Ran `node tests/pvp-hero-trait-display-static.test.js`; `node tests/pvp-support-defense-effects-static.test.js`; `node tests/pvp-selected-skill-damage-static.test.js`; all non-live Node tests in `tests`; parsed all inline scripts in both HTML files with `new Function`; ran `git diff --check`, which exited 0 with Git's LF-to-CRLF warnings only.
- Status: Complete.

### 2026-06-09 20:29 +08:00 - Codex

- Request: Fix Water Shield losing its magic-attack buff while still keeping defense skills as PVP defense actions.
- Files changed:
  - `克制面查询.html`
  - `tests/pvp-support-defense-effects-static.test.js`
  - `AGENTS.md`
- Changes:
  - Changed `applyPvpSupportSkill()` so defense-category skills still apply parsed support buffs, then return `false` so they are not consumed as pure support actions.
  - Added `selectPvpSkillAction()` so defense skills remain selected as PVP actions when clicked again instead of being toggled off by the generic action toggle.
  - Added regression checks proving Water Shield applies `魔攻+70%`, keeps its support text, and remains the active defense action.
- Verification: Watched `node tests/pvp-support-defense-effects-static.test.js` fail before implementation, then reran it after the change and it passed. Ran `node tests/pvp-selected-skill-damage-static.test.js`; `node tests/pvp-hero-trait-display-static.test.js`; all non-live Node tests in `tests`; parsed all inline scripts in both HTML files with `new Function`; ran `git diff --check`, which exited 0 with Git's LF-to-CRLF warnings only.
- Status: Complete.

### 2026-06-09 20:48 +08:00 - Codex

- Request: Implement PVP items 3, 4, and 5: special skill power rules, Super Candy cute-layer logic, and cute-layer UI/form switching, while preserving other functions.
- Files changed:
  - `克制面查询.html`
  - `tests/bwiki-rendered-monster-profile-static.test.js`
  - `tests/pvp-cute-layer-static.test.js`
  - `tests/pvp-special-power-rules-static.test.js`
  - `tests/pvp-support-defense-effects-static.test.js`
  - `AGENTS.md`
- Changes:
  - Added a centralized special PVP power-rule pool and registered `超级糖果` with independent 160/100 power judgment based on whether the current attacker can gain `萌化+1`.
  - Added post-use PVP effect handling so successful Super Candy use snapshots the pre-use monster/layer state for damage, then applies `萌化+1` and switches to the next lower form.
  - Added PVP cute-layer state, non-negative normalization, buff-panel controls, and form up/down switching while preserving nature, talents, skills, and existing buffs.
  - Added rendered BWiki evolution-chain parsing so pages such as `风暴战犬` can populate shared chain IDs and evolution stages from the online `进化链` section instead of local special patches.
  - Kept the simplified HTML version untouched.
- Verification: Watched `node tests/pvp-cute-layer-static.test.js`, `node tests/pvp-special-power-rules-static.test.js`, and `node tests/bwiki-rendered-monster-profile-static.test.js` fail before implementation, then reran them after the change and they passed. Ran all non-live Node tests in `tests`; parsed all inline scripts in both HTML files with `new Function`; ran `git diff --check`, which exited 0 with Git's LF-to-CRLF warnings only. Browser visual verification was not run because no Browser control tool was exposed in this turn.
- Status: Complete.

### 2026-06-09 21:02 +08:00 - Codex

- Request: Fix the cute-layer UI placement and make Sonic Dog automatically gain cute +1 from Super Candy.
- Files changed:
  - `克制面查询.html`
  - `tests/pvp-cute-layer-static.test.js`
  - `AGENTS.md`
- Changes:
  - Moved the `萌化` controls into the main PVP buff grid so they appear as part of `增益状态` alongside other buff controls.
  - Added a generic fallback evolution-line resolver that uses existing PVP trait-rule family names when cached monster data lacks BWiki `chainId`/`evolutionStage` fields.
  - Covered the Sonic Dog line fallback so cached `音速犬` can still resolve downward to `护主犬` and Super Candy can enter the 160-power, post-use cute +1 branch.
- Verification: Watched `node tests/pvp-cute-layer-static.test.js` fail before implementation on the old-cache Sonic Dog case, then reran it after the change and it passed. Ran `node tests/pvp-special-power-rules-static.test.js`; `node tests/pvp-selected-skill-damage-static.test.js`; `node tests/pvp-support-defense-effects-static.test.js`; `node tests/pvp-hero-trait-display-static.test.js`; all non-live Node tests in `tests`; parsed all inline scripts in both HTML files with `new Function`; ran `git diff --check`, which exited 0 with Git's LF-to-CRLF warnings only. Browser visual verification was not run because no Browser control tool was exposed in this turn.
- Status: Complete.

### 2026-06-09 21:15 +08:00 - Codex

- Request: Explain and fix why Guard Dog still showed Super Candy as 160 damage after Sonic Dog used Super Candy.
- Files changed:
  - `克制面查询.html`
  - `tests/pvp-cute-layer-static.test.js`
  - `AGENTS.md`
- Changes:
  - Identified the root cause as stale PVP action snapshots: after a successful cute-layer form shift, the panel showed the new lower form but damage calculation still reused the previous form's `actionMonsterId` and `actionCuteLayers`.
  - Changed the generic cute-layer form switching path to clear the selected action, action monster snapshot, cute-layer snapshot, and force-impact flag after any successful form shift.
  - Added a regression test proving Sonic Dog switching into Guard Dog clears the stale pre-use action snapshot instead of continuing to show the old 160-power Super Candy result.
  - Kept the simplified HTML version untouched.
- Verification: Watched `node tests/pvp-cute-layer-static.test.js` fail before the production change on the stale action snapshot assertion, then reran it after the change and it passed. Ran `node tests/pvp-special-power-rules-static.test.js`; `node tests/pvp-selected-skill-damage-static.test.js`; `node tests/pvp-support-defense-effects-static.test.js`; all non-live Node tests in `tests`; parsed all inline scripts in both HTML files with `new Function`; ran `git diff --check`, which exited 0 with Git's LF-to-CRLF warnings only.
- Status: Complete.

### 2026-06-09 21:30 +08:00 - Codex

- Request: Fix the remaining PVP issues where Guard Dog still showed Super Candy as 160 damage and Cheer Crab did not gain cute +1 from Super Candy.
- Files changed:
  - `克制面查询.html`
  - `tests/bwiki-rendered-cache-progress-static.test.js`
  - `tests/bwiki-rendered-monster-profile-static.test.js`
  - `tests/pvp-selected-skill-damage-static.test.js`
  - `tests/pvp-special-power-rules-static.test.js`
  - `AGENTS.md`
- Changes:
  - Fixed rendered BWiki evolution-chain parsing for pages that put `▶` separators on their own lines, such as `加油海葵 > 加油蟹`.
  - Filtered generic evolution-condition lines such as `需在他人世界` so they do not become fake evolution stages.
  - Bumped the rendered BWiki profile cache key/version to v3 so old cached monster profiles without parsed evolution lines are ignored and reparsed.
  - Bumped the normalized dex data cache key to v2 so old complete dex caches generated before the evolution-chain parser fix are ignored and rebuilt.
  - Added a stale-action snapshot guard so PVP damage and Super Candy post-use checks only use the pre-use snapshot while it still matches the current panel monster; after a form change, current monster data is used.
  - Kept the simplified HTML version untouched.
- Verification: Watched `node tests/bwiki-rendered-monster-profile-static.test.js`, `node tests/bwiki-rendered-cache-progress-static.test.js`, and `node tests/pvp-special-power-rules-static.test.js` fail before the production changes, including the dex-cache v2 assertion, then reran them after the changes and they passed. Live-checked the current parser against the BWiki `加油蟹` page and confirmed `加油海葵>加油蟹`. Ran all non-live Node tests in `tests`; parsed all inline scripts in both HTML files with `new Function`; ran `git diff --check`, which exited 0 with Git's LF-to-CRLF warnings only.
- Status: Complete.

### 2026-06-10 09:29 +08:00 - Codex

- Request: Fix the online update failure `Failed to execute 'setItem' on 'Storage': Setting the value of 'roco-world-dex-data-v2' exceeded the quota`.
- Files changed:
  - `克制面查询.html`
  - `tests/bwiki-rendered-cache-progress-static.test.js`
  - `AGENTS.md`
- Changes:
  - Added quota-aware dex data storage that removes obsolete v1 dex cache and old rendered profile caches before writing the current v2 dex cache.
  - Added a retry path that clears the rebuildable current rendered profile cache if browser storage is still over quota.
  - Changed online update so freshly fetched BWiki data is still applied to the current page even if persistent localStorage caching remains unavailable after cleanup.
  - Added regression coverage for obsolete cache cleanup, rendered profile cache cleanup, and non-throwing behavior when quota remains exceeded.
  - Left the existing simplified HTML deletion in the working tree untouched.
- Verification: Watched `node tests/bwiki-rendered-cache-progress-static.test.js` fail before implementation on the missing quota-aware storage path, then reran it after the change and it passed. Ran all non-live Node tests in `tests`; parsed inline scripts in the currently present HTML files with `new Function`; ran `git diff --check`, which exited 0 with Git's LF-to-CRLF warnings only.
- Status: Complete.

### 2026-06-10 09:41 +08:00 - Codex

- Request: Fix Cheer Crab still not gaining cute +1 from Super Candy.
- Files changed:
  - `克制面查询.html`
  - `tests/bwiki-rendered-cache-progress-static.test.js`
  - `tests/bwiki-rendered-monster-profile-static.test.js`
  - `tests/bwiki-skill-learner-static.test.js`
  - `AGENTS.md`
- Changes:
  - Identified that rendered evolution chains can reference lower forms that are missing from the monster index, so the existing evolution-stage application skipped those forms.
  - Added generic detection for evolution-chain form names missing from the parsed monster list.
  - Changed the BWiki update path to fetch missing evolution form pages, parse them as normal monster records, merge them into the bundle, then apply rendered evolution stages.
  - Bumped the normalized dex cache key to v3 so old v2 data without supplemental evolution forms is ignored and rebuilt.
  - Updated BWiki tests to cover split evolution chains with missing lower forms and the new cache invalidation.
  - Left the existing simplified HTML deletion in the working tree untouched.
- Verification: Watched `node tests/bwiki-rendered-monster-profile-static.test.js` fail before implementation because `missingBwikiEvolutionFormNames` was missing, then reran it after the change and it passed. Ran `node tests/bwiki-rendered-cache-progress-static.test.js`; `node tests/pvp-cute-layer-static.test.js`; `node tests/pvp-special-power-rules-static.test.js`; all non-live Node tests in `tests`; parsed inline scripts in the currently present HTML files with `new Function`; ran `git diff --check`, which exited 0 with Git's LF-to-CRLF warnings only.
- Status: Complete.

### 2026-06-10 10:06 +08:00 - Codex

- Request: Fix the online update failure `BWiki 过山车 JSONP 请求失败。已使用本地缓存或内置示例。`
- Files changed:
  - `克制面查询.html`
  - `tests/bwiki-empty-supplemental-learner-static.test.js`
  - `AGENTS.md`
- Changes:
  - Identified that supplemental BWiki skill learner fetching still treated a single `过山车` rendered-page JSONP failure as fatal.
  - Changed supplemental learner parsing to skip failed single skill pages with a warning instead of failing the whole BWiki update.
  - Added the same non-fatal guard around supplemental skill wikitext page fetching so optional supplemental pages cannot abort the update.
  - Added regression coverage for a failing `过山车` supplemental learner page.
  - Left the existing simplified HTML deletion in the working tree untouched.
- Verification: Watched `node tests/bwiki-empty-supplemental-learner-static.test.js` fail before implementation on `BWiki 过山车 JSONP 请求失败`, then reran it after the change and it passed. Ran `node tests/bwiki-wikitext-batch-resilience-static.test.js`; `node tests/roller-icon-static.test.js`; all non-live Node tests in `tests`; parsed inline scripts in the currently present HTML files with `new Function`; ran `git diff --check`, which exited 0 with Git's LF-to-CRLF warnings only.
- Status: Complete.

### 2026-06-10 10:48 +08:00 - Codex

- Request: Fix PVP cute-layer behavior where only Sonic Dog could gain cute layers, manual cute + failed for other high forms, and status skills such as Show Weakness did not grant speed after successful cute gain.
- Files changed:
  - `克制面查询.html`
  - `tests/pvp-cute-layer-static.test.js`
  - `tests/pvp-special-power-rules-static.test.js`
  - `AGENTS.md`
- Changes:
  - Identified that PVP cute-form resolution only used structured chain fields or hero-trait fallback names, so ordinary high forms with only cached raw/rendered evolution-line names had no lower form.
  - Added generic raw/rendered evolution-line parsing as a shared PVP form-chain source before trait fallback, allowing Super Candy and manual cute + to use the same lower-form lookup.
  - Added a generic PVP post-use effect resolver for skills whose text grants cute +1, keeping status skills as status skills while still applying cute-layer post-use behavior.
  - Added flat post-use stat storage and final-stat application so success-bound bonuses such as speed +150 are calculated only after successful cute gain.
  - Kept Super Candy's independent special power rule as the higher-priority rule so its cute +1 effect is not duplicated by generic text parsing.
  - Left the existing simplified HTML deletion in the working tree untouched.
- Verification: Watched `node tests/pvp-cute-layer-static.test.js` fail before implementation because `rawEvolutionLineNames` was missing, and watched `node tests/pvp-special-power-rules-static.test.js` fail because `resolvePvpPostUseEffects` was missing. After implementation, ran both tests and they passed. Ran `node tests/pvp-support-defense-effects-static.test.js`; all non-live Node tests in `tests`; parsed inline scripts in the currently present HTML files with `new Function`; ran `git diff --check`, which exited 0 with Git's LF-to-CRLF warnings only.
- Status: Complete.

### 2026-06-10 11:25 +08:00 - Codex

- Request: Fix PVP cute-layer rules according to the confirmed requirements, restore boss monster selection, and keep simplified HTML untouched.
- Files changed:
  - `克制面查询.html`
  - `tests/pvp-cute-layer-static.test.js`
  - `tests/pvp-boss-forms-static.test.js`
  - `AGENTS.md`
- Changes:
  - Fixed the root cause where names listed as boss-capable forms, such as `风暴战犬`, were treated as boss variants and removed from normal PVP evolution chains.
  - Changed PVP cute evolution lookup to exclude only generated boss forms, so ordinary non-lowest forms can still resolve lower and upper forms.
  - Added generated boss forms in `withBossForms()` from the existing boss-name pool, using exact source monsters or trait-rule family sources when the boss page is missing from BWiki data.
  - Kept generated boss forms searchable by their base boss name and marked them as generated boss variants for PVP display/counting.
  - Added the confirmed `菊花梨`/`菊花里` exception so it can gain cute +1 without a lower form while ordinary single-form monsters still cannot.
  - Left the existing simplified HTML deletion in the working tree untouched.
- Verification: Watched `node tests/pvp-cute-layer-static.test.js` fail before implementation because `风暴战犬` was excluded from its normal evolution line, and watched `node tests/pvp-boss-forms-static.test.js` fail because boss-form generation helpers were missing. After implementation, ran both tests and they passed. Ran `node tests/pvp-special-power-rules-static.test.js`; `node tests/pvp-hero-trait-display-static.test.js`; all non-live Node tests in `tests`; parsed inline scripts in the currently present HTML files with `new Function`; ran `git diff --check`, which exited 0 with Git's LF-to-CRLF warnings only.
- Status: Complete.

### 2026-06-10 14:26 +08:00 - Codex

- Request: 解决精灵不全、首领精灵没有，以及不能手动萌化的问题。
- Files changed:
  - `克制面查询.html`
  - `tests/bwiki-rendered-cache-progress-static.test.js`
  - `tests/bwiki-rendered-monster-profile-static.test.js`
  - `tests/pvp-boss-forms-static.test.js`
  - `tests/pvp-cute-layer-static.test.js`
  - `tests/pvp-selected-skill-damage-static.test.js`
  - `AGENTS.md`
- Changes:
  - Added BWiki rendered evolution parsing for `首领化` markers and applied those markers back to source monster records.
  - Changed generated boss-form creation to use BWiki-discovered boss-capable forms in addition to the older local fallback names, then bumped dex and rendered-profile cache keys to rebuild stale local data.
  - Changed PVP cute evolution lookup so generated boss forms resolve through their source monster, allowing manual `萌化 +` to move to the correct lower form.
  - Filtered BWiki rendered evolution file links such as `文件:Head 5018.png` so they do not pollute evolution chains.
  - Left the existing simplified HTML deletion in the working tree untouched.
- Verification: Watched `node tests/pvp-boss-forms-static.test.js`, `node tests/pvp-cute-layer-static.test.js`, and `node tests/bwiki-rendered-monster-profile-static.test.js` fail before implementation, then reran them after the change and they passed. Ran all non-live Node tests in `tests`; parsed inline scripts in the currently present HTML files with `new Function`; live-checked the BWiki `风暴战犬` rendered page parses boss names as `风暴战犬` and evolution line as `护主犬 > 音速犬 > 风暴战犬`; ran `git diff --check`, which exited 0 with Git's LF-to-CRLF warnings only. Browser visual verification was not run because the Browser navigation/screenshot tool was not exposed in this turn.
- Status: Complete.

### 2026-06-10 14:52 +08:00 - Codex

- Request: Fix the remaining missing boss monsters after online update, using the screenshot case where `彩虹独角兽` was missing and update took a long time.
- Files changed:
  - `克制面查询.html`
  - `tests/bwiki-empty-supplemental-learner-static.test.js`
  - `tests/bwiki-rendered-cache-progress-static.test.js`
  - `tests/bwiki-rendered-monster-profile-static.test.js`
  - `tests/bwiki-supplemental-boss-monsters-static.test.js`
  - `tests/pvp-boss-forms-static.test.js`
  - `tests/pvp-selected-skill-damage-static.test.js`
  - `AGENTS.md`
- Changes:
  - Identified that BWiki has pages such as `彩虹独角兽` with `精灵形态=首领形态`, but those pages are absent from the rendered `精灵图鉴` index, so the BWiki-only update never fetched them.
  - Added supplemental BWiki monster page fetching for known boss-form names missing from the index, so missing boss pages are parsed as real monsters.
  - Treated BWiki `精灵形态=首领形态` as a direct boss variant and avoided generating duplicate `（首领）` copies for direct boss pages.
  - Parsed rendered monster images from supplemental pages and applied them to records that do not have index-card image URLs.
  - Bumped the normalized dex cache key to v5 so the browser rebuilds the local monster list, while keeping the rendered-page cache reusable to avoid another full slow rendered-page refetch.
  - Left the existing simplified HTML deletion in the working tree untouched.
- Verification: Watched `node tests/bwiki-supplemental-boss-monsters-static.test.js`, `node tests/pvp-boss-forms-static.test.js`, and `node tests/bwiki-rendered-monster-profile-static.test.js` fail before implementation, then reran them after the change and they passed. Ran all non-live Node tests in `tests`; parsed inline scripts in the currently present HTML files with `new Function`; live-checked BWiki and confirmed `精灵图鉴` does not contain `彩虹独角兽`, while the `彩虹独角兽` page exists with `精灵形态=首领形态`, `主属性=光`, `特性=夺目`, and a rendered image URL; ran `git diff --check`, which exited 0 with Git's LF-to-CRLF warnings only.
- Status: Complete.

### 2026-06-10 15:17 +08:00 - Codex

- Request: Fix duplicate boss monsters in PVP search and missing boss images, and explain whether images are locally cached.
- Files changed:
  - `克制面查询.html`
  - `tests/pvp-boss-forms-static.test.js`
  - `tests/bwiki-rendered-monster-profile-static.test.js`
  - `tests/bwiki-rendered-cache-progress-static.test.js`
  - `tests/pvp-selected-skill-damage-static.test.js`
  - `AGENTS.md`
- Changes:
  - Prevented generated `（首领）` copies when a direct BWiki boss monster page already exists, including cases where trait-rule family fallback can still find a normal source form.
  - Changed rendered BWiki monster image parsing to ignore the known placeholder URL and prefer real boss portrait image tags, then fall back only to a single unambiguous head icon.
  - Bumped normalized dex data cache to v6 and rendered BWiki profile cache to v5 so old cached duplicate/placeholder-image data is rebuilt.
  - Added regression tests for duplicate direct boss pages, placeholder boss image parsing, and the cache invalidation keys.
  - Left the existing simplified HTML deletion in the working tree untouched.
- Verification: Watched `node tests/pvp-boss-forms-static.test.js` and `node tests/bwiki-rendered-monster-profile-static.test.js` fail before implementation, then reran them after the change and they passed. Ran all non-live Node tests in `tests`; parsed inline scripts in the currently present HTML files with `new Function`; ran `git diff --check`, which exited 0 with Git's LF-to-CRLF warnings only. A live BWiki parser check for `黑猫密探` was blocked by the site returning HTML instead of JSON; Browser screenshot verification was not run because the in-app Browser control tool was not exposed in this turn.
- Status: Complete.

### 2026-06-10 19:56 +08:00 - Codex

- Request: Create a no-third-party-image, lower-copyright-risk copy of `克制面查询.html` for later WeChat Mini Program migration, without changing the original file or core calculation logic.
- Files changed:
  - `克制面查询_无图低风险版.html`
  - `AGENTS.md`
- Changes:
  - Created `克制面查询_无图低风险版.html` from the current `克制面查询.html` and left the original HTML file untouched.
  - Disabled monster and skill image rendering by keeping normalized monster/skill `icon` fields empty and using a separate no-image dex cache key.
  - Removed rendered use of third-party `patchwiki.biligame.com`, `rocomwiki.app`, element SVG, PNG, SVG, WebP, `<img>`, and `src=` image paths from the no-image copy.
  - Replaced monster, skill, attribute, and bloodline image display with CSS text badges or name initials across combos, selected cards, PVP preview, results, roller modules, chips, and the type matrix.
  - Added the requested footer notice about the non-official tool status, no default third-party image loading, and user responsibility for data authorization.
  - Preserved PVP calculation, type relation, damage simulation, skill pool, roller, local team storage, update, clear, and result-rendering logic outside the image-rendering path.
- Verification: Watched an inline no-image static check fail before implementation on `normalizeBundle` still using image URLs, then reran it after the change and it passed. Confirmed `rg` finds no `patchwiki.biligame.com`, `rocomwiki.app`, `/icons/elements/`, `<img`, `src=`, `.png`, `.svg`, or `.webp` in `克制面查询_无图低风险版.html`; confirmed remaining `image_url` matches are data fields only. Ran `node tests/default-build-static.test.js`; parsed inline scripts in `克制面查询.html` and `克制面查询_无图低风险版.html` with `new Function`; ran `git diff --check`. Browser screenshot verification was not run because no Browser control tool was exposed in this turn.
- Status: Complete.

### 2026-06-11 09:38 +08:00 - Codex

- Request: Use separate agents/workstreams to generate independent BWiki monster/evolution/image, per-monster skill, rendered monster stat, and total skill pool files, then compare those files with the corresponding normalized pools in `克制面查询.html`.
- Files changed:
  - `tools/bwiki-data-pool-exporter.mjs`
  - `tests/bwiki-data-pool-exports-static.test.js`
  - `data/generated/bwiki-monster-pool.json`
  - `data/generated/bwiki-monster-skill-pool.json`
  - `data/generated/bwiki-monster-stats.json`
  - `data/generated/bwiki-skill-pool.json`
  - `data/generated/bwiki-html-pool-comparison.json`
  - `AGENTS.md`
- Changes:
  - Added a Node exporter that reuses the HTML application's BWiki parsing and normalization functions, with a curl-backed transport for this environment.
  - Generated separate files containing 494 monster/evolution/image records, 494 per-monster learnable skill pools, 494 monster stat records, and 499 complete skill records.
  - Added a disk-based comparison report that detects missing, extra, and changed records; the generated files currently have 0 mismatches against the normalized HTML pools from the same BWiki run.
  - Added per-record stat provenance. BWiki rendered pages were confirmed for 322 monster stat records; 172 records retain the HTML updater's normalized wikitext fallback because BWiki rejected those rendered-page requests.
  - Added regression coverage for file names, evolution chains, images, skill-only pools, stat provenance, full skill fields, order drift, changed records, and extra records.
  - Left unrelated workspace changes, including the existing deletion of `克制面查询-简洁版.html`, untouched and unstaged.
- Verification: Watched `node tests/bwiki-data-pool-exports-static.test.js` fail before the exporter existed, fail again on skill order, rendered-stat provenance, and extra-record detection, then pass after each implementation fix. Ran the live exporter successfully; validated all five JSON files; confirmed 494 monster records, 499 skill records, all 494 stat records contain six stats, and the comparison report contains 0 mismatches. Ran the 20 scoped non-live Node tests (the tracked suite plus the exporter test); parsed executable inline scripts with `new Function`; ran `node tests/bwiki-rendered-monster-skills-live.test.js`, which confirmed `机幕方舟` includes `过山车`; ran scoped `git diff --check`. The unrelated untracked `tests/local-bundle-maintenance-static.test.js` was excluded from this task's verification and remains unstaged.
- Status: Complete with documented BWiki rendered-page coverage limitation.

### 2026-06-11 09:47 +08:00 - Codex

- Request: Keep the no-image build as a single-file HTML, embed the formal data pool, make startup fully offline, and add built-in data import, export, validation, CRUD maintenance, CSV assistance, browser saving, and single-file HTML generation without changing core battle calculations.
- Files changed:
  - `克制面查询_无图低风险版.html`
  - `tests/local-bundle-maintenance-static.test.js`
  - `AGENTS.md`
- Changes:
  - Embedded a sanitized `#LOCAL_BUNDLE_DATA` JSON block containing 494 monsters, 499 skills, 184 passives, 19 bloodlines, and the PVP preset collection; the page no longer needs an external runtime JSON file.
  - Changed startup order to browser-maintained localStorage data, then embedded HTML data, then `FALLBACK_DATA`, with no automatic BWiki or other third-party request.
  - Replaced the main online update control with import, export, clear-local-data, and maintenance controls.
  - Added an in-page maintenance dialog for monster, skill, passive, and PVP preset CRUD, name-based relationship selection, Chinese validation results, CSV auxiliary import, browser persistence, JSON export, and regenerated single-file HTML export.
  - Kept BWiki fetching only in the collapsed advanced maintenance section, behind the required confirmation, and made fetched data draft-only until explicitly saved or exported.
  - Kept the existing simplified HTML deletion untouched and left `克制面查询.html` unchanged.
- Verification: Added a regression test and confirmed it failed before implementation on the missing embedded bundle, then passed after implementation. Ran all non-live Node tests in `tests`; parsed all executable script blocks in `克制面查询_无图低风险版.html` with `new Function`; validated the embedded JSON counts and confirmed it contains no HTTP URL, third-party domain, or image path; confirmed no `patchwiki.biligame.com`, `rocomwiki.app`, `<img>`, element icon path, PNG, SVG, or WebP reference is rendered. Browser-tested offline startup, the 494-monster maintenance count, search, editing `迪莫`, name-based skill association, adding a skill, and data validation with no console errors. Ran scoped `git diff --check`, which exited 0 with Git's LF-to-CRLF warning only.
- Status: Complete.
### 2026-06-11 12:44 +08:00 - Codex

- Request: Refactor the PVP/克制面/伤害计算 helper from the old single-file data package approach to B plan: `index.html` plus `data/local-bundle.json`, without breaking core calculation logic.
- Files changed:
  - `index.html`
  - `data/local-bundle.json`
  - `克制面查询_无图低风险版.html`
  - `tests/local-bundle-maintenance-static.test.js`
  - `tests/local-bundle-external-static.test.js`
  - `tests/pvp-cute-layer-static.test.js`
  - `tests/pvp-hero-trait-display-static.test.js`
  - `tests/pvp-selected-skill-damage-static.test.js`
  - `tests/pvp-special-power-rules-static.test.js`
  - `tests/pvp-support-defense-effects-static.test.js`
  - `AGENTS.md`
- Changes:
  - Created the new B-plan `index.html` entry that keeps UI, calculation logic, fixed bloodlines, boss-form generation, roller behavior, and tiny fallback data, while reading the formal data pool from `data/local-bundle.json`.
  - Extracted the formal local data package into `data/local-bundle.json` with only `monsters`, `skills`, and `passives`, and removed URL/image fields from that package.
  - Removed the old embedded-data maintenance/import/export/BWiki/CSV chain from the new `index.html` startup path; startup now fetches only `data/local-bundle.json` and falls back to `FALLBACK_DATA`.
  - Deleted the old `克制面查询_无图低风险版.html` single-file big package after the new external bundle path passed static and local HTTP checks.
  - Replaced the old embedded-maintenance static test with a B-plan external-bundle static test, including checks for no third-party image/request strings and fixed boss-form runtime generation.
  - Fixed old static tests that selected the shortest HTML file so they continue targeting the legacy `克制面查询.html` rather than the new `index.html`.
- Verification: Ran all non-live Node static tests in `tests/`; ran `node tests/local-bundle-external-static.test.js`; ran local HTTP checks confirming `index.html` and `data/local-bundle.json` return 200 with 494 monsters, 499 skills, and 184 passives and no URL/image fields; ran `git diff --check`. Browser-level Playwright verification was attempted but could not run because the bundled Playwright package is missing `playwright-core`.
- Status: Complete.

### 2026-06-11 13:05 +08:00 - Codex

- Request: Tighten `data/local-bundle.json` to the requested schema with `schemaVersion`, `generatedAt`, `currentSeason`, `monsters`, `skills`, and `passives`; move monster stats to top-level fields; remove BWiki/source-style IDs and source markers.
- Files changed:
  - `data/local-bundle.json`
  - `tests/local-bundle-external-static.test.js`
  - `AGENTS.md`
- Changes:
  - Rebuilt `data/local-bundle.json` with schema version 1, current season metadata, 494 monsters, 499 skills, and 184 passives.
  - Changed formal IDs from `bwiki-*` source-style IDs to `monster-*`, `skill-*`, and `passive-*`, and remapped every monster `skillIds` and `passiveIds` reference.
  - Moved monster species stats to top-level `stats.hp`, `stats.atk`, `stats.defense`, `stats.spa`, `stats.spd`, and `stats.spe`; retained only local runtime metadata in `raw`.
  - Strengthened the B-plan static test so the external bundle rejects missing schema fields, missing stats, broken skill/passive references, BWiki/source markers, URL/image fields, `bloodlines`, and `pvpPresets`.
- Verification: Watched `node tests/local-bundle-external-static.test.js` fail before the data rebuild on the missing schema fields, then pass after the rebuild. Ran all non-live Node tests in `tests`; ran a local HTTP check confirming `index.html` references `data/local-bundle.json`, the bundle returns 200 with schema version 1, 494 monsters, 499 skills, 184 passives, top-level stats, and no source/image markers; ran `git diff --check`, which exited 0 with Git LF-to-CRLF warnings only.
- Status: Complete.

### 2026-06-11 13:16 +08:00 - Codex

- Request: Ensure the `skills` pool keeps complete PVP skill fields and the `passives` pool keeps complete passive records, with `monster.skillIds` and `monster.passiveIds` remaining reference-only.
- Files changed:
  - `data/local-bundle.json`
  - `tests/local-bundle-external-static.test.js`
  - `AGENTS.md`
- Changes:
  - Added `raw: {}` to every skill and passive record in `data/local-bundle.json`.
  - Normalized missing skill numeric fields such as `power`, `energyCost`, and `accuracy` to `null`, while preserving numeric `pp` and `priority`.
  - Strengthened the external bundle static test to require complete skill fields (`type`, `category`, `mode`, `power`, `pp`, `energyCost`, `accuracy`, `priority`, `description`, `raw`) and complete passive fields (`description`, `raw`).
- Verification: Watched `node tests/local-bundle-external-static.test.js` fail before the data rebuild on missing skill `raw`, then pass after the rebuild. Ran all non-live Node tests in `tests`; ran a local HTTP check confirming `index.html` reads `data/local-bundle.json`, the bundle returns 200 with schema version 1, 494 monsters, 499 skills, 184 passives, complete skill/passive records, and no source/image markers; ran `git diff --check`, which exited 0 with Git LF-to-CRLF warnings only.
- Status: Complete.

### 2026-06-11 14:20 +08:00 - Codex

- Request: Keep bloodlines fixed in HTML, remove/ignore `pvpPresets`, and implement B-plan normal/admin data loading where only admin hash mode can prioritize browser-imported test data.
- Files changed:
  - `index.html`
  - `tests/local-bundle-external-static.test.js`
  - `AGENTS.md`
- Changes:
  - Removed `bloodlines` and `pvpPresets` from `FALLBACK_DATA`; runtime PVP bloodline selection continues to use the fixed HTML `BLOODLINES` constant.
  - Changed normal startup to request `data/local-bundle.json` with `cache: "no-cache"` and use the tiny fallback only when that request or validation fails.
  - Added `#admin` / `#data-admin` mode, where imported test data is read from a separate localStorage key before the external JSON; normal mode does not read that key.
  - Added a small admin-only import/clear panel. Imported JSON is validated, saved only to localStorage, and rejected if it contains `bloodlines` or `pvpPresets`.
  - Kept the requested import success message limited to monster, skill, and passive counts.
  - Left PVP nature/talent defaults, battle calculations, type relations, skill pools, roller behavior, and team storage logic unchanged.
- Verification: Watched `node tests/local-bundle-external-static.test.js` fail before implementation on the missing admin-only storage key, then pass after implementation. Ran all 21 non-live Node tests in `tests`; parsed executable scripts in both HTML files with `new Function`; confirmed through a local HTTP server that `index.html` and `data/local-bundle.json` return 200 and the JSON contains schema version 1, 494 monsters, 499 skills, 184 passives, no `bloodlines`, and no `pvpPresets`; scanned for third-party URL/image fields and found none. Browser interaction verification was attempted, but the in-app browser security policy blocked both localhost and file URLs.
- Status: Complete.

### 2026-06-11 14:52 +08:00 - Codex

- Request: Back up the repository, remove the legacy third-party ingestion/update system and generated source snapshots, separate normal/admin UI, strengthen imported package validation, and preserve all core PVP, cute-layer, bloodline, damage, and roller behavior.
- Files changed:
  - `index.html`
  - `tests/admin-mode-static.test.js`
  - `tests/local-bundle-external-static.test.js`
  - `tests/local-bundle-import-validation.test.js`
  - `tests/default-build-static.test.js`
  - `tests/no-local-skill-pool-rollback-static.test.js`
  - `tests/pvp-boss-forms-static.test.js`
  - `tests/pvp-cute-layer-static.test.js`
  - `tests/pvp-hero-trait-display-static.test.js`
  - `tests/pvp-selected-skill-damage-static.test.js`
  - `tests/pvp-special-power-rules-static.test.js`
  - `tests/pvp-support-defense-effects-static.test.js`
  - `tests/roller-runtime-static.test.js`
  - Removed the legacy application, source-ingestion exporter, generated source snapshots, source-only tests, and the obsolete remote-image test.
  - `AGENTS.md`
- Changes:
  - Created and verified the external backup `C:\codex-work\backups\codex-lkwg-battle-before-source-cleanup-20260611.zip` before deletion; SHA-256 is `D1D7C3C453D175931E7CB1B6226967A737C3DDF412CC162B4F818AED642F4B07`.
  - Kept the normal top bar limited to 显示结果、使用过山车、撤回过山车、清空. Added an admin-only toolbar for 导入数据、导出数据、清除导入数据 under `#admin` and `#data-admin`, including hash-change reload behavior.
  - Added active-package JSON export as `local-bundle.json` and strict import checks for schema, neutral IDs, arrays, six monster stats, skill fields, references, forbidden source metadata, external URLs, and image paths.
  - Removed runtime source metadata and changed the footer to neutral local-package/fallback wording.
  - Retargeted retained regression tests to `index.html` and preserved default build, boss-form generation, cute layers, Super Candy, trait, selected-skill damage, support/defense, roller, fixed bloodlines, and all four lookup Maps.
- Verification: Watched the focused release test fail before implementation on the missing admin-mode contract, then pass after implementation. A behavioral import test caught and verified the fix for `null` monster stats being accepted. Ran all retained tests; validated the formal 494-monster, 499-skill, 184-passive package through the same import validator; parsed all executable scripts; scanned `index.html` and `data/local-bundle.json` for removed network/source/image markers; confirmed neutral IDs and zero broken references; and confirmed both files return HTTP 200 from a local server with the expected controls and footer. Browser interaction was not retried because the in-app browser policy blocks local URLs in this environment.
- Status: Complete.

### 2026-06-11 15:16 +08:00 - Codex

- Request: Recheck the B-plan release in the requested 12-step order, back it up, verify data loading/admin separation/core rules/no third-party requests, and test the published page end to end.
- Files changed:
  - `index.html`
  - `tests/roller-runtime-static.test.js`
  - `AGENTS.md`
- Changes:
  - Created and verified the external backup `C:\codex-work\backups\codex-lkwg-battle-before-12-step-audit-20260611-150006.zip`; SHA-256 is `91408EE0747D06C325501D235BFDB6C296288271FD21309DA7DD7C93AD6BBCDD7`.
  - Confirmed the formal package has only the six allowed top-level fields, 494 monsters, 499 skills, 184 passives, neutral IDs, complete stat fields, and no broken skill/passive references.
  - Found through browser testing that the existing roller history changed correctly but the disabled state of the undo button was never synchronized.
  - Added a minimal roller undo-button state update after use, undo, and clear without changing the skill rotation or history logic.
  - Extended the roller regression test to execute the real roller/undo functions and verify button enable/disable behavior.
- Verification: Watched `node tests/roller-runtime-static.test.js` fail before the fix because `updateRollerUndoButton` was missing, then pass after the fix. Ran all 12 retained Node tests. Browser-tested normal JSON loading, fallback loading on HTTP 404, normal/admin toolbar separation, monster search, monster skill pool, passive/stat display, PVP default build and damage output, manual cute-layer controls on a valid monster, roller rotation and undo, and confirmed an empty error/warning console on the normal page. The browser asset inventory contained only the same-origin `data/local-bundle.json` request and no image/font/stylesheet/script assets.
- Status: Complete.

### 2026-06-11 17:31 +08:00 - Codex

- Request: Make two small B-plan cleanup changes only: set `data/local-bundle.json` `currentSeason` to `本地数据包` and replace `FALLBACK_DATA` with obvious built-in sample records.
- Files changed:
  - `data/local-bundle.json`
  - `index.html`
  - `tests/local-bundle-external-static.test.js`
  - `AGENTS.md`
- Changes:
  - Changed the formal local bundle `currentSeason` from placeholder question marks to `本地数据包`.
  - Replaced fallback-only records with `示例精灵A`, `示例精灵B`, `示例技能A`, `示例技能B`, `示例特性A`, and `示例特性B`.
  - Kept `FALLBACK_DATA` tiny and left the B-plan external bundle startup path unchanged.
  - Added regression assertions so the external bundle season and fallback sample names stay explicit.
- Verification: Watched `node tests/local-bundle-external-static.test.js` fail before the data/content change on the placeholder `currentSeason`, then pass after the change. Ran all 12 retained Node tests and scanned `index.html` plus `data/local-bundle.json` for old BWiki/remote/image/update-chain markers with no matches.
- Status: Complete.
