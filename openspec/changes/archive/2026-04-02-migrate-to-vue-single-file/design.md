# Design: Migrate Excel Merge Tool to Vue 3 (Single-File Build)

## Architecture Overview

```
index.html  ──→  src/main.js  ──→  App.vue
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
         useAppState.js       src/utils/excel.js      src/style.css
         (reactive state)     (pure functions)         (global CSS)
              │
    ┌─────────┼──────────────────────┐
    │         │         │            │
Step1     Step2      Step3         Step4       Step5
Upload    Sheets     KeyCols       MergeCols   Results
```

## Build Modes

Two build commands produce two different outputs:

| Command | Config | Output | Use |
|---------|--------|--------|-----|
| `npm run dev` | `vite.config.js` | Dev server + HMR | Development |
| `npm run build` | `vite.config.js` | `dist/` (multi-chunk) | Normal distribution |
| `npm run build:single` | `vite.single.config.js` | `dist-single/index.html` | Easy sharing (one file) |

## Reactive State Shape

Defined in `src/composables/useAppState.js` as `reactive()`:

```js
{
  // Step 1: uploaded workbooks (SheetJS workbook objects)
  workbookA: null,
  workbookB: null,

  // Step 2: per-sheet config arrays (one entry per sheet in the workbook)
  sheetConfigsA: [
    // { name, checked, headerRow, headers, data, keyCol, selectedCols, previewOpen, headerHint }
  ],
  sheetConfigsB: [],

  // Step 3 & 4: per-side selection (replaces all DOM reads)
  selection: {
    A: {
      keyLinked: true,           // linked mode for key column
      colsLinked: true,          // linked mode for merge columns
      linkedKeyCol: '',          // key col name used in linked mode
      linkedSelectedCols: [],    // selected col names in linked mode
      colSearch: '',             // search box value (linked mode)
      perSheetColSearch: {},     // { [sheetIdx]: string } (per-sheet mode)
    },
    B: {
      keyLinked: true,
      colsLinked: true,
      linkedKeyCol: '',
      linkedSelectedCols: [],
      colSearch: '',
      perSheetColSearch: {},
    }
  },

  // Derived: combined header+data arrays (computed by combineSheetData)
  headersA: [],
  headersB: [],
  dataA: [],
  dataB: [],

  // Step 5: merge result
  mergeResult: null,         // { matched, unmatchedA, unmatchedB, conflicts, outputCols, colsA, colsB, keyColA, keyColB }
  conflictResolutions: {},   // { [keyValue]: 'all' | 'first' | 'remove' }
  conflictKeys: [],          // ordered array of conflict key values

  // Step 5: unmatched row checkbox selection (replaces DOM queries)
  unmatchedSelection: {
    A: [],   // array of row indexes (from mergeResult.unmatchedA) that are checked
    B: [],
  },

  // Step 5: download output options (replaces DOM checkbox reads)
  outputOptions: {
    keepSheetOutput: false,
    extraSheetUnmatchedA: false,
    extraSheetUnmatchedB: false,
    extraSheetConflicts: false,
  },

  // UI state
  ui: {
    activeTab: 'matched',  // 'matched' | 'unmatched' | 'conflicts'
    activeSteps: [1],      // which step numbers are enabled (not disabled)
  }
}
```

## Component Responsibility

### App.vue
- Renders all 5 steps in sequence
- Controls `step.disabled` appearance via `ui.activeSteps`
- Provides `useAppState()` via `provide()` so all children can `inject()`

### Step1Upload.vue
- Two drag-drop upload areas (File A and File B)
- On file load: calls `XLSX.read()`, updates `state.workbookA/B`
- On file reset: clears workbook + downstream state
- Triggers step 2 enable when both workbooks are loaded

### Step2Sheets.vue
- Renders checkboxes + start-row inputs + preview toggle for each sheet
- On change: updates `state.sheetConfigsA/B[idx].checked / headerRow`
- Calls `parseSheetWithOffset()` to populate `cfg.headers` and `cfg.data`
- Triggers step 3 enable when at least one sheet each side has headers

### Step3KeyCols.vue
- Renders linked or per-sheet key column dropdowns
- Updates `state.selection.A/B.linkedKeyCol` or `cfg.keyCol` per sheet
- Toggle linked/per-sheet: updates `keyLinked`; re-initializes `linkedKeyCol` from first checked sheet's headers
- Triggers step 4 enable

### Step4MergeCols.vue
- Renders linked or per-sheet column checkbox lists with search
- Updates `state.selection.A/B.linkedSelectedCols` or `cfg.selectedCols`
- Toggle linked/per-sheet: updates `colsLinked`
- "Start Merge" button calls `runMerge()` → triggers step 5 enable

### Step5Results.vue
- Three tabs: matched / unmatched / conflicts
- Unmatched tab: renders checkboxes bound to `state.unmatchedSelection.A/B` arrays
- Conflicts tab: renders conflict groups; action buttons update `state.conflictResolutions`
- Download section: checkboxes bound to `state.outputOptions.*`
- Download buttons call `downloadExcel()` / `downloadCSV()` (still read from state, not DOM)

## combineSheetData() Refactored Signature

The old DOM-reading version is replaced by a state-reading version:

```js
// src/utils/excel.js (NEW — pure, no DOM)
export function combineSheetData(which, sheetConfigs, selection) {
  // sheetConfigs: state.sheetConfigsA or state.sheetConfigsB
  // selection: state.selection.A or state.selection.B
  // returns: { headers, data }
}
```

Called from a composable action in `useAppState.js`:
```js
function runMerge() {
  const { headers: hA, data: dA } = combineSheetData('A', state.sheetConfigsA, state.selection.A);
  const { headers: hB, data: dB } = combineSheetData('B', state.sheetConfigsB, state.selection.B);
  // ...
}
```

## buildFinalOutput() Refactored Signature

```js
// src/utils/excel.js (NEW — pure, no DOM)
export function buildFinalOutput(mergeResult, unmatchedSelection, conflictResolutions, conflictKeys) {
  // unmatchedSelection: { A: [idx, ...], B: [idx, ...] }
  // conflictResolutions: { [key]: 'all'|'first'|'remove' }
  // conflictKeys: [key, ...]
}
```

## CSS Strategy

- Copy existing inline `<style>` verbatim into `src/style.css`
- Import globally in `src/main.js`: `import './style.css'`
- No scoped CSS on components — the existing CSS is already specific enough
- No CSS preprocessor

## File Structure

```
excel-merge-tool/
  src/
    main.js
    style.css
    App.vue
    components/
      Step1Upload.vue
      Step2Sheets.vue
      Step3KeyCols.vue
      Step4MergeCols.vue
      Step5Results.vue
    composables/
      useAppState.js
    utils/
      excel.js
  index.html
  vite.config.js
  vite.single.config.js
  package.json
  test/
    core.test.js          (converted to ESM imports)
  openspec/
    ...
```

## vite.config.js (normal)

```js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
});
```

## vite.single.config.js (single-file)

```js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [vue(), viteSingleFile()],
  build: {
    outDir: 'dist-single',
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    sourcemap: false,
    reportCompressedSize: false,
  },
});
```

## package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:single": "vite build --config vite.single.config.js",
    "test": "node --test test/core.test.js"
  }
}
```
