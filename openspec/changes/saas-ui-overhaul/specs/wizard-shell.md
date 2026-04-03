# Spec: Wizard Shell (App.vue)

## Invariants

- `currentStep` ∈ {1,2,3,4,5} at all times
- `currentStep` ≤ `Math.max(...state.ui.activeSteps)` at all times
- `canGoNext` is true iff `state.ui.activeSteps.includes(currentStep + 1)`
- Exactly one step panel is mounted (v-if, not v-show)
- Processing overlay blocks interaction while `state.ui.processing === true`

## Step Circle States

| Condition | Visual |
|-----------|--------|
| `n === currentStep` | filled primary, white text |
| `n < currentStep && activeSteps.includes(n)` | filled success (green), ✓ icon |
| `n > currentStep && activeSteps.includes(n)` | white bg, primary/40 border |
| `!activeSteps.includes(n)` | slate-50 bg, slate-200 border, locked |

## Footer Button Visibility

| Step | Prev button | Right area |
|------|------------|------------|
| 1 | hidden | Next (disabled if `!canGoNext`) |
| 2 | shown | Next (disabled if `!canGoNext`) |
| 3 | shown | Next (always enabled if step 4 in activeSteps) |
| 4 | shown | 开始合并 (calls `runMerge` then sets `currentStep = 5`) |
| 5 | shown | 下载 Excel shortcut (if mergeResult exists) |

## Clamping Logic

```js
watch(() => [...state.ui.activeSteps], (steps) => {
  const max = Math.max(...steps);
  if (currentStep.value > max) currentStep.value = max;
}, { deep: false });
```

Trigger: any file reset, sheet deselect, or upstream step invalidation.

## PBT Properties

- **Idempotency**: calling `prevStep()` when `currentStep === 1` has no effect
- **Bounds**: `currentStep` never exceeds 5 or goes below 1
- **Gate invariant**: after any `resetFromStep(n)`, `currentStep ≤ n - 1`
- **Clamp monotonicity**: `activeSteps` shrinking never increases `currentStep`
