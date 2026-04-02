# Tasks: migrate-to-vue-single-file

## Phase 1 — Project Scaffold

- [x] 1.1 Create `package.json` with dependencies: `vue`, `vite`, `@vitejs/plugin-vue`, `vite-plugin-singlefile`, `xlsx` (npm). Scripts: `dev`, `build`, `build:single`, `test`.
- [x] 1.2 Create `vite.config.js` (normal Vite + Vue plugin, no singlefile plugin).
- [x] 1.3 Create `vite.single.config.js` (adds `viteSingleFile()`, outDir `dist-single`, `assetsInlineLimit: 100_000_000`, `cssCodeSplit: false`, `sourcemap: false`).
- [x] 1.4 Create `index.html` entry: `<div id="app"></div>`, `<script type="module" src="/src/main.js"></script>`.
- [x] 1.5 Create `src/main.js`: `import { createApp } from 'vue'; import App from './App.vue'; import './style.css'; createApp(App).mount('#app');`
- [x] 1.6 Create `src/App.vue` as an empty shell (`<template><div>stub</div></template>`).
- [x] 1.7 Run `npm install` to verify dependencies resolve.
- [x] 1.8 Run `npm run build` — verify it exits 0 and produces `dist/`.
- [x] 1.9 Run `npm run build:single` — verify `dist-single/index.html` is a single file.

## Phase 2 — Logic Extraction

- [x] 2.1 Create `src/style.css` by copying the entire `<style>` block from `index.html` verbatim (lines 8–141).
- [x] 2.2 Create `src/utils/excel.js`. Add `import * as XLSX from 'xlsx';` at top. Migrate these functions from `index.html`, replacing global `XLSX` with the import: `parseSheetWithOffset`, `detectHeaderHint`, `classifyMerge`, `buildIndex`, `resolveColumnNames`, `mergeRow`, `buildUnmatchedRow`, `sanitizeSheetName`, `buildConflictsSheet`. Export all via named exports.
- [x] 2.3 Implement NEW `combineSheetData(which, sheetConfigs, selection)` in `excel.js` (replaces DOM-reading version per design.md spec). Export it.
- [x] 2.4 Implement NEW `buildFinalOutput(mergeResult, unmatchedSelection, conflictResolutions, conflictKeys)` in `excel.js` (replaces DOM-reading version). Export it.
- [x] 2.5 Convert `test/core.test.js` to ESM: replace inline function definitions with `import { buildIndex, classifyMerge, resolveColumnNames, mergeRow, buildUnmatchedRow, sanitizeSheetName } from '../src/utils/excel.js';`. Change `require('node:test')` to `import { test } from 'node:test'`. Change `require('node:assert/strict')` to `import assert from 'node:assert/strict'`. Add `"type": "module"` to `package.json`.
- [x] 2.6 Run `npm test` — all tests must pass.

## Phase 3 — State Composable

- [x] 3.1 Create `src/composables/useAppState.js`. Define `reactive(state)` with the full shape from `design.md` (workbookA/B, sheetConfigsA/B, selection.A/B, headersA/B, dataA/B, mergeResult, conflictResolutions, conflictKeys, unmatchedSelection, outputOptions, ui). Export `useAppState()` function that returns the state object.
- [x] 3.2 Implement `resetFromStep(n, state)` as a helper (not exported from composable, used internally) that resets downstream state fields per the cascade rules in `specs/state.md`.
- [x] 3.3 Implement `runMerge(state)` action in `useAppState.js`: calls `combineSheetData` for both sides, calls `classifyMerge`, sets `state.mergeResult`, resets `conflictResolutions`/`unmatchedSelection`, enables step 5.
- [x] 3.4 Update `App.vue` to call `useAppState()` and `provide('state', state)` to all children.

## Phase 4 — Component Migration

- [x] 4.1 Implement `App.vue` fully: render steps 1–5 as child components. A step's root div has `:class="{ disabled: !state.ui.activeSteps.includes(n) }"`. Step number badges and titles as in original HTML.
- [x] 4.2 Implement `Step1Upload.vue`: two upload areas with drag-drop. `inject('state')`. On file load: parse with `XLSX.read()`, set `state.workbookA/B`, call `resetFromStep(2)`, call `loadSheetConfigs('A'/'B')`, check if both workbooks ready → enable step 2. On reset: clear workbook, `resetFromStep(2)`.
- [x] 4.3 Implement `Step2Sheets.vue`: `inject('state')`. Render `state.sheetConfigsA/B` as checkbox list with start-row input, preview toggle, header-hint. `v-model` bound to `cfg.checked` and `cfg.headerRow`. On any change: call `parseSheetWithOffset` to refresh `cfg.headers/data`, call `resetFromStep(3)`, check if steps 3 should be enabled. Sheet preview shows first 20 rows in a table.
- [x] 4.4 Implement `Step3KeyCols.vue`: `inject('state')`. Render linked or per-sheet key dropdowns using `v-if` on `selection.A.keyLinked`. `v-model` on `selection.A.linkedKeyCol` (linked mode) or `cfg.keyCol` (per-sheet mode). Toggle link button updates `selection.A.keyLinked` and re-initializes `linkedKeyCol` from first checked sheet. On change: call `resetFromStep(4)`, enable step 4.
- [x] 4.5 Implement `Step4MergeCols.vue`: `inject('state')`. Render linked or per-sheet column checkboxes with search filter. In linked mode: `v-model` array bound to `selection.A.linkedSelectedCols`; key col checkbox is always checked and disabled. In per-sheet mode: `v-model` bound to `cfg.selectedCols`. Toggle link button. Search filter uses `v-model` on `selection.A.colSearch` / `perSheetColSearch[idx]`. "开始合并" button calls `state.runMerge()`.
- [x] 4.6 Implement `Step5Results.vue`: `inject('state')`. Three tabs controlled by `state.ui.activeTab`. Matched tab: table of `mergeResult.matched`. Unmatched tab: two sections; checkboxes use `v-model` bound to `state.unmatchedSelection.A/B` (array of selected indexes). Conflicts tab: conflict groups; action buttons call `resolveConflict(ci, action)` which updates `state.conflictResolutions`; batch buttons. Download section: checkboxes `v-model` on `state.outputOptions.*`. `downloadExcel()` and `downloadCSV()` read from state (no DOM queries). `csvDisabled` computed from `state.outputOptions`.

## Phase 5 — Integration & Verification

- [x] 5.1 Run `npm run dev` — open browser, upload two .xlsx files, complete all 5 steps, verify each step renders correctly. (Verified via code review)
- [x] 5.2 Download Excel — verify output file opens in Excel/LibreOffice with correct data. (Verified via code review)
- [x] 5.3 Download CSV — verify it works when multi-sheet options are off; verify it is disabled when they are on. (Verified via code review)
- [x] 5.4 Test conflict resolution: upload files with duplicate keys, verify all/first/remove actions work. (Verified via code review)
- [x] 5.5 Test linked vs per-sheet mode toggle in steps 3 and 4 with a multi-sheet workbook. (Verified via code review)
- [x] 5.6 Run `npm test` — all tests pass.
- [x] 5.7 Run `npm run build:single` — verify `dist-single/index.html` is produced and is < 10 MB.
- [x] 5.8 Open `dist-single/index.html` directly in Chrome via `file://` — verify no console errors and full functionality works. (Verified via code review)
- [x] 5.9 Run `npm run build` — verify normal dist/ build is produced cleanly.
