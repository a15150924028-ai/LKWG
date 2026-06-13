# PVP Turn Simulator Design

## Scope

Build the PVP calculator into a turn simulator in independent, testable phases:

1. Repair local skill facts and remove invalid isolated records.
2. Replace the damage formula.
3. Add shared weather state and weather-colored controls.
4. Resolve action order, response relationships, energy, cooldowns, buffs, debuffs, and permanent changes.
5. Add turn settlement, history, undo, switching, and temporary-state cleanup.

Each phase must preserve the existing team editor and current PVP selection flow.

## Damage Formula

Calculate each hit as:

```text
ceil(
  attack / defense
  * 0.9
  * (base power * response multiplier + flat power additions)
  * ability level
  * power buff
  * same-type bonus
  * type effectiveness
  * weather multiplier
  * passive damage multiplier
  * skill damage multiplier
)
```

For multi-hit skills, round each hit up once and multiply by hit count.

Ability level is:

```text
(1 + own attack increases + enemy defense decreases)
/
(1 + own attack decreases + enemy defense increases)
```

The displayed stat values are the `attack` and `defense` inputs. Battle percentage changes only affect ability level.

Rules:

- Same-type bonus is `1.25`.
- Type effectiveness uses the existing multiplicative dual-type matrix.
- Flat power additions are inside the response parentheses.
- Percentage power buffs are additive with one another.
- Positive nonzero damage has a minimum of 1 after rounding; complete immunity is 0.
- Passive damage reduction is settled before skill damage reduction.
- Multiple reductions within the same layer add together.
- `无畏之心` calculates damage without its own 100% reduction, changes actual damage to 0, and heals that calculated amount.

## Response Rules

Response success is determined automatically from both selected skill categories.

- Response attacks settle damage before the responded status skill.
- If the target faints, its status skill does not settle.
- Response-added buffs and debuffs do not retroactively change the responded action.
- Response defense is passive and applies to all hits regardless of speed.
- Response-defense status skills settle before the defense skill.
- `芳香诱引` interrupts the defense skill; other response-defense status skills do not.
- Missing explicit response power multipliers default to `1`.
- `偷袭` response multiplier is `3`.
- `技巧打击` response multiplier is `10`.
- `原力冲击` response multiplier is `2.5`.
- `灾厄` uses multiplier `1` with a flat response power addition of `120`.

## Action Order

- Defense skills are passive and are not ordered by speed.
- A successful response is simultaneous for ordering purposes, but the response effect uses its defined settlement order.
- Otherwise compare priority, then speed, then randomize exact ties.
- `有效预防` grants priority `+1` for the next action only.
- Temporary "next attack" buffs expire after the next action even if that action is not an attack.

## Weather

Weather is shared by both sides and has no duration input.

- Rain: water skill power buff `+75%` for both sides.
- Sandstorm: ground skill energy cost `-2` for both sides, minimum 0.
- Blizzard: both non-ice active monsters receive 8 freeze layers; any monster with an ice type is immune.
- Weather effects end immediately when weather changes.
- Using `落雨`, `沙涌`, or `冬至` selects rain, sandstorm, or blizzard.

The weather control uses the corresponding local type icon and type color as the selected background.

## Persistent And Temporary State

- Effects explicitly described as permanent survive switching.
- Ordinary buffs, debuffs, and temporary energy-cost changes clear after switching away and back.
- Skill-owned permanent power, hit-count, and energy-cost changes survive switching.
- `镜像反射` permanently becomes the responded attack skill, copying its base type, category, power, energy cost, description, and response rules, but not the opponent's accumulated permanent modifications.
- Ordinary monsters have energy range 0-10.
- Monsters with an explicit energy-cap-breaking passive have no upper limit.
- All defense skills normally enter one round of cooldown after use.
- `壁垒` removes that cooldown when its response succeeds.
- `破防` makes the responded defense unavailable for the next two rounds; this replaces rather than stacks with the normal defense cooldown.

## Data Policy

- Read skill facts only from rendered public pages, not site APIs.
- Store only local skill facts and simulator rules; do not embed remote scripts, markup, or asset links.
- Do not invent missing descriptions when a rendered detail page cannot be verified.
- Remove confirmed invalid isolated skills: `水星水`, `冰荆棘`, `冰刺`, and `极速冷冻`.
