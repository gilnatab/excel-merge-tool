# Spec: DataTable.vue — Extended Interface

## New Props
```js
props: {
  rows: { type: Array, required: true },
  cols: { type: Array, required: true },
  pageSize: { type: Number, default: 50 },
  fullscreen: { type: Boolean, default: false },
  title: { type: String, default: '' },
  searchPlaceholder: { type: String, default: '搜索...' }
}
```

## New Emits
```js
emits: ['close']
```

## Internal State
```js
const search = ref('')
const currentPage = ref(1)

const filteredRows = computed(() => {
  if (!search.value.trim()) return props.rows
  const q = search.value.trim().toLowerCase()
  return props.rows.filter(row =>
    props.cols.some(col => String(row[col] ?? '').toLowerCase().includes(q))
  )
})

// Reset page when data changes
watch(() => filteredRows.value.length, () => { currentPage.value = 1 })
watch(() => props.rows.length, () => { currentPage.value = 1 })
```

## Render Contract
- `fullscreen === false`: render embedded table with search + pagination (current card layout preserved, enhanced)
- `fullscreen === true`: render `fixed inset-0 z-50 bg-white flex flex-col` modal shell

## Fullscreen Shell Structure
```html
<template>
  <Teleport to="body" v-if="fullscreen">
    <div class="fixed inset-0 z-50 bg-white flex flex-col">
      <div class="flex items-center justify-between px-4 py-3 border-b border-outline-variant/30 bg-surface-container-low shrink-0">
        <span class="text-sm font-medium text-on-surface truncate">{{ title }}</span>
        <button @click="$emit('close')" class="p-1 hover:bg-surface-container rounded-lg">
          <AppIcon name="close" class="w-5 h-5 text-on-surface-variant" />
        </button>
      </div>
      <!-- search bar -->
      <!-- table -->
      <!-- pagination -->
    </div>
  </Teleport>

  <!-- Normal embedded mode (v-else or always rendered when !fullscreen) -->
  <div v-if="!fullscreen">
    <!-- search bar -->
    <!-- table -->
    <!-- pagination -->
  </div>
</template>
```

## PBT
- `filteredRows.length <= rows.length` always
- `currentPage` resets to 1 whenever `rows` length changes
- `fullscreen === false` → no fixed overlay rendered
- `$emit('close')` fires only from fullscreen close button
- Search filter is case-insensitive substring match across all `cols`
