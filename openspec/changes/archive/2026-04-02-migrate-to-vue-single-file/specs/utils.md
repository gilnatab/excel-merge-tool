# Spec: src/utils/excel.js

## Exported Functions (identical signatures to current vanilla JS, except DOM-free)

### parseSheetWithOffset(sheet, startRow)
- `sheet`: SheetJS worksheet object
- `startRow`: 1-indexed integer
- Returns `{ headers: string[], data: object[] }`
- Rows that are entirely empty strings/whitespace are filtered out
- Non-empty column names only; blank header cells are skipped

### detectHeaderHint(sheet, headerRow)
- Returns `{ suggestedRow: number }` if row 1 looks like a title (merged cells or sparse), else `null`

### classifyMerge(dataA, dataB, keyColA, keyColB, colsA, colsB)
- Returns `{ matched, unmatchedA, unmatchedB, conflicts, outputCols, colsA, colsB, keyColA, keyColB }`
- Delegates to `buildIndex`, `resolveColumnNames`, `mergeRow`

### buildIndex(data, keyCol)
- Returns `{ idx: Map<string, row[]>, emptyKeyRows: row[] }`
- Key comparison: `String(row[keyCol] ?? '').trim()`

### resolveColumnNames(colsA, colsB, keyColA, keyColB)
- Returns `Array<{ name: string, source: 'key'|'A'|'B', original?: string }>`
- Name collision between A and B non-key cols → prefix A_, B_

### mergeRow(rowA, rowB, outputCols, keyColA, keyColB)
- Returns output row object; carries `__sheet__` from rowA

### buildUnmatchedRow(row, which, outputCols, keyColA, keyColB, keyValue)
- Returns output row with blanks for opposite-side columns

### combineSheetData(sheetConfigs, selection)
- **NEW SIGNATURE** — replaces DOM-reading version
- `sheetConfigs`: state.sheetConfigsA or state.sheetConfigsB (caller selects the side)
- `selection`: state.selection.A or state.selection.B
- Returns `{ headers: string[], data: object[] }`
- Applies linked/per-sheet key and column selection from `selection`
- Each combined row carries `__sheet__` field

### buildFinalOutput(mergeResult, unmatchedSelection, conflictResolutions, conflictKeys)
- **NEW SIGNATURE** — replaces DOM-reading version
- `unmatchedSelection`: `{ A: number[], B: number[] }` (row indexes)
- Returns array of output rows (with `__sheet__`)

### buildConflictsSheet(r)
- `r`: mergeResult
- Returns SheetJS worksheet with `!merges` for grouped conflict rows

### sanitizeSheetName(name)
- Returns string, max 31 chars, invalid Excel sheet chars replaced with `_`, fallback `'合并结果'`

## SheetJS Dependency

```js
import * as XLSX from 'xlsx';
```

This replaces the global `XLSX` from the CDN/local file. All functions that currently use `XLSX` must use this import.

## Functions NOT in utils/excel.js

These remain in Vue components or composables (they need Vue/state context):
- `downloadExcel()` — needs `state.outputOptions`, calls `XLSX.writeFile()`
- `downloadCSV()` — similar
- `updateCsvState()` — derived from `state.outputOptions` (computed property in component)
- All render/DOM functions (they become Vue templates)
