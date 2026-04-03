# Proposal: SaaS UI Overhaul — Tailwind + Single-Step Wizard

## Summary

Full UI overhaul: remove NaiveUI entirely, add Tailwind CSS v4, rebuild all components
with native HTML + Tailwind. Convert the layout from "all-steps-visible scroll" to a
single-panel stepper wizard. Custom table implementation designed for future cell editing.

---

## Enhanced Requirement

**Goal**: Replace NaiveUI with Tailwind CSS v4. Rebuild the App shell and all 5 step
components as a single-panel stepper wizard — top progress bar, one visible step at a time,
sticky footer navigation. Business logic in `useAppState.js` and `utils/excel.js` is
untouched.

**Future-proofing**: Custom `<table>` implementation (instead of NaiveUI NDataTable)
is the foundation for future inline cell editing (dblclick → input pattern).

**Scope**: All `.vue` files get new templates. `src/style.css` reduced to resets only
(Tailwind handles everything). `useAppState.js` and `utils/excel.js` — zero changes.

---

## Key Decision: Tailwind v4 Setup

Tailwind v4 uses a Vite-native plugin (no `tailwind.config.js`, CSS-first config):

```js
// vite.config.js — add plugin
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [vue(), tailwindcss()],
})
```

```css
/* src/style.css — replace entire file */
@import "tailwindcss";

/* custom design tokens */
@theme {
  --color-primary: #4361EE;
  --color-primary-hover: #3A56D4;
  --color-success: #2ecc71;
  --color-warning: #e67e22;
}
```

New deps: `tailwindcss@^4.2.2`, `@tailwindcss/vite@^4.2.2`  
Removed deps: `naive-ui`

---

## Discovered Constraints

### Hard Constraints

| # | Constraint |
|---|-----------|
| H1 | `useAppState.js` and `utils/excel.js` — zero modifications. All state and business logic stays as-is. |
| H2 | `state.ui.activeSteps` remains the source of truth for step gating. Wizard `currentStep` is a local `App.vue` ref that is clamped by `activeSteps`. |
| H3 | File upload must handle both click-to-browse and drag-and-drop via native browser APIs (no NaiveUI NUpload). |
| H4 | The `NDataTable` row-selection (unmatched A/B in Step 5) must be reimplemented with a plain `<table>` + manual checkbox column. State binds to `state.unmatchedSelection.A / .B` (arrays of indices). |
| H5 | E2E tests (`test/e2e/app.spec.js`) must be updated alongside the UI changes. |
| H6 | Tailwind v4 preflight resets all browser defaults — verify form inputs, tables, and buttons render correctly without NaiveUI's scoped styles. |

### Soft Constraints

| # | Constraint |
|---|-----------|
| S1 | Color palette: primary `#4361EE`, success `#2ecc71`, warning `#e67e22` — use as Tailwind `@theme` tokens. |
| S2 | Chinese UI text unchanged throughout. |
| S3 | Mobile: stepper header collapses to step number only (e.g. "步骤 2 / 5") on `< sm` breakpoint. |
| S4 | "开始合并" button moves from `Step4MergeCols.vue` content area to wizard footer. |
| S5 | Step fade transition: `opacity` only (0.25s), avoid transform to prevent NaiveUI-free layout jank. |

---

## Component Replacement Map

| NaiveUI Component | Replacement |
|---|---|
| `NConfigProvider` | Remove — no longer needed |
| `NSteps` / `NStep` | Custom wizard header (5 circles + connecting lines) |
| `NCard` | `<div class="bg-white rounded-xl shadow-sm border border-slate-100">` |
| `NSpin` | Custom spinner overlay `<div>` with Tailwind animate-spin |
| `NUpload` / `NUploadDragger` | Native `<input type="file">` + `@dragover`/`@drop` handlers |
| `NCheckbox` | `<input type="checkbox" class="accent-[#4361EE]">` |
| `NInputNumber` | `<input type="number" min="1">` + Tailwind |
| `NInput` | `<input type="text">` + Tailwind |
| `NSelect` | `<select>` + Tailwind, or custom dropdown if multi-select needed |
| `NButton` | `<button>` + Tailwind variant classes |
| `NTabs` / `NTabPane` | Custom tab bar: `<div>` list + `v-show` panels |
| `NDataTable` (row select) | Plain `<table>` with checkbox column, `overflow-x-auto` wrapper |
| `NDataTable` (matched rows) | `DataTable.vue` — rewrite with plain table |
| `NBadge` | `<span class="...">` with absolute positioned dot |
| `NEmpty` | Simple empty-state `<div>` with icon + text |
| `NSpace` / `NGrid` / `NGridItem` | Tailwind `flex` / `grid` / `gap-*` |
| `NGrid` responsive (`cols: {xs:1, m:2}`) | `grid grid-cols-1 md:grid-cols-2 gap-4` |

---

## Wizard Architecture

```
App.vue
├── <!-- processing overlay (replaces NSpin) -->
├── .wizard-card  (max-w-4xl mx-auto flex flex-col min-h-[80vh] bg-white rounded-2xl shadow-xl)
│   ├── WizardHeader   (step progress bar — inline template block)
│   ├── WizardContent  (<transition> + v-if per step, flex-1 overflow-y-auto p-8)
│   │   ├── v-if="currentStep === 1"  → <Step1Upload />
│   │   ├── v-if="currentStep === 2"  → <Step2Sheets />
│   │   ├── v-if="currentStep === 3"  → <Step3KeyCols />
│   │   ├── v-if="currentStep === 4"  → <Step4MergeCols />
│   │   └── v-if="currentStep === 5"  → <Step5Results />
│   └── WizardFooter   (border-t, flex justify-between, Prev / Next / action buttons)
```

### currentStep Logic (App.vue)

```js
const currentStep = ref(1);

// Clamp when steps are disabled (e.g. file reset)
watch(() => state.ui.activeSteps, (steps) => {
  const max = Math.max(...steps);
  if (currentStep.value > max) currentStep.value = max;
});

const canGoNext = computed(() =>
  state.ui.activeSteps.includes(currentStep.value + 1)
);
```

### Footer Button Map

| Step | Left | Right |
|------|------|-------|
| 1 | — | 下一步（disabled until both files uploaded） |
| 2 | 上一步 | 下一步（disabled until sheets ready） |
| 3 | 上一步 | 下一步 |
| 4 | 上一步 | **开始合并**（primary, calls `runMerge` + advances to step 5） |
| 5 | 上一步 | 下载 Excel · 下载 CSV |

---

## Custom Table Design (Editable-Ready)

Step 5 unmatched tables and DataTable use this pattern — designed so future cell editing
requires only adding a click handler and swapping `<span>` for `<input>`:

```html
<div class="overflow-x-auto rounded-lg border border-slate-200">
  <table class="w-full text-sm text-slate-700 border-collapse">
    <thead class="bg-slate-50 text-xs uppercase text-slate-500 font-semibold">
      <tr>
        <th class="w-10 px-3 py-2">  <!-- checkbox column -->
          <input type="checkbox" @change="toggleAll" />
        </th>
        <th v-for="col in cols" class="px-4 py-2 text-left whitespace-nowrap">
          {{ col }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, i) in rows" class="border-t border-slate-100 hover:bg-slate-50">
        <td class="px-3 py-2">
          <input type="checkbox" v-model="selected" :value="i" />
        </td>
        <td v-for="col in cols" class="px-4 py-2 whitespace-nowrap">
          <!-- Future edit: @dblclick="startEdit(i, col)" -->
          <span>{{ row[col] ?? '' }}</span>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## Success Criteria

| ID | Criterion | Verified by |
|----|-----------|------------|
| SC1 | `naive-ui` removed from `package.json` and no NaiveUI imports anywhere | `grep -r "naive-ui" src/` returns empty |
| SC2 | Tailwind v4 compiles, no build errors | `npm run build` passes |
| SC3 | Only one step panel visible at a time | Playwright: other step panels absent from DOM |
| SC4 | Step progress bar shows active/completed/locked states correctly | Visual + Playwright |
| SC5 | Next disabled when target step not in `activeSteps` | Playwright: button has `disabled` attr |
| SC6 | File upload (click + drag-and-drop) works without NaiveUI | Playwright: `setInputFiles` test passes |
| SC7 | Step 5 unmatched row selection (checkbox) syncs to `state.unmatchedSelection` | Playwright: check selection → download includes row |
| SC8 | "开始合并" in footer triggers merge and advances to Step 5 | Playwright |
| SC9 | Re-upload clamps `currentStep` back | Playwright: after reset, step ≤ max(activeSteps) |
| SC10 | All 36 unit + 24 integration tests pass | `npm test && npm run test:integration` |
| SC11 | E2E tests updated and passing | `npm run test:e2e` |

---

## Files to Change

| File | Change Type | Notes |
|------|------------|-------|
| `package.json` | Modify | Add `tailwindcss`, `@tailwindcss/vite`; remove `naive-ui` |
| `vite.config.js` | Modify | Add `@tailwindcss/vite` plugin |
| `src/style.css` | Rewrite | `@import "tailwindcss"` + `@theme` tokens, remove all custom classes |
| `src/App.vue` | Rewrite | Wizard shell: header, content, footer; `currentStep` ref |
| `src/components/Step1Upload.vue` | Rewrite template | Native drag-and-drop upload zone |
| `src/components/Step2Sheets.vue` | Rewrite template | Native checkboxes, number inputs |
| `src/components/Step3KeyCols.vue` | Rewrite template | Native selects |
| `src/components/Step4MergeCols.vue` | Rewrite template | Remove internal "开始合并" button |
| `src/components/Step5Results.vue` | Rewrite template | Custom tabs, custom tables, keep download logic |
| `src/components/DataTable.vue` | Rewrite | Plain table, editable-ready structure |
| `test/e2e/app.spec.js` | Update | Fix selectors after DOM restructure |
