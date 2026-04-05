# Spec: Shell — App.vue + useAppState.js

## useAppState.js Changes

### 1. activeTab → activeView rename
All occurrences of `state.ui.activeTab` become `state.ui.activeView`.
Call sites (line numbers from Codex scan):
- `useAppState.js:64` — field declaration: `activeTab: 'matched'` → `activeView: 'matched'`
- `useAppState.js:281` — reset write: `state.ui.activeTab = 'matched'` → `state.ui.activeView = 'matched'`
- `Step5Results.vue:7` — click handler write
- `Step5Results.vue:10-13` — comparisons
- `Step5Results.vue:26, 31, 109` — `v-show` conditionals

### 2. resetFromStep loop
```js
// Before
for (let i = n; i <= 5; i++) {

// After
for (let i = n; i <= 6; i++) {
```
Also add inside `if (n <= 5)` block:
```js
state.ui.activeView = 'matched'
```

### 3. runMerge enablement
After successful merge, add `enableStep(6)`:
```js
enableStep(5)
enableStep(6)        // NEW
state.ui.activeView = 'matched'   // renamed from activeTab
```

### 4. resolveConflictByKey (new function)
```js
function resolveConflictByKey(key, action) {
  const ci = state.conflictKeys.indexOf(key)
  if (ci === -1) return
  resolveConflict(ci, action)
}
```
Export `resolveConflictByKey` from composable.

### 5. resetAll (new function)
```js
function resetAll() {
  state.filesA = []
  state.filesB = []
  state.sheetConfigsA = []
  state.sheetConfigsB = []
  state.mergeResult = null
  state.conflictResolutions = {}
  state.conflictKeys = []
  state.unmatchedSelection = { A: {}, B: {} }
  state.ui.activeSteps = [1]
  state.ui.activeView = 'matched'
  state.ui.processing = false
}
```
Export `resetAll` from composable.

---

## App.vue Changes

### Step count
- `v-for="n in 5"` → `v-for="n in 6"`
- `progressLineWidth` divisor: `(currentStep - 1) / 4` → `(currentStep - 1) / 5`
- Mobile counter: `/ 5` → `/ 6`

### Step labels
```js
const stepLabels = ['文件上传', '选择表单', '设置关联键', '设置合并列', '处理结果', '导出结果']
```

### New import
```js
import Step6Export from './components/Step6Export.vue'
```

### nextStep (async)
```js
async function nextStep() {
  if (currentStep.value === 4) {
    if (state.ui.processing) return
    await runMerge()
    currentStep.value = 5
    return
  }
  if (canGoNext.value) currentStep.value++
}
```

### canGoNext
```js
const canGoNext = computed(() =>
  currentStep.value < 6 && state.ui.activeSteps.includes(currentStep.value + 1)
)
```

### Footer logic
- Steps 1–5: show `上一步` (when `currentStep > 1`) + `下一步` (when `canGoNext`)
- Step 6: show `上一步` only; no next CTA
- Remove dedicated `v-if="currentStep === 4"` merge button block

### resetAll wiring
Step 6 emits `reset` → App.vue calls `resetAll()` then sets `currentStep.value = 1`

### Sticky layout shell
```html
<div class="min-h-screen flex flex-col bg-surface font-sans">
  <header class="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-sm border-b border-outline-variant/30">
    <!-- logo + step indicator -->
  </header>
  <main class="flex-1 overflow-y-auto">
    <!-- step components -->
  </main>
  <footer class="sticky bottom-0 z-40 bg-surface-container-lowest/95 backdrop-blur-sm border-t border-outline-variant/30">
    <!-- nav buttons -->
  </footer>
</div>
```

### PBT
- After `resetAll()`, `state.ui.activeSteps === [1]` and `currentStep === 1`
- `canGoNext` is false when `currentStep === 6`
- `nextStep()` does not advance if `state.ui.processing === true` and `currentStep === 4`
- `currentStep` never exceeds `max(state.ui.activeSteps)` (enforced by `canGoNext` check)
