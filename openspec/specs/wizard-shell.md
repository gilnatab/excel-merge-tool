# Spec: Wizard Shell (App.vue)

## Steps

6-step wizard: 文件上传 → 选择表单 → 设置关联键 → 设置合并列 → 处理结果 → 导出结果

| Step | Component | Gate |
|------|-----------|------|
| 1 | Step1Upload | always accessible |
| 2 | Step2Sheets | both files uploaded |
| 3 | Step3KeyCols | sheets selected |
| 4 | Step4MergeCols | key columns set |
| 5 | Step5Results | after merge completes |
| 6 | Step6Export | after merge completes (same gate as 5) |

## Invariants

- `currentStep` ∈ {1,2,3,4,5,6} at all times
- `currentStep` ≤ `Math.max(...state.ui.activeSteps)` at all times
- `canGoNext` is true iff `currentStep < 6 && state.ui.activeSteps.includes(currentStep + 1)`
- Exactly one step panel is mounted (`v-if`, not `v-show`)
- Processing overlay blocks interaction while `state.ui.processing === true`
- `enableStep(5)` and `enableStep(6)` are both called inside `runMerge()` on success

## Merge Trigger

Merge runs when navigating from Step 4 → Step 5 (via the `btn-next` button, which shows text "开始合并" at step 4). There is no dedicated merge button — `nextStep()` is async and calls `runMerge()` when `currentStep === 4`.

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

## Step Indicator (Pill-Connector Pattern)

| Condition | Visual |
|-----------|--------|
| `n < currentStep && activeSteps.includes(n)` | emerald circle + check icon, emerald connector |
| `n === currentStep` | gradient circle (primary-container → primary), white text |
| `activeSteps.includes(n)` (future) | surface-container-high circle |
| `!activeSteps.includes(n)` | surface-container circle, muted text |

Connectors between nodes: `h-0.5 flex-1` line, emerald if completed, outline-variant if not.

## Footer Button Rules

| Step | Left | Right |
|------|------|-------|
| 1 | — | 下一步 (disabled if `!canGoNext`) |
| 2–4 | 上一步 | 下一步 / 开始合并 at step 4 |
| 5 | 上一步 | 下一步 |
| 6 | 上一步 | — (no next CTA) |

## Layout Shell

Sticky header (z-40) + scrollable `<main>` + sticky footer (z-40).

```
min-h-screen flex flex-col bg-surface
├── header  sticky top-0 z-40  bg-surface-container-lowest/95 backdrop-blur-sm
├── main    flex-1 overflow-y-auto
└── footer  sticky bottom-0 z-40  bg-surface-container-lowest/95 backdrop-blur-sm
```

## Reset Flows

- `resetFromStep(n)` disables steps `n` through `6` and clears downstream state
- `resetAll()` resets entire state to initial; App.vue sets `currentStep = 1`
- Step 6 emits `@reset` → App.vue calls `resetAll()` then `currentStep.value = 1`

## Clamping Logic

```js
watch(() => [...state.ui.activeSteps], (steps) => {
  const max = Math.max(...steps);
  if (currentStep.value > max) currentStep.value = max;
});
```

## PBT Properties

- **Idempotency**: `prevStep()` when `currentStep === 1` has no effect
- **Bounds**: `currentStep` never exceeds 6 or goes below 1
- **Gate invariant**: after `resetFromStep(n)`, `currentStep ≤ n − 1`
- **Clamp monotonicity**: `activeSteps` shrinking never increases `currentStep`
- **Merge guard**: `nextStep()` at step 4 is a no-op while `state.ui.processing === true`
- **Step 6 gate**: step 6 is only accessible after a successful merge (same `enableStep(6)` call as step 5)
