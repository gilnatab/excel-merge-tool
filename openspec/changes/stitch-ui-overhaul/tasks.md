# Tasks: Stitch UI Overhaul

## Phase 1: Foundation

- [ ] 1.1 Create `src/components/AppIcon.vue` with 25 Material Symbols icon paths and `inheritAttrs:false` forwarding attrs to `<svg>`
- [ ] 1.2 Update `src/style.css`: replace existing `@theme` tokens with Precision Layer 16-token set + `--font-family-sans` + `@layer base { body { font-family } }`

## Phase 2: Shell + State

- [ ] 2.1 Rename `state.ui.activeTab` → `state.ui.activeView` in `src/composables/useAppState.js` (field declaration + all writes)
- [ ] 2.2 Extend `resetFromStep()` loop from `<= 5` to `<= 6`; add `state.ui.activeView = 'matched'` reset inside `if (n <= 5)` block
- [ ] 2.3 Update `runMerge()` in `useAppState.js`: add `enableStep(6)` after `enableStep(5)`; rename `activeTab` write to `activeView`
- [ ] 2.4 Add `resolveConflictByKey(key, action)` function to `useAppState.js`; export it
- [ ] 2.5 Add `resetAll()` function to `useAppState.js`; export it
- [ ] 2.6 Rewrite `src/App.vue`: 6-step shell with sticky header/footer layout, step indicator pill-connector design, new `stepLabels`, `v-for="n in 6"`, progress divisor `/5`
- [ ] 2.7 Make `nextStep()` async in `App.vue`; branch on `currentStep === 4` to call `await runMerge()` then advance; update `canGoNext` computed
- [ ] 2.8 Import and render `Step6Export.vue` in `App.vue`; wire `@reset` emit to `resetAll()` + `currentStep.value = 1`
- [ ] 2.9 Step 6 footer: show only `上一步` (no next CTA); remove dedicated Step 4 merge button block

## Phase 3: DataTable

- [ ] 3.1 Add `fullscreen`, `title`, `searchPlaceholder` props to `DataTable.vue`; add `close` emit
- [ ] 3.2 Add internal `search` ref + `filteredRows` computed (case-insensitive substring across all cols)
- [ ] 3.3 Watch `filteredRows.length` and `rows.length` to reset `currentPage` to 1
- [ ] 3.4 Render fullscreen shell via `<Teleport to="body">` when `fullscreen === true`: `fixed inset-0 z-50 bg-white flex flex-col` with header, close button, search, table, pagination

## Phase 4: Step Components 1–4

- [ ] 4.1 Restyle `Step1Upload.vue`: upload zone cards, success state with `task_alt` icon, info box with `info` icon; use `AppIcon`
- [ ] 4.2 Rewrite `Step2Sheets.vue` layout: left sheet list + right preview panel; add `selectedPreviewSheet` and `showFullscreen` local refs; wire DataTable fullscreen
- [ ] 4.3 Rewrite `Step3KeyCols.vue` layout: sidebar (`w-80`) + main panel (`flex-1`); `activeSheetIndex` local ref; sync-all toggle collapses sidebar
- [ ] 4.4 Rewrite `Step4MergeCols.vue`: two 500px fixed-height column panels with search, select-all, scrollable list, locked join key row; remove merge button

## Phase 5: Shared Subcomponent

- [ ] 5.1 Create `src/components/ExportSettings.vue`: four output option checkboxes + CSV-disabled warning; reads/writes `state.outputOptions` via inject

## Phase 6: Step 5 + Step 6

- [ ] 6.1 Rewrite `Step5Results.vue`: three stat cards replacing tab bar; update all `activeTab` → `activeView` bindings; use `resolveConflictByKey`
- [ ] 6.2 Add sidebar layout to `Step5Results.vue`: `flex gap-6` with `flex-1` main area and `w-64` `ExportSettings` sidebar
- [ ] 6.3 Implement matched view in `Step5Results.vue`: `DataTable` with `fullscreen` support
- [ ] 6.4 Implement unmatched view in `Step5Results.vue`: two side-by-side `DataTable` instances each with fullscreen expand
- [ ] 6.5 Implement conflicts view in `Step5Results.vue`: expandable conflict cards using `resolveConflictByKey`
- [ ] 6.6 Create `src/components/Step6Export.vue`: data summary card, confirmed export config list, Excel/CSV download buttons, reset button with `$emit('reset')`; use `ExportSettings` sidebar

## Phase 7: QA

- [ ] 7.1 Verify step gating: steps 5 and 6 only accessible after merge; upstream reset disables both
- [ ] 7.2 Verify fullscreen overlays: Step 2 and Step 5 fullscreen opens/closes correctly; state does not bleed between steps
- [ ] 7.3 Verify CSV disable: all four `outputOptions` flags each individually disable CSV button in both Step 5 and Step 6
- [ ] 7.4 Verify reset/rerun flows: Step 6 "处理另一个文件" returns to Step 1 with clean state; re-upload and re-merge succeeds
- [ ] 7.5 Verify conflict resolution by key: filter conflicts list, resolve filtered item, verify correct key resolved
- [ ] 7.6 Run `npm run build:single` and verify single-file output loads offline with no CDN requests
- [ ] 7.7 Run `npm run test:all` and verify all existing tests pass
