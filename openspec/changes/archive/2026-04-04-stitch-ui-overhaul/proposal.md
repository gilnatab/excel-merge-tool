# Proposal: Stitch UI Overhaul

## Change Summary

Replace the current 5-step single-panel wizard UI with the new "Precision Layer" design system (from `stitch_excel_file_merger/`) — a 6-step professional-grade interface. The underlying merge logic (`src/utils/excel.js`) and state composable (`src/composables/useAppState.js`) are preserved; only the visual layer and App.vue step orchestration change.

---

## Discovered Constraints

### Hard Constraints

- **Merge logic untouched**: `src/utils/excel.js` functions (`combineSheetData`, `classifyMerge`, `buildFinalOutput`, `buildConflictsSheet`, etc.) must not change.
- **State shape mostly preserved**: `useAppState.js` reactive state fields stay the same. New fields added: `state.ui.activeView` (replaces `activeTab`) and `currentStep` promoted from App.vue to state (or kept as ref there).
- **Tailwind CSS v4**: All new tokens must use the `@theme` block in `style.css`; cannot use `tailwind.config.js`. The new design's color palette must be translated to CSS variables.
- **No external dependencies**: Must not add new npm packages. No CDN font links.
- **Offline / single-file first**: The app is distributed as a single HTML file via `vite-plugin-singlefile`. All assets (JS, CSS, fonts) must be inlined. CDN links for fonts or icons are forbidden.
- **Icons: inline SVG only**: All icons are implemented as inline `<svg>` paths in Vue templates. A shared `AppIcon.vue` component wraps the ~20 icon paths actually used. No icon font, no external icon library.
- **Inter font**: Must also be self-hosted or omitted. Use `font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif` relying on system Inter if installed, otherwise falls back gracefully. Do NOT load Inter from Google Fonts CDN.
- **5 existing Vue component files**: Step1Upload → Step6Export (rename Step5Results → Step5Results + new Step6Export). DataTable.vue reused/extended for fullscreen preview.
- **XSS / security rules**: All existing encoding rules (no DOM ID from raw keys, `__sheet__` stripping, etc.) remain unchanged.

### Soft Constraints

- **6-step structure**: Step 5 = "处理结果" (review/handle data), Step 6 = "导出结果" (confirm + download).
- **New color palette**: The "Precision Layer" palette from `datasynth_professional/DESIGN.md` — blue-slate spectrum using `surface-*` tonal layering, no 1px borders.
- **Inter font** as primary, falling back to PingFang SC / Microsoft YaHei.
- **Material Symbols Outlined** icons replace current emoji/text indicators.
- **Sticky header + sticky footer** pattern across all steps.

---

## Architecture Changes

### App.vue
- Increase step count from 5 to 6.
- Step labels: `['文件上传', '选择表单', '设置关联键', '设置合并列', '处理结果', '导出结果']`
- Step indicator: Replace current progress line with the new pill-connector design (numbered circles + emerald checkmarks for completed, gradient active, faded future).
- Footer nav: "上一步" + "重新开始" on left; "下一步" (gradient button) on right.
- Merge action: `doRunMerge()` triggers when navigating from Step 4 → Step 5 (replace current "开始合并" button).
- Step 6 footer: only "上一步" (no next).

### style.css (@theme additions)
Add all "Precision Layer" color tokens as CSS variables:
```css
--color-surface: #f8f9ff;
--color-surface-container-lowest: #ffffff;
--color-surface-container-low: #eff4ff;
--color-surface-container: #e5eeff;
--color-surface-container-high: #dce9ff;
--color-surface-container-highest: #d3e4fe;
--color-primary: #0058be;
--color-primary-container: #2170e4;
--color-primary-fixed: #d8e2ff;
--color-on-primary: #ffffff;
--color-on-surface: #0b1c30;
--color-on-surface-variant: #424754;
--color-outline-variant: #c2c6d6;
--color-error: #ba1a1a;
--color-secondary: #495e8a;
--color-tertiary: #924700;
```

### index.html
No font CDN links. Font stack relies on system fonts (Inter if installed, else PingFang SC / Microsoft YaHei / sans-serif).

### src/components/AppIcon.vue (new)
A single icon registry component. Usage: `<AppIcon name="check" class="w-5 h-5" />`.
Contains a `paths` map of ~20 SVG path strings for icons used across the design:
`check`, `arrow_forward`, `arrow_back`, `refresh`, `cloud_upload`, `task_alt`, `info`, `grid_on`, `visibility`, `close`, `search`, `filter_list`, `chevron_left`, `chevron_right`, `description`, `link`, `lock`, `expand_more`, `report`, `settings`, `download`, `autorenew`, `open_in_full`, `add_circle`, `sync_alt`.

---

## Component Changes

### Step1Upload.vue (restyle)
- Full sticky header + step indicator lives in App.vue.
- Card: `rounded-2xl`, `shadow-xl`, max-w-4xl, `bg-surface-container-lowest`.
- Upload zones: dashed `border-primary-fixed`, `bg-surface-container-low`, hover scales icon.
- Success state: emerald border + `task_alt` icon.
- Info box: `bg-surface-container` with `info` icon.

### Step2Sheets.vue (restyle + layout change)
- **Left panel**: Sheet list per file (checkbox, sheet name, row count, headerRow input, 预览 button).
- **Right panel**: Inline data preview table (20 rows), with fullscreen expand button.
- **Fullscreen preview overlay**: Triggered by 预览/fullscreen button → renders `DataTable.vue` in a fullscreen modal with close button, search bar, and pagination.

### Step3KeyCols.vue (restyle + sidebar layout)
- **Sidebar** (w-80): Sheet list navigator. Each sheet shows name + config status badge. "+ 添加更多工作表映射" button.
- **Main panel**: File A/B info cards + column select dropdowns + data alignment preview (first 10 rows shown side by side) + info hint box.
- **Sync toggle**: In the section header. When ON → show simplified `step_3_sync_all_sheets_mapping_refined` layout (no sidebar, one global config panel).
- Active sheet in sidebar = current config panel shown in main area.

### Step4MergeCols.vue (restyle)
- Two-column layout: Table A columns list + Table B columns list.
- Each column list: search input, select all/deselect, scrollable checklist, join key locked row, type badge on hover.
- Fixed height panels (500px) with internal scroll.

### Step5Results.vue (rename/restructure → "处理结果")
- **Three stat cards** at top: 已匹配 / 未匹配 / 存在冲突. Clicking a card sets `state.ui.activeView`.
- **Sidebar** (w-72, sticky): Export settings panel (keepSheetOutput, extraSheetUnmatchedA/B, extraSheetConflicts checkboxes + CSV-disabled warning).
- **Main content** (flex-grow) switches based on `activeView`:
  - `matched`: Data preview table with search + pagination.
  - `unmatched`: Two side-by-side tables (only-in-A, only-in-B) with search and fullscreen expand per table.
  - `conflicts`: Expandable conflict cards (existing logic, new styling). Each card: conflict ID, counts (A/B), action buttons (移除/保留全部/保留第一条), collapsible detail table.
- `state.ui.activeView` replaces `state.ui.activeTab`. Default: `'matched'`.
- Fullscreen overlay applies here too (expand button on tables).

### Step6Export.vue (new component)
- **Left**: Data summary (total merged rows, total columns) + confirmed export config list.
- **Download buttons**: "下载 Excel (.xlsx)" primary button + "下载 CSV (.csv)" secondary (disabled when extra sheets enabled).
- **Reset button**: "处理另一个文件" with warning text.
- **Sidebar**: Same export settings panel as Step 5 (shared or duplicated).

### DataTable.vue (extend)
- Add `fullscreen` prop. When true, renders in a fixed overlay (inset-0, z-50, bg-white).
- Add search input and pagination controls.
- Fullscreen overlay has compact header with file/sheet name + close button.

---

## State Changes

### useAppState.js
- Rename `state.ui.activeTab` → `state.ui.activeView` (values: `'matched'` | `'unmatched'` | `'conflicts'`).
- All components that read `activeTab` must be updated to `activeView`.

---

## Dependencies

- Step 5 → Step 6: Step 6 requires `state.mergeResult` (produced by runMerge which runs on Step 4→5 transition).
- Step 3 sidebar: Requires `state.sheetConfigsA` + `state.sheetConfigsB` to enumerate sheet pairs.
- Step 5 stat cards: `mergeResult.matched`, `mergeResult.unmatchedA`, `mergeResult.unmatchedB`, `mergeResult.conflicts` counts.
- Fullscreen preview: Available in Step 2 (raw sheet data) and Step 5 (merge result tables).

---

## Risks

1. **Tailwind v4 CSS variable naming**: New tokens use hyphens (e.g. `surface-container-low`). Tailwind v4 `@theme` block supports arbitrary names — verify class generation works with multi-hyphen names (may need `bg-[var(--color-surface-container-low)]` syntax for some).
2. **SVG icon maintenance**: All icon paths are hardcoded strings in `AppIcon.vue`. If the design needs a new icon later it must be manually added. Mitigation: document the icon registry clearly.
3. **Step 3 sidebar complexity**: Per-sheet independent config with sidebar navigation is a significant UX change. The existing `keyLinked` toggle logic maps to the "sync all sheets" toggle.
4. **activeTab → activeView rename**: All 5 Step components and `useAppState.js` must be audited for this field.

---

## Success Criteria

- [ ] All 6 steps render with new visual design.
- [ ] Step indicator shows: emerald check (completed) → gradient active → faded (future).
- [ ] Sticky header with "Excel数据合并大师" logo persists across all steps.
- [ ] Sticky footer with 上一步 / 下一步 / 重新开始 navigation.
- [ ] Step 2: Sheet list + inline preview + fullscreen overlay works.
- [ ] Step 3: Sidebar sheet navigation + independent config panel; sync-all toggle collapses to simplified view.
- [ ] Step 4: Column lists with search, type hints, locked join key row.
- [ ] Step 5: Three clickable stat cards switch between matched/unmatched/conflicts views; export settings sidebar visible.
- [ ] Step 6: Download Excel button works; CSV button disabled when extra sheets enabled; "处理另一个文件" resets state.
- [ ] Fullscreen table overlay available in Step 2 and Step 5.
- [ ] All existing merge logic tests pass (no changes to `excel.js`).
- [ ] Single-file build (`npm run build:single`) succeeds.

---

## User Confirmations

- 6-step structure: **Yes**
- Step 3 layout: **Full sidebar with independent per-sheet config**
- Step 5 navigation: **Card-click switching** (replaces tabs)
- Fullscreen preview: **Yes, apply everywhere tables appear** (Step 2, Step 5 matched/unmatched views)
- Merge trigger: Runs on Step 4 → Step 5 navigation (replacing the "开始合并" button)
- Icons: **Inline SVG via `AppIcon.vue`** — no CDN font, no external library
- Fonts: **System font stack only** — no Google Fonts CDN
