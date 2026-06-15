# 微信小程序维护与发布

## 工程位置

- 小程序包目录：`C:\codex-work\codex-lkwg-battle\lkwgwechat`
- 网页版入口：上级目录的 `..\index.html`
- 微信小程序入口：`miniprogram/app.json`
- 微信开发者工具项目目录：当前 `lkwgwechat` 目录
- 小程序代码根目录：`miniprogram/`
- AppID：由当前目录 `project.config.json` 管理
- 本机私有设置：`project.private.config.json`，已加入 `.gitignore`

网页版与小程序版相互独立。不要删除或替换 `index.html`。

## 首次打开或重新载入

1. 在微信开发者工具中关闭当前项目。
2. 重新导入 `C:\codex-work\codex-lkwg-battle\lkwgwechat`。
3. 确认项目类型为“小程序”。
4. 点击顶部“编译”。
5. 底部应出现 `队伍`、`分析`、`PVP` 三个 Tab。

如果仍提示根目录找不到 `app.json`，检查
`project.config.json` 是否包含：

```json
{
  "miniprogramRoot": "miniprogram/"
}
```

## 日常数据更新

上级目录的 `..\data\local-bundle.json` 是网页和小程序共同使用的权威数据源。

更新精灵、技能或特性后运行：

```powershell
node lkwgwechat/scripts/sync-miniprogram-data.js
node lkwgwechat/scripts/sync-miniprogram-pvp-rules.js
```

第一条命令生成小程序本地数据，第二条命令从 `index.html` 同步经过网页
测试的 PVP 纯规则。不要直接编辑以下生成文件：

- `miniprogram/data/local-bundle.js`
- `miniprogram/domain/generated/*.js`

提交前检查生成文件是否最新：

```powershell
node lkwgwechat/scripts/sync-miniprogram-data.js --check
node lkwgwechat/scripts/sync-miniprogram-pvp-rules.js --check
```

## 自动测试

运行全部回归测试：

```powershell
Get-ChildItem tests -Filter *.test.js |
  Sort-Object Name |
  ForEach-Object {
    node $_.FullName
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  }
```

小程序专项测试文件以 `tests/miniprogram-` 开头。现有网页测试也必须全部
通过，防止同步规则时破坏网页版。

## 模拟器与真机检查

每次上传前至少检查：

1. 三个 Tab 均可打开，无编译错误或空白页。
2. 队伍页可选择精灵、血脉、性格、三项天分和四个技能。
3. 关闭再打开小程序后，队伍配置仍存在。
4. 使用过山车、撤回和清空功能正常。
5. 分析页切换回来后会读取最新队伍。
6. PVP 双方配置、三种敌方预设、天气、增益和技能选择正常。
7. PVP 单段伤害、总伤害、技能描述和克制提示正常。
8. 清空队伍不会清空 PVP；清空 PVP 单侧不会影响另一侧。
9. 在至少一台真实手机上执行“预览”并检查滚动、选择器和按钮触摸区域。

## 开发者工具 CLI

如果官方 CLI 一直等待或超时：

1. 打开微信开发者工具的“设置”。
2. 找到“安全设置”。
3. 开启“服务端口”。
4. 重启微信开发者工具。

然后可以运行：

```powershell
& 'C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat' preview `
  --project 'C:\codex-work\codex-lkwg-battle\lkwgwechat'
```

CLI 不是发布必需条件；也可以直接使用开发者工具顶部的“预览”和“上传”。

## 上传与审核

确认自动测试、模拟器和真机检查均通过后：

1. 点击微信开发者工具顶部“上传”。
2. 使用递增版本号，例如 `1.0.0`、`1.0.1`。
3. 填写本次修改说明。
4. 登录微信公众平台。
5. 在“版本管理”中选择刚上传的开发版本。
6. 提交审核。
7. 审核通过后再发布。

不要在未完成真机检查时直接提交审核。隐藏的网页 `#admin` 数据管理功能
不属于小程序版本。
