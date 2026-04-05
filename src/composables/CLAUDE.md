[根目录](../../CLAUDE.md) > [src](../) > **composables**

# composables — useAppState.js

## 模块职责

集中管理应用全局状态与所有业务逻辑。`App.vue` 调用 `useAppState()` 后通过 `provide('appState', ...)` 注入，所有 Step 组件及 `CollapsibleExportSettings` 通过 `inject('appState')` 获取。

**不使用 Pinia/Vuex**。状态对象 `state` 以模块级 `reactive({})` 定义（单例），整个应用生命周期内唯一。

---

## 入口

```
src/composables/useAppState.js
```

导出函数：`useAppState()` — 返回 state 对象及所有操作函数。

---

## 状态结构

```
state
├── workbookA / workbookB          — SheetJS Workbook 对象
├── filenameA / filenameB          — 上传文件的原始文件名
├── sheetConfigsA / sheetConfigsB  — SheetConfig[] 每张工作表的配置
│   └── { name, checked, headerRow, headers, data, keyCol, selectedCols, previewOpen, headerHint }
├── selection.A / selection.B      — 联动/独立模式的列选择状态
│   └── { keyLinked, colsLinked, linkedKeyCol, linkedSelectedCols, colSearch, perSheetColSearch }
├── headersA / headersB            — 合并后的列头数组（combineSheetData 输出）
├── dataA / dataB                  — 合并后的行数据数组
├── mergeResult                    — classifyMerge 的返回值（null 表示未合并）
│   └── { matched, unmatchedA, unmatchedB, conflicts, outputCols, colsA, colsB, keyColA, keyColB }
├── conflictResolutions            — { [key]: 'all' | 'first' | 'remove' }
├── conflictKeys                   — conflicts 的键数组（用于数字索引）
├── unmatchedSelection             — { A: number[], B: number[] } 已勾选纳入输出的行索引
├── outputOptions                  — { keepSheetOutput, extraSheetUnmatchedA, extraSheetUnmatchedB, extraSheetConflicts }
└── ui                             — { activeView, activeSteps: number[], processing, conflictSearch, exportSettingsCollapsed }
```

`ui.activeView`：当前 Step5 显示的视图，值为 `'matched' | 'unmatched' | 'conflicts'`。

`ui.exportSettingsCollapsed`：导出设置面板的折叠状态，初始为 `false`（展开）；Step5 和 Step6 的 `CollapsibleExportSettings` 共享此状态，步骤间保持同步。

---

## 导出的操作函数

| 函数 | 触发场景 | 副作用 |
|------|----------|--------|
| `handleFileUpload(which, file)` | 文件选择/拖拽 | 读取文件 → 解析 workbook → `loadSheetConfigs` → `checkEnableSteps` |
| `resetFile(which)` | 点击"重新上传" | 清空对应侧的 workbook / filename / sheetConfigs，调用 `resetFromStep(2)` |
| `loadSheetConfigs(which)` | 内部，文件加载后 | 为 workbook 的每张 sheet 创建 SheetConfig，调用 `refreshSheetData` |
| `refreshSheetData(which)` | 内部，配置变更后 | 重新解析已勾选 sheet 的数据，重置联动键列 |
| `onSheetCheckChange(which, idx, checked)` | Step2 复选框 | 更新 `cfg.checked`，重置步骤 3+ |
| `onSheetStartRowChange(which, idx, value)` | Step2 起始行输入 | 更新 `cfg.headerRow`，重新解析，重置步骤 3+ |
| `onKeyColChange()` | Step3 键列变更 | 强制键列包含于 selectedCols，重置步骤 4+ |
| `toggleKeyLinked(which)` | Step3 联动切换 | 切换 `keyLinked`，同步 `colsLinked` |
| `toggleColsLinked(which)` | Step4 联动切换 | 切换 `colsLinked` |
| `runMerge()` | Step4 "开始合并" | async；设置 `processing=true`，调用 `combineSheetData` + `classifyMerge`，写入 `mergeResult`，启用 Step5/6 |
| `resolveConflict(ci, action)` | Step5 单个冲突（按数字索引） | 按 `conflictKeys[ci]` 写入 `conflictResolutions` |
| `resolveConflictByKey(key, action)` | Step5 单个冲突（按键值） | 直接写入 `conflictResolutions[key]` |
| `resolveAllConflicts(action)` | Step5 批量操作 | 批量调用 `resolveConflict` |
| `resetAll()` | Step6 "重新开始" | 重置全部状态，包括 outputOptions 和 exportSettingsCollapsed |
| `downloadExcel()` | Step6 下载按钮 | 调用 `buildFinalOutput`，按 outputOptions 构建多 sheet XLSX |
| `downloadCSV()` | Step6 下载按钮 | 调用 `buildFinalOutput`，转为带 BOM 的 CSV Blob 下载 |

---

## 步骤激活规则

- 步骤通过 `state.ui.activeSteps: number[]` 控制可点击性
- 初始只有 `[1]` 激活
- 两侧文件都上传且有可用 sheet 后：激活 2、3、4
- 执行合并后：激活 5、6
- 任何"上游"变更（sheet 勾选、键列）都会调用 `resetFromStep(n)` 清除下游步骤

---

## 关键函数（来自 utils/excel.js）

依赖 `src/utils/excel.js` 提供的纯函数，参见 [utils CLAUDE.md](../utils/CLAUDE.md)。

---

## 变更记录 (Changelog)

| 日期 | 说明 |
|------|------|
| 2026-04-05 | 新增 Step6 导出步骤；`ui.activeTab` 改为 `ui.activeView`；新增 `ui.exportSettingsCollapsed`；新增 `resolveConflictByKey`、`resetAll` |
| 2026-04-04 | 初版，自动扫描生成 |
