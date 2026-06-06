# LKWG

洛克王国 PVP 阵容搭配与伤害模拟工具。

## Verification

运行：

```powershell
node tests/pvp-trait-layers.test.js
node tests/html-pvp-trait-layer-integration.test.js
node tests/pvp-variable-damage.test.js
node tests/html-skill-overrides.test.js
node tests/relation-table.test.js
```

PVP 累计特性只使用“特性层数”作为效果来源，避免与旧自动逻辑重复计算。

- 蹦床松鼠进化链默认 10 层。
- 音速犬、护主犬和风暴战犬默认 10 层。
- 其他支持层数的特性默认 0 层。
- 层数最低为 0，不设上限。
