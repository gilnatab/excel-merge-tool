# Spec: Step Components (1–6) + ExportSettings

## ExportSettings.vue (new shared subcomponent)

### Purpose
Single source of truth for the export options panel used in both Step 5 and Step 6.

### Interface
- No props
- Reads/writes `state.outputOptions` via `inject('appState')`
- Renders: `keepSheetOutput`, `extraSheetUnmatchedA`, `extraSheetUnmatchedB`, `extraSheetConflicts` checkboxes
- Shows CSV-disabled warning when any option is enabled that blocks CSV

---

## Step1Upload.vue

### Changes (restyle only)
- Upload zone cards: `rounded-2xl`, `bg-surface-container-low`, dashed border `border-2 border-dashed border-primary-fixed`
- Success state: emerald border `border-emerald-400`, `task_alt` icon instead of emoji
- Cloud upload icon via `<AppIcon name="cloud_upload" class="w-10 h-10 text-primary-container" />`
- Info box: `bg-surface-container` rounded card with `<AppIcon name="info" class="w-4 h-4" />`
- Behavior (drag-and-drop, file reset, `processFile`) unchanged

---

## Step2Sheets.vue

### Layout Change
Two-panel layout replacing current expand-per-row:
- Left panel: sheet list (checkboxes, sheet name, row count, headerRow input, preview button)
- Right panel: inline `DataTable` preview (20 rows, first selected sheet)
- Fullscreen preview: clicking expand button opens `DataTable` with `fullscreen=true` + `@close`

### State model
Add `selectedPreviewSheet` local ref (replaces per-row `cfg.previewOpen`):
```js
const selectedPreviewSheet = ref(null)  // { which: 'A'|'B', sheetName: string }
const showFullscreen = ref(false)
```
- Click preview on a sheet → set `selectedPreviewSheet`, update right panel
- Click fullscreen icon → set `showFullscreen = true`
- DataTable `@close` → `showFullscreen = false`

### Preserved behavior
`onSheetCheckChange()`, `onSheetStartRowChange()` logic unchanged.

---

## Step3KeyCols.vue

### Layout Change
Sidebar + main panel:
```
flex gap-6
├── aside w-80 shrink-0 (sidebar: sheet list)
└── section flex-1 (main: active config panel)
```

### Sidebar
- Lists all checked sheet pairs (A sheet ↔ B sheet)
- Each item shows: sheet names + config status badge (configured ✓ / unconfigured ○)
- Clicking sets `activeSheetIndex` local ref → renders that pair's config in main panel
- "+ 添加更多工作表映射" button only shown when more unchecked sheets exist

### Sync toggle
- `keyLinked` toggle in section header
- When ON: hide sidebar, show one global config panel (current simplified view)
- When OFF: show sidebar-driven per-sheet config (new behavior)

### Preserved behavior
All key column selection logic, `keyLinked` reactive wiring, column alignment preview — unchanged.

---

## Step4MergeCols.vue

### Layout Change
Two fixed-height column panels (500px height, internal scroll):
- Left panel: File A columns
- Right panel: File B columns
- Each panel: search input (`<AppIcon name="search" />`), select-all/deselect-all, scrollable checklist
- Join key row: locked (checkbox disabled), `<AppIcon name="lock" class="w-3.5 h-3.5 text-on-surface-variant/60" />` indicator
- Type badge: shown on hover (if column type info available)

### Removed
- "开始合并" button removed entirely — merge trigger is now in App.vue `nextStep()`

### Preserved behavior
Column selection state (`state.mergeColsA`, `state.mergeColsB`), select-all/deselect logic unchanged.

---

## Step5Results.vue

### Stat Cards (replaces tab bar)
Three clickable cards in a row at top:
- 已匹配: `mergeResult.matched.length`
- 未匹配: `mergeResult.unmatchedA.length + mergeResult.unmatchedB.length`
- 存在冲突: `mergeResult.conflicts.length`

Click → `state.ui.activeView = 'matched'|'unmatched'|'conflicts'`
Active card: `ring-2 ring-primary bg-surface-container-low`

### Layout
```
flex gap-6
├── main flex-1 (content area, switches by activeView)
└── aside w-64 shrink-0 (ExportSettings panel, sticky)
```

### Content Areas
- `matched`: `<DataTable>` with search + pagination + fullscreen expand
- `unmatched`: two side-by-side tables (only-in-A, only-in-B), each with search + fullscreen
- `conflicts`: expandable conflict cards (see below)

### Conflict Cards
- Resolve via `resolveConflictByKey(key, action)` (new composable function) — fixes current `ci` index bug
- Existing conflict expand/collapse, action buttons preserved
- Search filter on conflict keys

### Download shortcuts
Step 5 still shows download shortcuts (users may not proceed to Step 6). Both Steps 5 and 6 use `ExportSettings.vue` and the same download functions.

### Renamed
`state.ui.activeTab` → `state.ui.activeView` in all bindings.

---

## Step6Export.vue (new)

### Layout
```
flex gap-6
├── main flex-1
│   ├── Data summary card (total merged rows, total columns)
│   ├── Confirmed export config list (derived from outputOptions)
│   └── Download buttons (Excel primary, CSV secondary)
└── aside w-64 shrink-0 (ExportSettings, same component as Step5)
```

### Data Summary
- Total merged rows: `mergeResult.matched.length` + selected unmatched count
- Total columns: `mergeResult.outputCols.length`
- (Does not call `buildFinalOutput` — avoids expensive recompute)

### Download Buttons
- Excel: always enabled → calls `downloadExcel()`
- CSV: disabled when `csvDisabled` → calls `downloadCSV()`

### Reset Button
- "处理另一个文件" → `$emit('reset')` → App.vue calls `resetAll()`
- Shows warning text about data loss

### Emits
```js
emits: ['reset']
```

### State consumed
`mergeResult`, `outputOptions`, `unmatchedSelection`, `conflictResolutions`, `conflictKeys`, `sheetConfigsA`, `sheetConfigsB`, `ui.processing`

---

## PBT Properties (cross-step)

- `state.ui.activeView` domain: always ∈ `{'matched','unmatched','conflicts'}` after any operation
- CSV disabled invariant: `csvDisabled === (keepSheetOutput || extraUnmatchedA || extraUnmatchedB || extraConflicts)`
- Conflict resolution uses key not index: `resolveConflictByKey(key)` finds correct index even when list is filtered
- Step6Export reset: after `$emit('reset')` + `resetAll()`, `state.ui.activeSteps === [1]` and `currentStep === 1`
