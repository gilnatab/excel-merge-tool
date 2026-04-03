# Design: SaaS UI Overhaul — Tailwind Wizard

## Architecture Overview

```
src/
├── style.css              ← @import "tailwindcss" + @theme tokens (replaces all custom CSS)
├── App.vue                ← Wizard shell: header + content + footer; owns currentStep
├── composables/
│   └── useAppState.js     ← UNCHANGED
├── utils/
│   └── excel.js           ← UNCHANGED
└── components/
    ├── Step1Upload.vue    ← Native drag-and-drop, two upload zones
    ├── Step2Sheets.vue    ← Native checkboxes + number inputs
    ├── Step3KeyCols.vue   ← Native <select> dropdowns
    ├── Step4MergeCols.vue ← Native checkboxes + search; no internal merge button
    ├── Step5Results.vue   ← Custom tabs + custom tables + download options
    └── DataTable.vue      ← Plain <table> with optional checkbox column
```

---

## Tooling Setup

### package.json changes
```json
// Remove:  "naive-ui": "^2.44.1"
// Add devDeps: "tailwindcss": "^4.2.2", "@tailwindcss/vite": "^4.2.2"
```

### vite.config.js
```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
})
```

### src/style.css (full replacement)
```css
@import "tailwindcss";

@theme {
  --color-primary:       #4361EE;
  --color-primary-hover: #3A56D4;
  --color-success:       #2ecc71;
  --color-warning:       #e67e22;
  --color-danger:        #e74c3c;
}

@layer base {
  *, *::before, *::after { box-sizing: border-box; }

  /* Native form element baseline */
  input[type="text"],
  input[type="number"],
  input[type="search"],
  select {
    @apply border border-slate-200 rounded-lg px-3 py-2
           focus:ring-2 focus:ring-primary/20 focus:border-primary
           outline-none transition-all bg-white text-slate-800 text-sm;
  }
  input[type="checkbox"] { accent-color: var(--color-primary); }
  button { cursor: pointer; }
}

/* Step fade transition */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
```

---

## App.vue — Wizard Shell

### Template Structure
```html
<template>
  <div class="min-h-screen bg-slate-100 py-8 px-4">
    <!-- Processing overlay -->
    <div v-if="state.ui.processing"
         class="fixed inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="flex flex-col items-center gap-3 text-slate-600">
        <div class="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span class="text-sm font-medium">正在合并数据...</span>
      </div>
    </div>

    <div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100
                flex flex-col" style="min-height: 80vh">

      <!-- Wizard Header -->
      <header class="p-6 border-b border-slate-100">
        <div class="relative flex items-center justify-between max-w-2xl mx-auto">
          <!-- connecting line background -->
          <div class="absolute inset-y-5 left-0 right-0 h-0.5 bg-slate-200 -z-0"></div>
          <!-- completed progress line -->
          <div class="absolute inset-y-5 left-0 h-0.5 bg-primary -z-0 transition-all duration-300"
               :style="{ width: progressLineWidth }"></div>

          <div v-for="n in 5" :key="n" class="relative z-10 flex flex-col items-center gap-1.5">
            <div :class="stepCircleClass(n)">
              <span v-if="isCompleted(n)">✓</span>
              <span v-else>{{ n }}</span>
            </div>
            <span class="text-xs font-medium hidden sm:block"
                  :class="currentStep === n ? 'text-primary' : 'text-slate-400'">
              {{ stepLabels[n-1] }}
            </span>
          </div>
        </div>
        <!-- Mobile: step counter -->
        <p class="sm:hidden text-center text-sm text-slate-500 mt-3">
          步骤 {{ currentStep }} / 5 — {{ stepLabels[currentStep-1] }}
        </p>
      </header>

      <!-- Content Area -->
      <main class="flex-1 overflow-y-auto p-8">
        <transition name="fade" mode="out-in">
          <div :key="currentStep">
            <Step1Upload v-if="currentStep === 1" />
            <Step2Sheets v-else-if="currentStep === 2" />
            <Step3KeyCols v-else-if="currentStep === 3" />
            <Step4MergeCols v-else-if="currentStep === 4" />
            <Step5Results v-else-if="currentStep === 5" />
          </div>
        </transition>
      </main>

      <!-- Footer Nav -->
      <footer class="px-8 py-4 border-t border-slate-100 bg-slate-50/60
                     flex items-center justify-between flex-shrink-0">
        <button v-show="currentStep > 1" @click="prevStep"
                class="px-6 py-2 rounded-lg border border-slate-200 text-slate-600
                       hover:bg-slate-100 font-medium text-sm transition-colors">
          ← 上一步
        </button>
        <div v-show="currentStep <= 1"></div>

        <div class="flex gap-3">
          <!-- Steps 1-3: Next -->
          <button v-if="currentStep < 4" @click="nextStep"
                  :disabled="!canGoNext"
                  class="px-8 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white
                         font-medium text-sm transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed">
            下一步 →
          </button>
          <!-- Step 4: Start Merge -->
          <button v-if="currentStep === 4" @click="doRunMerge"
                  :disabled="!canGoNext || state.ui.processing"
                  class="px-8 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white
                         font-bold text-sm shadow-lg shadow-primary/25 transition-all
                         disabled:opacity-40 disabled:cursor-not-allowed">
            开始合并
          </button>
          <!-- Step 5: Download shortcuts -->
          <template v-if="currentStep === 5 && state.mergeResult">
            <button @click="downloadExcel"
                    class="px-6 py-2 rounded-lg bg-success hover:bg-success/80 text-white
                           font-medium text-sm transition-colors">
              下载 Excel
            </button>
          </template>
        </div>
      </footer>
    </div>
  </div>
</template>
```

### Script (key logic)
```js
const stepLabels = ['上传文件','选择工作表','关联列','合并列','结果处理'];
const currentStep = ref(1);

// Clamp when upstream steps are reset
watch(() => [...state.ui.activeSteps], (steps) => {
  const max = Math.max(...steps);
  if (currentStep.value > max) currentStep.value = max;
});

const canGoNext = computed(() =>
  currentStep.value < 5 && state.ui.activeSteps.includes(currentStep.value + 1)
);

const isCompleted = (n) => n < currentStep.value && state.ui.activeSteps.includes(n);

const progressLineWidth = computed(() =>
  `${((currentStep.value - 1) / 4) * 100}%`
);

function stepCircleClass(n) {
  const base = 'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors';
  if (n < currentStep.value && state.ui.activeSteps.includes(n))
    return `${base} bg-success border-success text-white`;        // completed
  if (n === currentStep.value)
    return `${base} bg-primary border-primary text-white`;        // active
  if (state.ui.activeSteps.includes(n))
    return `${base} bg-white border-primary/40 text-primary/60`; // unlocked
  return `${base} bg-slate-50 border-slate-200 text-slate-300`;  // locked
}

async function doRunMerge() {
  await runMerge();           // from appState
  currentStep.value = 5;     // advance after merge completes
}

function nextStep() { if (canGoNext.value) currentStep.value++; }
function prevStep() { if (currentStep.value > 1) currentStep.value--; }
```

---

## Step1Upload.vue — Native Drag-and-Drop

### Key Design Rules
1. One `processFile(which, file)` function handles BOTH drag-drop and click-browse paths
2. Upload success is signaled only after `FileReader.onload` completes (not optimistically)
3. Native input value cleared on reset to allow re-selecting the same file
4. `isDragging` state per slot for hover visual feedback

### Events Required
| Event | Target | Purpose |
|-------|--------|---------|
| `click` | upload zone | triggers `fileInputRef.click()` |
| `change` | `<input type="file">` | reads `event.target.files[0]` |
| `dragover.prevent` | zone | enables drop, sets `isDragging = true` |
| `dragleave.prevent` | zone | clears `isDragging` |
| `drop.prevent` | zone | extracts `event.dataTransfer.files[0]`, calls `processFile` |

### Template
```html
<!-- Upload zone (shown when no file) -->
<div v-if="!hasFile(which)"
     :class="uploadZoneClass(which)"
     @click="triggerInput(which)"
     @dragover.prevent="dragState[which] = true"
     @dragleave.prevent="dragState[which] = false"
     @drop.prevent="onDrop(which, $event)">
  <input type="file" class="hidden" :ref="el => fileInputs[which] = el"
         accept=".xlsx,.xls,.csv" @change="onFileChange(which, $event)" />
  <div class="text-4xl mb-3">☁️</div>
  <p class="font-semibold text-slate-700">文件 {{ which }}</p>
  <p class="text-sm text-slate-400 mt-1">点击或拖拽上传 .xlsx / .xls / .csv</p>
</div>

<!-- Done card (shown after upload) -->
<div v-else class="border-2 border-success/40 rounded-xl p-5 bg-success/5
                   flex items-center justify-between gap-4">
  <div class="min-w-0">
    <p class="text-xs font-semibold text-slate-500 mb-1">文件 {{ which }}</p>
    <p class="font-semibold text-slate-800 truncate">
      {{ which === 'A' ? state.filenameA : state.filenameB }}
    </p>
    <p class="text-xs text-success mt-0.5">✓ 已上传</p>
  </div>
  <button @click="onReset(which)"
          class="px-3 py-1.5 text-sm border border-slate-200 rounded-lg
                 hover:bg-slate-50 text-slate-600 whitespace-nowrap flex-shrink-0">
    重新上传
  </button>
</div>
```

---

## Step5Results.vue — Custom Tabs + Tables

### Custom Tabs Pattern
```html
<!-- Tab bar -->
<div class="flex border-b border-slate-200 mb-6">
  <button v-for="tab in tabs" :key="tab.id"
          @click="state.ui.activeTab = tab.id"
          :class="[
            'px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2',
            state.ui.activeTab === tab.id
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          ]">
    {{ tab.label }}
    <span v-if="tab.badge > 0"
          :class="[
            'text-xs px-2 py-0.5 rounded-full font-semibold',
            tab.id === 'conflicts' && unhandledConflictsCount > 0
              ? 'bg-red-100 text-red-600'
              : 'bg-slate-100 text-slate-500'
          ]">
      {{ tab.badge }}
    </span>
  </button>
</div>
```

### Custom Table with Row Selection
```html
<div class="overflow-x-auto rounded-xl border border-slate-200">
  <table class="w-full text-sm border-collapse">
    <thead class="bg-slate-50 border-b border-slate-200">
      <tr>
        <th class="w-10 px-3 py-3">
          <input type="checkbox" :checked="allSelected" @change="toggleAll" />
        </th>
        <th v-for="col in cols" :key="col"
            class="px-4 py-3 text-left text-xs uppercase font-semibold text-slate-500 whitespace-nowrap">
          {{ col }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, i) in rows" :key="i"
          class="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
        <td class="px-3 py-2.5">
          <input type="checkbox" :value="i" v-model="selectedRows" />
        </td>
        <td v-for="col in cols" :key="col"
            class="px-4 py-2.5 text-slate-700 whitespace-nowrap max-w-[200px] truncate">
          <!-- Future: @dblclick="startEdit(i, col)" to enable inline editing -->
          {{ row[col] ?? '' }}
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## E2E Test Strategy

All 13 existing tests will break. Mitigation: add `data-testid` attributes during component
rewrites. Wizard navigation steps must be prepended to each test flow.

### Required data-testid attributes
| Element | `data-testid` value |
|---------|-------------------|
| File A upload zone | `upload-zone-a` |
| File B upload zone | `upload-zone-b` |
| File A done card | `done-card-a` |
| File B done card | `done-card-b` |
| Re-upload button A | `reupload-a` |
| Re-upload button B | `reupload-b` |
| Next button | `btn-next` |
| Prev button | `btn-prev` |
| Start Merge button | `btn-merge` |
| Tab: matched | `tab-matched` |
| Tab: unmatched | `tab-unmatched` |
| Tab: conflicts | `tab-conflicts` |
| Download Excel button | `btn-download-excel` |
| Download CSV button | `btn-download-csv` |
| Conflict key text | `conflict-key-text` (keep existing class too) |

### E2E Test Update Pattern
Every test that previously jumped straight to asserting step 2+ content now needs:
```js
// After uploading files:
await page.getByTestId('btn-next').click();  // advance to step 2
// Then assert step 2 content
```
