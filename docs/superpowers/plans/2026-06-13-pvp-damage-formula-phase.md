# PVP Damage Formula Phase

## Goal

Replace the current PVP damage estimate with the confirmed per-hit formula while preserving the existing editor, skill selection, passive parsing, and result UI.

## Steps

1. Add a standalone regression test for the damage core and ability-level calculation.
2. Add a pure browser/Node-compatible damage module to `index.html`.
3. Feed displayed stats, additive percentage buffs, response power, flat power additions, type effectiveness, same-type bonus, passive reduction, and skill reduction into the module.
4. Keep weather at multiplier `1` until the weather phase.
5. Run focused PVP tests, the complete static suite, inline-script parsing, and browser verification.

## Acceptance

- Each hit uses `Math.ceil`, then multi-hit damage multiplies the rounded hit.
- Battle percentage stat changes affect ability level rather than displayed attack/defense.
- Response multipliers do not multiply flat power additions.
- Percentage power buffs add before becoming one multiplier.
- Complete immunity returns `0`; other positive results have a minimum of `1`.
- Force Impact response uses a `2.5` base-power multiplier rather than multiplying final damage.
