# PVP Default Build Presets Design

## Scope

Add compact default-build presets to the enemy PVP side and expose the effective
nature and talent effects directly in both sides' race-stat cards.

This change does not add presets to the ally side and does not replace manual
nature or talent selection.

## Enemy Preset Controls

Place one compact three-button row directly below the enemy nature and talent
fields:

- `最肉`
- `最速`
- `最高攻击`

The buttons are mutually exclusive. They use the existing rounded control
language, stay on one row, and use a low vertical height with a small gap from
the fields above. The active preset uses a blue filled background.

The initial enemy preset is `最肉`.

Clicking another preset switches the active preset. Clicking the active preset
again does not deactivate it while any nature or talent field remains empty.

When the user has manually selected one nature and all three talents, no preset
button is shown as active because no default values are being used. Clearing
any of those four manual fields restores the last selected preset as active.

## Default Resolution

Manual selections always take priority. The active enemy preset supplies only
missing nature and talent values.

Missing talent slots are filled in preset order while skipping talents already
selected manually, so the final effective build always contains three unique
talents.

### Most Durable

- Nature: `踏实`
- Talents: `生命`, `物防`, `魔防`

### Fastest

Compare the selected monster's original `物攻` and `魔攻` race stats.

- If `物攻 >= 魔攻`:
  - Nature: `开朗`
  - Talents: `生命`, `物攻`, `速度`
- If `魔攻 > 物攻`:
  - Nature: `胆小`
  - Talents: `生命`, `魔攻`, `速度`

### Highest Attack

Compare the selected monster's original `物攻` and `魔攻` race stats.

- If `物攻 >= 魔攻`:
  - Nature: `勇敢`
  - Talents: `生命`, `物攻`, `魔攻`
- If `魔攻 > 物攻`:
  - Nature: `冷静`
  - Talents: `生命`, `物攻`, `魔攻`

Physical attack wins exact original-stat ties.

The ally side keeps its existing missing-field defaults:

- Nature: `踏实`
- Talents: `生命`, `物防`, `魔防`

## Effective Default Note

The red note below each race-stat card describes the values currently supplying
empty fields.

For the enemy side, the note updates when the preset, monster, nature, or talent
selection changes. It names the effective default nature and three effective
default talents for the current monster and preset.

For the ally side, it continues to describe the durable default build.

When all nature and talent fields are manually filled, the note states that the
current nature and talents are manually configured instead of describing a
default.

## Race-Stat Indicators

Both ally and enemy race-stat cards display the effects of the final effective
build, whether each value came from a preset, the existing ally default, or a
manual selection.

### Nature

- The boosted stat cell uses a subtle green background and shows an upward
  arrow inside the numeric value area.
- The reduced stat cell uses a subtle red background and shows a downward arrow
  inside the numeric value area.
- The arrows are compact and do not increase the height of the stat row.

### Talents

- Each stat receiving a talent shows a bold green `＋` beside its numeric value.
- Do not display `+60`.
- The talent green is a stronger foreground color and must remain visually
  distinct from the nature cell's green background.

A stat may show both a nature arrow and the talent `＋`.

## State And Persistence

Add an enemy default-build preset state with `durable` as the initial value.
Normalize missing or invalid saved values back to `durable`.

The selected preset persists in the in-memory PVP simulator state when changing
enemy monsters. Manual nature and talent selections continue to use their
existing state fields.

Clearing a PVP side resets the enemy preset to `durable`.

## Calculation Contract

All PVP stat and damage calculations must resolve the same effective nature and
talent values used by the race-stat indicators and note.

There must not be separate preset logic for display and calculation.

## Responsive Behavior

- Keep all three enemy preset buttons on one row at normal phone widths.
- Use equal-width buttons.
- Prevent text clipping and horizontal overflow.
- Do not add extra vertical whitespace to the compact PVP build section.

## Verification

Add focused regression coverage for:

- Initial enemy `最肉` preset.
- Mutually exclusive preset switching.
- An active preset remaining active while any field is empty.
- All preset buttons becoming inactive when nature and all talents are manual.
- Last preset returning when a manual field is cleared.
- Physical and special branches for `最速` and `最高攻击`.
- Physical branch on equal attack race stats.
- Manual values overriding preset values field by field.
- Shared effective-build resolution for displayed stats and calculations.
- Ally and enemy nature arrows and talent `＋` markers.
- Compact three-button desktop and mobile layout.
