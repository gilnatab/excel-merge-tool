# Proposal: Migrate Excel Merge Tool to Vue 3 (Single-File Build)

## Enhanced Requirement

Migrate the Excel merge tool from a vanilla-JS monolithic HTML file to a Vue 3 component-based architecture, while preserving the ability to distribute the result as a single self-contained HTML file (no server, no CDN, works offline).

---

## Codebase Snapshot

| Dimension | Current State |
|-----------|---------------|
| Entry | `index.html` — 1338 lines, single file |
| CSS | ~140 lines inline `<style>` |
| HTML template | ~120 lines inline markup |
| Business logic | ~1000 lines vanilla JS (global `state` object + DOM mutation) |
| External dep | `xlsx.full.min.js` (local copy of SheetJS, ~2.5 MB) |
| Build tooling | None |
| Tests | `test/core.test.js` (Node.js, tests pure functions) |

Key functions that contain pure logic (no DOM): `parseSheetWithOffset`, `classifyMerge`, `buildIndex`, `resolveColumnNames`, `mergeRow`, `buildUnmatchedRow`, `buildFinalOutput`, `buildConflictsSheet`, `sanitizeSheetName`. These can be lifted directly into utility modules.

Functions that do DOM mutation: `renderSheetListHTML`, `renderKeySelectList`, `renderColGroup`, `renderResults`, `renderConflicts`, `renderUnmatchedTable` — these will become Vue component templates.

---

## Hard Constraints

1. **Single-file output is mandatory.** `npm run build` must produce one self-contained `dist/index.html`. No separate JS/CSS chunks, no external font/icon CDNs.
2. **Offline capability.** SheetJS must be bundled into the output — no CDN fallback at runtime.
3. **All existing functionality must be preserved exactly.** 5-step wizard, sheet selection, key/column linked/per-sheet modes, conflict resolution (all/first/remove), batch actions, download as Excel and CSV, sheet-per-output splitting, extra sheets (未匹配_A/B, 冲突数据 with merge cells).
4. **Chinese UI language stays.** All user-facing strings remain Chinese.
5. **XSS protection must be maintained.** The current `escHtml()`/`escAttr()` pattern must be replaced by Vue's template auto-escaping (v-bind, text interpolation). No `v-html` with user data.
6. **The existing test file (`test/core.test.js`) must remain green.** Pure-logic functions extracted to `src/utils/excel.js` must keep identical signatures.

## Soft Constraints

- Plain JavaScript (not TypeScript) — minimizes migration friction; the existing code has no types.
- Composition API (not Options API) — closer to the existing functional style; easier to co-locate state and logic.
- No CSS preprocessor — the existing CSS is plain and short; SCSS is unnecessary overhead.
- No UI component library — the existing CSS is custom and should be carried over verbatim.
- No Pinia/Vuex — the state is a single flat object; `reactive()` in a composable is sufficient.

---

## Technology Stack

| Role | Package | Rationale |
|------|---------|-----------|
| UI framework | `vue@3` | Required by user |
| Build tool | `vite` | De-facto Vue standard; fast; plugin ecosystem |
| Vue plugin | `@vitejs/plugin-vue` | Official SFC support |
| Single-file bundler | `vite-plugin-singlefile` | Inlines all JS/CSS into HTML; exactly one output file |
| Excel library | `xlsx` (npm) | Same SheetJS, bundled by Vite instead of served locally |
| Test runner | `node --test` or existing runner | Keep existing test infra unchanged |

**Output size estimate:** SheetJS minified ~900 KB + app JS ~80 KB + CSS ~5 KB ≈ ~1 MB HTML (gzip ~300 KB). Acceptable for a desktop tool shared via file.

---

## Proposed File Structure

```
excel-merge-tool/
  src/
    main.js                  # createApp(App).mount('#app')
    App.vue                  # root: wizard step orchestration
    components/
      Step1Upload.vue        # file drag-drop upload
      Step2Sheets.vue        # sheet checkbox list + start-row + preview
      Step3KeyCols.vue       # key column dropdowns (linked/per-sheet)
      Step4MergeCols.vue     # merge column checkboxes + search
      Step5Results.vue       # tabs: matched / unmatched / conflicts + download
    composables/
      useAppState.js         # reactive() global state + step enable/disable logic
    utils/
      excel.js               # pure functions: parseSheetWithOffset, classifyMerge,
                             #   buildIndex, resolveColumnNames, mergeRow,
                             #   buildUnmatchedRow, buildFinalOutput,
                             #   buildConflictsSheet, sanitizeSheetName
  index.html                 # Vite entry (contains <div id="app">)
  vite.config.js
  package.json
  test/
    core.test.js             # unchanged — imports from src/utils/excel.js
```

---

## Component Responsibility Map

| Component | State it reads | Events it emits |
|-----------|---------------|-----------------|
| `Step1Upload` | `workbookA`, `workbookB` | `file-uploaded(which, wb)`, `file-reset(which)` |
| `Step2Sheets` | `sheetConfigsA/B` | `sheet-change()` (triggers step 3 re-render) |
| `Step3KeyCols` | `sheetConfigsA/B`, `keyLinkedA/B` | `key-col-change()` (triggers step 4) |
| `Step4MergeCols` | `sheetConfigsA/B`, `colsLinkedA/B` | `run-merge()` |
| `Step5Results` | `mergeResult`, `conflictResolutions` | `conflict-resolved(ci, action)`, download actions |

All components receive state via `provide/inject` from `useAppState` composable, or as props if simpler.

---

## Migration Strategy

### Phase 1 — Scaffolding (no logic change)
1. `npm create vite@latest` with Vue template
2. Install `vite-plugin-singlefile`, `xlsx`
3. Configure `vite.config.js` with `viteSingleFile()` plugin
4. Move `index.html` CSS verbatim to `src/style.css`, import in `main.js`
5. Verify build produces single-file HTML

### Phase 2 — Logic extraction
6. Move all pure functions to `src/utils/excel.js`
7. Update `test/core.test.js` import path, verify tests pass
8. Create `useAppState.js` composable with `reactive(state)` identical to current `state` object

### Phase 3 — Component migration (step by step)
9. Migrate each step as a component, replacing DOM mutation with Vue templates
10. Verify each step works before proceeding to next

### Phase 4 — Integration & validation
11. End-to-end test: upload two files, complete all 5 steps, download Excel and CSV
12. Verify single-file output works opened directly in browser (file:// protocol)

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| `vite-plugin-singlefile` doesn't inline SheetJS correctly (size limit) | Medium | Configure `useRecommendedBuildConfig: true`; set `assetsInlineLimit: Infinity` in Vite |
| `file:///` protocol restrictions on modern browsers | Low | Vue SPA with no fetch/XHR; no CORS issues expected |
| SheetJS npm package API differs from CDN build | Low | npm `xlsx` and CDN `xlsx.full.min.js` are the same package; API identical |
| DOM-query patterns in `combineSheetData` (reads from `<select>` nodes) | High | These must be refactored to read from reactive state instead of DOM; this is the most complex migration step |
| Test runner incompatibility with `src/` path rewrite | Low | Update import path in test file; logic unchanged |

**Highest-risk area:** `combineSheetData()` directly queries DOM elements (`document.getElementById('keyColLinked' + which)`, `document.querySelectorAll(...)`) to read the user's selections. In Vue, these selections must be stored in reactive state and the DOM queries replaced with state reads. This is the primary refactoring task.

---

## Success Criteria (Verifiable)

1. `npm run build` exits 0 and produces exactly one file: `dist/index.html`
2. `dist/index.html` size is < 3 MB
3. Opening `dist/index.html` directly in Chrome (file:// protocol) loads the app with no console errors
4. Upload two `.xlsx` files → complete all 5 steps → download Excel → file opens correctly in Excel/LibreOffice
5. Download CSV works when multi-sheet output is disabled
6. `test/core.test.js` passes without modification to test logic
7. No `v-html` directive used anywhere with user-supplied data

---

## Open Questions for User

1. **JavaScript vs TypeScript?** TypeScript adds type safety but increases migration effort. Recommended: plain JS (faster migration, no type errors to fix).
2. **Dev server needed?** `vite dev` provides HMR during development. The final build is still single-file. OK to add?
3. **SheetJS bundle size (xlsx full vs slim)?** `xlsx` npm package bundles the full build (~900 KB). A tree-shaken slim build is possible if only `read`, `utils.sheet_to_json`, `utils.json_to_sheet`, `utils.book_new`, `utils.book_append_sheet`, `writeFile`, `utils.sheet_to_csv` are needed. Acceptable to use full build?
