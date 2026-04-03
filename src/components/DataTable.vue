<template>
  <NEmpty v-if="rows.length === 0" description="无数据" style="padding: 40px 0;" />
  <NDataTable
    v-else
    :columns="tableColumns"
    :data="rows"
    :max-height="400"
    :pagination="paginationConfig"
    :scroll-x="scrollWidth"
    :bordered="false"
    size="small"
  />
</template>

<script setup>
import { computed } from 'vue';
import { NDataTable, NEmpty } from 'naive-ui';

const props = defineProps({
  rows: { type: Array, required: true },
  cols: { type: Array, required: true },
  pageSize: { type: Number, default: 50 },
});

const tableColumns = computed(() =>
  props.cols.map(col => ({
    title: col,
    key: col,
    width: Math.min(Math.max(col.length * 10 + 24, 80), 220),
    ellipsis: { tooltip: true },
  }))
);

const paginationConfig = computed(() => ({
  pageSize: props.pageSize,
  showSizePicker: false,
  prefix: ({ itemCount }) => `共 ${itemCount} 条`,
}));

const scrollWidth = computed(() =>
  props.cols.reduce((sum, col) => sum + Math.min(Math.max(col.length * 10 + 24, 80), 220), 0)
);
</script>
