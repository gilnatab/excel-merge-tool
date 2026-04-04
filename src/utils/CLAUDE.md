[根目录](../../CLAUDE.md) > [src](../) > **utils**

# utils — excel.js

## 模块职责

所有纯函数。不依赖 Vue 响应式系统，不访问 DOM，无副作用。可在 Node.js 环境直接单元测试（`test/core.test.js`）。

---

## 入口

```
src/utils/excel.js
```

---

## 导出函数一览

### Sheet 解析

| 函数 | 签名 | 说明 |
|------|------|------|
| `parseSheetWithOffset` | `(sheet, startRow) → { headers, data }` | 按 1-indexed 起始行解析工作表；过滤全空行；跳过空表头列 |
| `detectHeaderHint` | `(sheet, headerRow) → { suggestedRow } \| null` | 检测合并标题行；当 row1 稀疏而 row2+ 更稠密时给出建议起始行 |

### 索引与列名

| 函数 | 签名 | 说明 |
|------|------|------|
| `buildIndex` | `(data, keyCol) → { idx: Map, emptyKeyRows }` | 按键列建立索引；空/空白键值归入 emptyKeyRows |
| `resolveColumnNames` | `(colsA, colsB, keyColA, keyColB) → OutputCol[]` | 解析输出列名；键列优先；同名列加 `A_`/`B_` 前缀；去重后缀加数字 |

`OutputCol` 结构：`{ name: string, source: 'key' | 'keyB' | 'A' | 'B', original?: string }`

### 合并核心

| 函数 | 签名 | 说明 |
|------|------|------|
| `classifyMerge` | `(dataA, dataB, keyColA, keyColB, colsA, colsB) → MergeResult` | 将两组数据分类为 matched / unmatchedA / unmatchedB / conflicts |
| `mergeRow` | `(rowA, rowB, outputCols, keyColA, keyColB) → row` | 生成一条合并输出行；传递 `__sheet__` 来源标记 |
| `buildUnmatchedRow` | `(row, which, outputCols, keyColA, keyColB, keyValue) → row` | 生成未匹配行；对侧字段填空字符串 |
| `combineSheetData` | `(sheetConfigs, selection) → { headers, data }` | 多 sheet 合并：取选定列的并集；附加 `__sheet__` 字段 |
| `buildFinalOutput` | `(mergeResult, unmatchedSelection, conflictResolutions, conflictKeys) → row[]` | 组装最终输出：matched + 已勾选 unmatched + 已解决 conflicts |

### 输出辅助

| 函数 | 签名 | 说明 |
|------|------|------|
| `buildConflictsSheet` | `(mergeResult) → SheetJS Worksheet` | 生成冲突数据 Sheet；对 `_键值` 列按冲突组使用 `!merges` 合并单元格 |
| `sanitizeSheetName` | `(name) → string` | 去除 Excel Sheet 名非法字符 `/ \ ? * [ ] :`；截断至 31 字符 |

---

## MergeResult 数据结构

```js
{
  matched: row[],         // 1:1 匹配行（已合并）
  unmatchedA: [{ _key, _row }],  // 仅在 A 中出现
  unmatchedB: [{ _key, _row }],  // 仅在 B 中出现
  conflicts: {            // N:M 重复键，key → { rowsA, rowsB }
    [key]: { rowsA: row[], rowsB: row[] }
  },
  outputCols: OutputCol[],
  colsA: string[],        // A 侧实际输出的列名
  colsB: string[],        // B 侧实际输出的列名
  keyColA: string,
  keyColB: string,
}
```

---

## 关键行为约定

1. **空键处理**：`String(value).trim() === ''` 的行不参与键匹配，直接进入 unmatchedA/B
2. **列并集**：`combineSheetData` 对所有已勾选 sheet 的 selectedCols 取并集；不在本 sheet 中的列填 `''`
3. **键列不可取消选择**：在 `combineSheetData` 和 `refreshSheetData` 中强制保证 keyCol 始终在 selectedCols 内
4. **冲突默认策略**：`buildFinalOutput` 对未显式设置 resolution 的冲突键默认采用 `'first'`（保留首条）
5. **`__sheet__` 字段**：仅用于内部路由分组，在 `downloadExcel` / `downloadCSV` 写出前通过解构剔除

---

## 测试覆盖

单元测试：`test/core.test.js` — 覆盖 `buildIndex`、`resolveColumnNames`、`mergeRow`、`buildUnmatchedRow`、`classifyMerge`、`sanitizeSheetName`、`buildFinalOutput`。

集成测试：`test/integration.test.js` — 使用真实 xlsx/csv fixture 文件测试端到端解析与合并流程。

---

## 变更记录 (Changelog)

| 日期 | 说明 |
|------|------|
| 2026-04-04 | 初版，自动扫描生成 |
