# Design: Stitch UI Overhaul

## Architecture Overview

Replace the current 5-step wizard UI with a 6-step "Precision Layer" design system.
Merge logic (`src/utils/excel.js`) is untouched. Only the visual layer and step orchestration change.

---

## Component Interface Contracts

### AppIcon.vue (new)
```vue
<AppIcon name="check" class="w-5 h-5" />
```
- Props: `name: String (required)` — key into internal SVG `paths` map
- No slots, no emits
- Renders `<svg viewBox="0 0 24 24" fill="currentColor" v-bind="$attrs">` with `<path :d="paths[name]" />`
- `$attrs` inheritance passes `class`/`style` to `<svg>` for sizing
- Size controlled entirely by consumer's `class` (e.g. `w-4 h-4`, `w-6 h-6`)
- 25 icons registered: `check`, `arrow_forward`, `arrow_back`, `refresh`, `cloud_upload`, `task_alt`, `info`, `grid_on`, `visibility`, `close`, `search`, `filter_list`, `chevron_left`, `chevron_right`, `description`, `link`, `lock`, `expand_more`, `report`, `settings`, `download`, `autorenew`, `open_in_full`, `add_circle`, `sync_alt`

### ExportSettings.vue (new shared subcomponent)
```vue
<ExportSettings />
```
- No props — reads/writes `state.outputOptions` directly via `inject('appState')`
- Renders: `keepSheetOutput`, `extraSheetUnmatchedA`, `extraSheetUnmatchedB`, `extraSheetConflicts` checkboxes + CSV-disabled warning
- Used by both Step5Results.vue and Step6Export.vue (single source of truth)

### DataTable.vue (extended)
New props:
```
fullscreen: Boolean, default false
title: String, default ''
searchPlaceholder: String, default '搜索...'
```
New emits: `close`

Render contract:
- `fullscreen === false` → embedded table (current behavior, extended with search)
- `fullscreen === true` → `fixed inset-0 z-50 bg-white flex flex-col` shell with compact header, close button (`@click="$emit('close')"`)
- Internal `search` ref filters rows; watch filtered length to clamp/reset `currentPage`
- Pagination resets to page 1 when `rows` prop changes length

---

## State Changes

### useAppState.js
1. `state.ui.activeTab` → `state.ui.activeView` (rename only, values unchanged: `'matched'|'unmatched'|'conflicts'`)
2. `resetFromStep()` loop: `i <= 5` → `i <= 6`
3. `resetFromStep()` side-effects when `n <= 5`: also reset `state.ui.activeView = 'matched'`
4. `runMerge()`: change `state.ui.activeTab = 'matched'` → `state.ui.activeView = 'matched'`; call `enableStep(6)` after `enableStep(5)`
5. Add `resetAll()`: calls `resetFromStep(2)`, clears file A/B state, sets `currentStep` back to 1 via App.vue emit OR by resetting all `activeSteps` to `[1]`
   - Decision: `resetAll()` lives in composable; resets `state.filesA`, `state.filesB`, `state.sheetConfigsA`, `state.sheetConfigsB`, `state.mergeResult = null`, `state.ui.activeSteps = [1]`, `state.ui.activeView = 'matched'`; App.vue watches `activeSteps` and syncs `currentStep` to `1`

### App.vue
1. Step count: `v-for="n in 5"` → `v-for="n in 6"`, divisor `4` → `5` for progress line
2. Step labels: `['文件上传','选择表单','设置关联键','设置合并列','处理结果','导出结果']`
3. Import and render `Step6Export.vue`
4. `nextStep()` made async; branches on `currentStep === 4` to run merge before advancing
5. `canGoNext`: `currentStep < 6 && state.ui.activeSteps.includes(currentStep + 1)`
6. Step 6 footer: only `上一步` (no next CTA)
7. `currentStep` stays as local `ref` in App.vue (not promoted to state)

---

## Merge Trigger Migration

```js
// App.vue
async function nextStep() {
  if (currentStep.value === 4) {
    if (state.ui.processing) return
    await runMerge()          // enables step 5 & 6 internally
    currentStep.value = 5
    return
  }
  if (canGoNext.value) currentStep.value++
}
```
- `runMerge()` must call `enableStep(5)` AND `enableStep(6)` (or App.vue calls `enableStep(6)` after merge)
- If `runMerge()` throws, `currentStep` stays at 4; `processing` clears

---

## CSS Token System

All tokens in `src/style.css` `@theme` block (Tailwind v4, no `tailwind.config.js`):

```css
@theme {
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
  --font-family-sans: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}
```

Tailwind v4 generates utility classes from `--color-X` tokens: `bg-surface-container-low`, `text-on-surface-variant`, `border-outline-variant`.
**Risk**: Multi-hyphen names work fine in v4. Avoid `bg-[var(--color-X)]` arbitrary syntax except for one-off cases.
**Risk**: Opacity suffix works with generated utilities (`bg-surface-container-low/80`) but is unreliable with arbitrary var syntax.

---

## Layout Shell (App.vue)

```html
<div class="min-h-screen flex flex-col bg-surface font-sans">
  <!-- Sticky header -->
  <header class="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-sm border-b border-outline-variant/30 px-6 py-4">
    <!-- Logo + step indicator -->
  </header>

  <!-- Scrollable content area -->
  <main class="flex-1 overflow-y-auto px-6 py-8">
    <!-- Step components rendered here -->
  </main>

  <!-- Sticky footer -->
  <footer class="sticky bottom-0 z-40 bg-surface-container-lowest/95 backdrop-blur-sm border-t border-outline-variant/30 px-6 py-4">
    <!-- Navigation buttons -->
  </footer>
</div>
```

---

## Step Indicator (Pill-Connector Pattern)

Per step node:
```html
<!-- Completed -->
<div class="flex items-center gap-0">
  <div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
    <AppIcon name="check" class="w-4 h-4 text-white" />
  </div>
  <div class="h-0.5 w-12 bg-emerald-400"></div>  <!-- connector, omit on last -->
</div>

<!-- Active -->
<div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-white text-sm font-semibold">
  3
</div>

<!-- Future -->
<div class="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant/50 flex items-center justify-center text-sm font-medium">
  4
</div>
```

---

## Step 3 Sidebar Layout

```html
<div class="flex gap-6 h-full">
  <!-- Sidebar w-80, independent scroll -->
  <aside class="w-80 shrink-0 bg-surface-container-low rounded-2xl overflow-y-auto">
    <!-- Sheet list items -->
  </aside>
  <!-- Main panel -->
  <section class="flex-1 min-w-0 bg-surface-container-lowest rounded-2xl p-6">
    <!-- Active config panel -->
  </section>
</div>
```

---

## Step 5 activeView Switching

```vue
<script setup>
const state = inject('appState')

function setView(view) {
  state.ui.activeView = view
}
</script>

<template>
  <!-- Stat cards -->
  <button @click="setView('matched')"
          :class="state.ui.activeView === 'matched' ? 'ring-2 ring-primary' : ''">
    已匹配: {{ state.mergeResult.matched.length }}
  </button>

  <!-- Conditional content -->
  <div v-if="state.ui.activeView === 'matched'">...</div>
  <div v-else-if="state.ui.activeView === 'unmatched'">...</div>
  <div v-else-if="state.ui.activeView === 'conflicts'">...</div>
</template>
```

---

## Fullscreen Overlay Pattern

**Decision**: Prop-based (`DataTable` accepts `fullscreen` prop).
**Rationale**: Simpler than a separate component; DataTable already owns table rendering; avoids data-passing complexity.

```html
<!-- Fullscreen shell (rendered when fullscreen===true) -->
<div class="fixed inset-0 z-50 bg-white flex flex-col">
  <div class="flex items-center justify-between px-4 py-3 border-b border-outline-variant/30 bg-surface-container-low">
    <span class="text-sm font-medium text-on-surface">{{ title }}</span>
    <button @click="$emit('close')"><AppIcon name="close" class="w-5 h-5" /></button>
  </div>
  <!-- search + table + pagination -->
</div>
```

---

## Conflict Index Bug Fix

Current `Step5Results.vue` passes filtered index `ci` to `resolveConflict(ci, action)`, but the composable indexes by `state.conflictKeys[ci]`. When filter reduces the list, indices misalign.

**Fix**: Pass the key directly:
```js
// Before (buggy)
resolveConflict(ci, action)  // ci is filtered index

// After (correct)
resolveConflict(state.conflictKeys.indexOf(key), action)
// OR: expose resolveConflictByKey(key, action) in composable
```
Decision: expose `resolveConflictByKey(key, action)` in composable for clarity.

---

## Implementation Order (Dependency Graph)

```
Phase 1: Foundation
  AppIcon.vue (new) + style.css tokens
    ↓
Phase 2: Shell + State
  useAppState.js (activeView rename, resetFromStep 6, resetAll, enableStep 6)
  App.vue (6-step shell, merge trigger, sticky layout)
    ↓
Phase 3: DataTable
  DataTable.vue (fullscreen prop, search, pagination reset)
    ↓
Phase 4: Step Components 1–4 (can be done in parallel)
  Step1Upload.vue (restyle)
  Step2Sheets.vue (layout rewrite + DataTable fullscreen)
  Step3KeyCols.vue (sidebar layout)
  Step4MergeCols.vue (column panels, remove merge button)
    ↓
Phase 5: ExportSettings.vue (shared subcomponent)
    ↓
Phase 6: Step 5 + Step 6
  Step5Results.vue (stat cards, activeView, sidebar, fullscreen)
  Step6Export.vue (new, uses ExportSettings)
    ↓
Phase 7: QA
  Step gating, fullscreen, CSV disable, reset/rerun flows, build:single
```

---

## Risks Accepted

| Risk | Mitigation |
|------|-----------|
| `keepSheetOutput` overwritten on rerun | Document behavior; runMerge always recalculates |
| Fullscreen overlay state leakage | Fullscreen state is component-local ref, reset on `@close` |
| Border-heavy legacy classes | Systematic find-and-replace per component during restyle |
| `currentStep` local vs state | App.vue watches `activeSteps` to auto-sync |
