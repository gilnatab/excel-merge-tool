# Spec: Reactive State

## Invariants

1. `state.sheetConfigsA` and `state.sheetConfigsB` are always arrays (never null). Length = workbook sheet count when workbook is loaded; empty array when no workbook.

2. `cfg.headers` and `cfg.data` are populated by calling `parseSheetWithOffset(wb.Sheets[cfg.name], cfg.headerRow)` whenever `cfg.checked === true` or `cfg.headerRow` changes. When `cfg.checked === false`, `cfg.headers = []` and `cfg.data = []`.

3. `selection.A.linkedKeyCol` is always a string that exists in the headers of the first checked A-sheet (when any checked sheet exists). If the first checked sheet changes or its headers change, `linkedKeyCol` is re-initialized to `checkedSheets[0].headers[0]` (or `''` if none).

4. `selection.A.linkedSelectedCols` is an array of strings, each of which exists in the headers of the first checked A-sheet. Re-initialized to `checkedSheets[0].headers.slice()` when sheet availability changes. The linked key col is always included and cannot be deselected.

5. `unmatchedSelection.A` and `unmatchedSelection.B` contain only valid integer indexes into `mergeResult.unmatchedA` and `mergeResult.unmatchedB` respectively. Reset to `[]` when `mergeResult` is updated.

6. `conflictResolutions` is reset to `{}` whenever `runMerge()` is called.

7. `ui.activeSteps` always contains `1`. Adding a step to this array enables it; removing disables it. Steps disabled by default: 2, 3, 4, 5.

## State Reset Rules (cascade)

| Trigger | Reset |
|---------|-------|
| File A uploaded | sheetConfigsA, all selection.A, headersA, dataA, mergeResult, conflictResolutions, unmatchedSelection |
| File B uploaded | sheetConfigsB, all selection.B, headersB, dataB, mergeResult, conflictResolutions, unmatchedSelection |
| Any sheet checkbox or headerRow changes | selection.A/B, headersA/B, dataA/B, mergeResult, conflictResolutions, unmatchedSelection |
| Key column changes | headersA/B, dataA/B, mergeResult, conflictResolutions, unmatchedSelection |
| runMerge() called | mergeResult replaced, conflictResolutions = {}, unmatchedSelection = {A:[], B:[]} |

## PBT Properties

- `sanitizeSheetName(s).length <= 31` for any string s (including empty, very long, special chars)
- `sanitizeSheetName(s)` never returns an empty string (fallback to '合并结果')
- `buildIndex(data, keyCol)`: every row with a non-empty trimmed key appears in `idx`; every row with empty/whitespace key appears in `emptyKeyRows`; no row appears in both
- `classifyMerge`: every A-row appears in exactly one of {matched, unmatchedA, conflicts}; every B-row in exactly one of {matched, unmatchedB, conflicts}
- `resolveColumnNames`: result[0].source === 'key'; no two entries have the same `.name`; every non-key A-col and every non-key B-col appears exactly once (with A_/B_ prefix if names conflict)
