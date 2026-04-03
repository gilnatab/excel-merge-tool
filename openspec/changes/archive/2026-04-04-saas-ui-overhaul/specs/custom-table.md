# Spec: Custom Table Component (DataTable.vue + Step5 unmatched tables)

## DataTable.vue (matched results — read-only, no checkbox)

Props:
```js
defineProps({
  rows: Array,   // array of row objects
  cols: Array,   // column name strings
})
```

Structure:
- `overflow-x-auto` wrapper
- `<thead>` with `bg-slate-50`, `text-xs uppercase font-semibold text-slate-500`
- `<tbody>` rows with `hover:bg-slate-50/60 border-t border-slate-100`
- Cell max-width: `max-w-[200px] truncate` with `title` attribute for full value
- No selection column

## Unmatched Tables in Step5Results.vue (with checkbox selection)

These replace `NDataTable` with `type: 'selection'` column.

### Selection State

```js
// Computed two-way binding to state.unmatchedSelection.A / .B
const selectedA = computed({
  get: () => state.unmatchedSelection.A,
  set: (v) => { state.unmatchedSelection.A = v }
})
```

### "Select All" Header Checkbox

```js
const allSelectedA = computed(() =>
  unmatchedAData.value.length > 0 &&
  state.unmatchedSelection.A.length === unmatchedAData.value.length
)
function toggleAllA(e) {
  state.unmatchedSelection.A = e.target.checked
    ? unmatchedAData.value.map((_, i) => i)
    : []
}
```

### Row Key

Use array index (`i`) as the selection key — consistent with existing `state.unmatchedSelection.A/B` array-of-indices semantics.

## Editable-Ready Cell Pattern

All `<td>` content wrapped in `<span>` for future drop-in edit:
```html
<td class="px-4 py-2.5 ...">
  <!-- Future: add @dblclick="startEdit(i, col)" here -->
  <span class="block truncate max-w-[200px]" :title="String(row[col] ?? '')">
    {{ row[col] ?? '' }}
  </span>
</td>
```

## PBT Properties

- **Selection bounds**: every index in `unmatchedSelection.A` is a valid row index (0 to length-1)
- **Toggle-all idempotency**: `toggleAll(true)` then `toggleAll(false)` → empty selection
- **Round-trip**: select rows → build final output → output contains exactly those rows
- **No mutation**: `rows` prop is never mutated; display is pure read
