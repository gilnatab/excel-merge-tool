# Spec: Custom Table Component (DataTable.vue + Step5 unmatched tables)

## DataTable.vue

### Props

```js
defineProps({
  rows:              { type: Array,   required: true },
  cols:              { type: Array,   required: true },
  pageSize:          { type: Number,  default: 50 },
  fullscreen:        { type: Boolean, default: false },
  title:             { type: String,  default: '' },
  searchPlaceholder: { type: String,  default: '搜索...' },
})
```

### Emits

```js
emits: ['close']
```

### Internal State

```js
const search = ref('')
const page   = ref(1)

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return props.rows
  return props.rows.filter(row =>
    props.cols.some(col => String(row[col] ?? '').toLowerCase().includes(q))
  )
})

// Reset page whenever filtered length or source length changes
watch([() => filteredRows.value.length, () => props.rows.length], () => {
  page.value = 1
})
```

### Render Contract

| `fullscreen` | Behavior |
|---|---|
| `false` | Embedded: search bar + row count + table + pagination rendered inline |
| `true` | Fullscreen Teleport overlay: `fixed inset-0 z-50 bg-white flex flex-col` |

### Fullscreen Shell Structure

```html
<Teleport to="body" v-if="fullscreen">
  <div class="fixed inset-0 z-50 bg-white flex flex-col">
    <!-- Header: title + close button -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-outline-variant/30 bg-surface-container-low shrink-0">
      <span class="text-sm font-medium text-on-surface">{{ title }}</span>
      <button @click="$emit('close')"><AppIcon name="close" class="w-5 h-5" /></button>
    </div>
    <!-- Search bar (shrink-0) -->
    <!-- Table + pagination (flex-1 overflow-auto) -->
  </div>
</Teleport>
```

### Table Styles (Precision Layer tokens)

- Header: `bg-surface-container-low`, `text-on-surface-variant`, `text-xs uppercase font-semibold`
- Row hover: `hover:bg-surface-container-low/60 border-t border-outline-variant/20`
- Cell: `text-on-surface max-w-[200px] truncate`

## Unmatched Tables in Step5Results.vue (inline, with checkbox selection)

These are rendered as inline `<table>` elements directly in the component, not via `DataTable.vue`, because they need a selection checkbox column.

### Selection State

```js
// Two-way binding to state.unmatchedSelection.A / .B
const allSelectedA = computed(() =>
  total > 0 && state.unmatchedSelection.A.length === total
)
function toggleAllA(checked) {
  state.unmatchedSelection.A = checked
    ? state.mergeResult.unmatchedA.map((_, i) => i)
    : []
}
```

### Row Key

Array index (`i`) as the selection key — consistent with `state.unmatchedSelection.A/B` array-of-indices semantics.

### Fullscreen Expand

Each unmatched table has a fullscreen expand button that passes a flattened `rows` array to `DataTable` with `fullscreen=true`. The flattened rows map `item._row` to the appropriate `colsA`/`colsB` columns.

## PBT Properties

- **Selection bounds**: every index in `unmatchedSelection.A/B` is a valid row index (0 to `length - 1`)
- **Toggle-all idempotency**: `toggleAll(true)` then `toggleAll(false)` → empty selection
- **Round-trip**: selected unmatched rows appear in `buildFinalOutput` output
- **No mutation**: `rows` prop is never mutated; display is pure read
- **Search filter**: `filteredRows.length <= rows.length` always
- **Page reset**: `page` resets to 1 whenever `rows` length or `filteredRows` length changes
- **Fullscreen isolation**: fullscreen state is component-local ref; closing one overlay does not affect others
- **`$emit('close')` contract**: fires only from the fullscreen close button, never from embedded mode
