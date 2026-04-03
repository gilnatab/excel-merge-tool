<template>
  <div v-if="rows.length === 0" class="py-10 text-center text-slate-400 text-sm">无数据</div>
  <template v-else>
    <div class="text-xs text-slate-400 mb-2">共 {{ rows.length }} 条</div>
    <div class="overflow-x-auto rounded-xl border border-slate-200">
      <table class="w-full text-sm border-collapse">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th v-for="col in cols" :key="col"
                class="px-4 py-3 text-left text-xs uppercase font-semibold text-slate-500 whitespace-nowrap">
              {{ col }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in pagedRows" :key="i"
              class="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
            <td v-for="col in cols" :key="col"
                class="px-4 py-2.5 text-slate-700 whitespace-nowrap max-w-[200px] truncate">
              <span>{{ row[col] ?? '' }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="rows.length > pageSize" class="flex items-center justify-between mt-3 text-sm text-slate-500">
      <button @click="page = Math.max(1, page - 1)" :disabled="page <= 1"
              class="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">
        ← 上一页
      </button>
      <span>第 {{ page }} / {{ totalPages }} 页</span>
      <button @click="page = Math.min(totalPages, page + 1)" :disabled="page >= totalPages"
              class="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40">
        下一页 →
      </button>
    </div>
  </template>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  rows: { type: Array, required: true },
  cols: { type: Array, required: true },
  pageSize: { type: Number, default: 50 },
});

const page = ref(1);

const totalPages = computed(() => Math.ceil(props.rows.length / props.pageSize));

const pagedRows = computed(() => {
  const start = (page.value - 1) * props.pageSize;
  return props.rows.slice(start, start + props.pageSize);
});
</script>
