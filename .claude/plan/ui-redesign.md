# UI Redesign Plan - Excel Merge Tool

## Task Type
- [x] Frontend (Gemini-weighted)

## Technical Approach

**UI Component Library**: Naive UI (`naive-ui`)
- Modern visual design, Vue 3 native
- Rich component set: NSteps, NUpload, NDataTable, NTabs, NSelect, NCheckbox, NButton, NCard, NSpace, NGrid
- Tree-shakeable, theme customization via `NConfigProvider`
- Good Chinese locale support

**Layout Strategy**:
- Full-width container with max-width: 1200px centered
- Responsive breakpoints: mobile (<768px) stacks vertically, desktop side-by-side
- NSteps component for wizard navigation (horizontal on desktop, vertical collapse on mobile)

## Implementation Steps

### Step 1: Install Naive UI
- `npm install naive-ui`
- Setup `NConfigProvider` with Chinese locale and custom theme in `main.js`
- Remove old `style.css` (will be replaced by Naive UI + minimal custom CSS)

### Step 2: Redesign App.vue - Layout & Stepper
- Replace manual step cards with `NSteps` component for navigation
- Use `NCard` for each step's content area
- Layout: centered container with padding, gradient or subtle background
- Title: larger, with subtle icon or branding

### Step 3: Redesign Step1Upload.vue
- Replace custom upload areas with `NUpload` (drag-drop mode)
- Two upload areas side-by-side (`NGrid` cols=2, responsive to cols=1)
- Show file status with `NTag` or `NAlert`
- "Re-upload" as `NButton` with icon

### Step 4: Redesign Step2Sheets.vue
- Use `NCheckbox` for sheet selection
- Use `NInputNumber` for start row
- Sheet preview with `NDataTable` (built-in pagination, sorting)
- Wrap each side in `NCard` with title "File A / File B"
- `NGrid` 2-col layout, responsive

### Step 5: Redesign Step3KeyCols.vue
- Use `NSelect` for key column dropdown
- Use `NSwitch` or link text for linked/independent mode toggle
- Per-sheet sections in `NCard` with `NCollapse`
- `NGrid` 2-col layout

### Step 6: Redesign Step4MergeCols.vue
- Column selection: `NCheckboxGroup` with `NInput` search filter
- "Select All / None" as `NButton` text buttons
- Per-sheet mode: `NCollapse` panels
- Merge button: prominent `NButton` type="primary" size="large"
- `NGrid` 2-col layout

### Step 7: Redesign Step5Results.vue
- `NTabs` component (replaces custom tabs)
- Matched tab: `NDataTable` with pagination (props: rows, columns)
- Unmatched tab: Two `NDataTable` with checkbox column (using selection)
- Conflicts tab: `NCard` per conflict group, side-by-side tables, `NButtonGroup` for actions
- Download section: `NSpace` with `NButton` and `NCheckbox` options
- `NBadge` on tab labels for counts

### Step 8: Redesign DataTable.vue
- Replace custom table with `NDataTable`
- Built-in pagination, scroll, sticky headers
- Auto-generate columns from props

### Step 9: Responsive & Polish
- Add `NLayout` or flex-based responsive wrapper
- Mobile: all 2-col grids collapse to 1-col
- Tables: horizontal scroll on mobile (`NDataTable` handles this)
- Theme: custom primary color, border-radius, font-size adjustments
- Dark mode support (optional, via `NConfigProvider`)

### Step 10: Clean Up
- Remove unused CSS from `style.css`
- Keep only minimal overrides if needed
- Test all 5 steps end-to-end
- Verify mobile layout at 375px

## Key Files

| File | Operation | Description |
|------|-----------|-------------|
| package.json | Modify | Add `naive-ui` dependency |
| src/main.js | Modify | Setup NConfigProvider, remove old CSS import |
| src/style.css | Rewrite | Minimal global styles only |
| src/App.vue | Rewrite | NSteps-based layout |
| src/components/Step1Upload.vue | Rewrite | NUpload + NGrid |
| src/components/Step2Sheets.vue | Rewrite | NDataTable + NCheckbox |
| src/components/Step3KeyCols.vue | Rewrite | NSelect + NSwitch |
| src/components/Step4MergeCols.vue | Rewrite | NCheckboxGroup + search |
| src/components/Step5Results.vue | Rewrite | NTabs + NDataTable |
| src/components/DataTable.vue | Rewrite | Wrap NDataTable |
| src/composables/useAppState.js | NO CHANGE | Business logic untouched |
| src/utils/excel.js | NO CHANGE | Core logic untouched |

## Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| Naive UI bundle size increases single-file build | User confirmed size is not a concern |
| NDataTable API differs from raw table | Map existing data format to NDataTable columns/data props |
| vite-plugin-singlefile may struggle with large bundle | Test single-file build after changes; fallback to standard build |
| Custom checkbox selection in unmatched tab | Use NDataTable's `rowKey` + `checked-row-keys` for selection |

## SESSION_ID
- CODEX_SESSION: (unavailable - task ID lost)
- GEMINI_SESSION: 97eaa03c-51db-4ef0-b24b-f6e45cd3bf1a
