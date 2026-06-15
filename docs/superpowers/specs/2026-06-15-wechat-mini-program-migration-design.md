# WeChat Mini Program Migration Design

## Goal

Keep the current static web application unchanged and add a separately
maintained native WeChat Mini Program that can be opened, previewed, uploaded,
and reviewed with WeChat Developer Tools.

The first releasable Mini Program must include all ordinary user-facing
features from the web application. The hidden `#admin` data import, export, and
clear controls remain web-only.

## Chosen Approach

Build a native Mini Program under `miniprogram/` and configure
`project.config.json` with:

```json
{
  "miniprogramRoot": "miniprogram/"
}
```

Do not wrap the current HTML in a WebView and do not replace `index.html`.
Native WXML, WXSS, and JavaScript provide better review compatibility, device
behavior, startup reliability, and long-term maintenance than embedding the
web page.

## Page Structure

Use a native three-tab layout:

1. `pages/team/index`: configure six monsters, bloodlines, natures, talents,
   skills, and roller-coaster targets; save, clear, rotate skills, and undo the
   latest rotation.
2. `pages/analysis/index`: show team completion and matchup analysis derived
   from the saved team.
3. `pages/pvp/index`: configure both PVP sides and calculate stats, weather,
   traits, status effects, action order, and damage using the same rules as the
   web version.

Use a native `tabBar` with the labels `队伍`, `分析`, and `PVP`. Each page owns
its rendering and interaction state while reading shared domain modules.

## Project Layout

```text
miniprogram/
  app.js
  app.json
  app.wxss
  pages/
    team/
    analysis/
    pvp/
  components/
    combo-picker/
    stat-grid/
    skill-row/
  data/
    local-bundle.js
  domain/
    team.js
    stats.js
    type-rules.js
    pvp-build.js
    pvp-damage.js
    pvp-turn.js
    pvp-effects.js
  utils/
    storage.js
scripts/
  sync-miniprogram-data.js
```

Components are added only where repeated interactive behavior warrants a
stable interface. Calculation rules remain plain JavaScript modules so they
can be tested outside the WeChat runtime.

## Shared Data And Maintenance

`data/local-bundle.json` remains the authoritative repository data file.
`scripts/sync-miniprogram-data.js` validates it and generates
`miniprogram/data/local-bundle.js` for the Mini Program package.

Normal maintenance is:

1. Update and validate `data/local-bundle.json`.
2. Run the synchronization script.
3. Run web and Mini Program regression tests.
4. Preview in WeChat Developer Tools.
5. Upload a new Mini Program version and submit it for review.

The generated Mini Program data module is committed so a fresh checkout can
open and compile without requiring an extra build step. The hidden web admin
mode remains available for local data checking but is not shipped as a Mini
Program page.

## State And Data Flow

Use `wx.setStorageSync` and `wx.getStorageSync` for user team and PVP state.
Storage records include an explicit schema version. Invalid or outdated fields
are sanitized against the current local bundle before rendering.

The team page writes one normalized team record. The analysis page reads that
record whenever it becomes visible. The PVP page keeps a separate normalized
simulation record. Clearing team data does not clear PVP state unless the user
explicitly clears it from the PVP page.

No server, login, cloud database, remote script, or remote image dependency is
required for the first release.

## Functional Parity

The migration includes:

- six-slot team editing and completion feedback;
- monster, bloodline, nature, talent, and skill selection;
- roller-coaster skill rotation and undo;
- team matchup analysis;
- boss forms and local type/bloodline assets;
- PVP default builds, final stats, traits, weather, buffs, debuffs, energy,
  cooldowns, response rules, action order, and damage calculation;
- local persistence and clear actions;
- phone-safe layout matching the compact behavior of the web version.

The migration excludes:

- the web-only `#admin` data controls;
- browser downloads and file inputs;
- URL hash modes;
- external data loading at runtime;
- hidden turn-history UI that is already not rendered by the web version.

## Error Handling

The app must compile with bundled local data and show a clear empty or recovery
state instead of a blank page when stored data is invalid.

Data synchronization fails with a nonzero exit code when required records,
references, or fields are invalid. Mini Program pages must not silently invent
missing monsters, skills, passives, or numerical values.

## Testing And Verification

Add Node tests for:

- required Mini Program files and page registration;
- data synchronization and reference integrity;
- storage normalization and schema migration;
- shared team, stat, type, PVP build, damage, turn, and effect rules;
- parity fixtures comparing representative web and Mini Program calculations;
- page templates containing the required controls and bindings.

Verification for completion includes:

1. all existing web tests passing;
2. all new Mini Program tests passing;
3. `project.config.json` resolving `miniprogramRoot`;
4. WeChat Developer Tools compiling without errors;
5. simulator checks for all three tabs at common phone widths;
6. a real-device preview before upload.

## Delivery Sequence

Implementation may proceed in tested phases, but the first upload candidate is
not complete until all ordinary user-facing functionality above is available:

1. scaffold and compile the three-page Mini Program;
2. generate and validate local data;
3. migrate shared calculation modules;
4. complete team and analysis pages;
5. complete PVP page;
6. run parity, simulator, and real-device verification.

The existing web release remains usable throughout the migration.
