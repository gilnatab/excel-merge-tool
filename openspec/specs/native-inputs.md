# Spec: Native Input Bindings (Steps 2–4)

## Type Coercion Rules

All native inputs emit string values by default. Explicit coercion is required:

| Input type | Binding | Coercion |
|-----------|---------|---------|
| `<input type="number">` for `headerRow` | `@change="+(value) \|\| 1"` | Must be integer ≥ 1 |
| `<input type="checkbox">` for sheet checked | `@change="onCheckChange(which, idx, $event.target.checked)"` | Boolean |
| `<input type="checkbox">` for column selected | `@change="onColChange(which, h, $event.target.checked)"` | Boolean |
| `<select>` for key column | `v-model="state.selection[which].linkedKeyCol"` | String (already correct) |
| `<input type="text">` for search | `v-model="state.selection[which].colSearch"` | String (already correct) |

## Step 2 — Sheet Configuration

```html
<!-- Sheet checkbox -->
<input type="checkbox" :checked="cfg.checked"
       @change="onSheetCheckChange(which, idx, $event.target.checked)" />

<!-- Start row number input -->
<input type="number" :value="cfg.headerRow" min="1"
       @change="onSheetStartRowChange(which, idx, Math.max(1, +$event.target.value || 1))" />
```

**Invariant**: `headerRow` is always a positive integer. Zero or negative values are clamped to 1.

## Step 3 — Key Column

```html
<select v-model="state.selection[which].linkedKeyCol" @change="onKeyColChange">
  <option v-for="h in headerOptions(which)" :key="h" :value="h">{{ h }}</option>
</select>
```

**Invariant**: `linkedKeyCol` is always included in `linkedSelectedCols` (enforced by `onKeyColChange`).

## Step 4 — Merge Columns

- Search filter: `v-model` on text input, filter applied via `v-show`
- Column checkboxes: `@change` with `$event.target.checked`
- Join key row: rendered as a locked display row (checkbox disabled), not a real input
- **No merge button in Step 4**: merge is triggered by `nextStep()` in App.vue when `currentStep === 4`. The footer "下一步" button changes its label to "开始合并" at step 4 (`data-testid="btn-next"`).
- Keep: all `onLinkedColChange`, `selectAll`, `onPerSheetColChange` logic unchanged

## PBT Properties

- **Type safety**: `headerRow` written to state is always `typeof n === 'number' && n >= 1`
- **Checkbox sync**: native checkbox checked state always matches `cfg.checked` reactive value
- **Key invariant**: `linkedKeyCol ∈ linkedSelectedCols` after every `onKeyColChange` call
- **Search idempotency**: same search string always shows same subset of columns
- **Merge trigger**: `btn-next` at step 4 is the sole merge trigger; no `btn-merge` exists
