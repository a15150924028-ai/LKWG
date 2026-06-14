# 棋契陛下八形态实施计划

> **For Codex:** Use the executing-plans workflow and complete each task with test-first verification.

**Goal:** 将本地合并的棋契陛下拆成八个独立最终形态，并为棋绮后两种终形态接入 PVP 渗透层数效果。

**Architecture:** 保持现有单文件静态应用与本地 JSON 数据结构不变。通过数据迁移创建八个独立怪物记录和八条进化链；PVP 继续使用现有特性规则表，仅按最终形态名称区分 5% 渗透和原有 10% 御驾亲征层数效果。

**Tech Stack:** HTML/CSS/JavaScript、JSON、Node.js 静态回归测试。

---

### Task 1: 锁定八形态数据契约

**Files:**
- Create: `tests/chess-emperor-variants-static.test.js`
- Modify: `tests/local-bundle-evolution-static.test.js`

1. 编写失败测试，要求存在八个指定名称的最终形态。
2. 断言旧的单一 `棋契陛下` 记录已删除。
3. 断言八组种族值、八个唯一 ID、八个独立 `skillIds` 数组和八个独立进化链。
4. 断言第二、三、四条白黑技能池当前内容相同，但对应怪物记录保持独立。
5. 运行测试并确认在数据修改前失败。

### Task 2: 迁移本地怪物数据

**Files:**
- Modify: `data/local-bundle.json`

1. 将渲染页面确认的技能名称映射到现有技能 ID。
2. 删除旧的合并记录 `monster-棋契陛下`。
3. 创建八个最终形态记录，写入对应种族值、独立技能数组和御驾亲征特性。
4. 将棋棋与四组中间形态更新为八条独立进化链。
5. 运行八形态和进化链测试并确认通过。

### Task 3: 接入棋绮后终形态渗透

**Files:**
- Modify: `tests/pvp-hero-trait-display-static.test.js`
- Modify: `index.html`

1. 先扩展失败测试，要求棋绮后白子和黑子终形态每层双攻双防增加 5%。
2. 同时锁定其余六个终形态继续使用原有 10% 层数规则。
3. 更新 PVP 特性规则表，按精确最终形态名称分流。
4. 运行 PVP 特性测试并确认通过。

### Task 4: 完整验证与发布

**Files:**
- Modify: `AGENTS.md`

1. 运行全部 Node 静态测试。
2. 解析 `index.html` 的所有内联脚本。
3. 运行 `git diff --check` 并检查工作区，只暂存本任务文件。
4. 追加 Development Work Log，记录数据来源方式、变更和验证结果。
5. 提交到 `main` 并推送 `origin/main`。
