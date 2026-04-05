<template>
  <!-- Fullscreen overlay via Teleport -->
  <Teleport v-if="fullscreen" to="body">
    <div class="fixed inset-0 z-50 bg-white flex flex-col">
      <div class="flex items-center justify-between px-4 py-3 border-b border-outline-variant/30 bg-surface-container-low shrink-0">
        <span class="text-sm font-medium text-on-surface">{{ title }}</span>
        <button @click="$emit('close')" data-testid="btn-close-fullscreen"
                class="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant">
          <AppIcon name="close" class="w-5 h-5" />
        </button>
      </div>
      <div class="px-4 py-2 border-b border-outline-variant/20 shrink-0">
        <div class="relative">
          <AppIcon name="search" class="w-4 h-4 text-on-surface-variant/50 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="search" v-model="search" :placeholder="searchPlaceholder"
                 class="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg outline-none
                        bg-surface-container-lowest border border-outline-variant
                        focus:ring-2 focus:ring-primary/20 focus:border-primary" />
        </div>
      </div>
      <div class="flex-1 overflow-auto px-4 py-2">
        <div class="overflow-x-auto rounded-xl border border-outline-variant/40">
          <table class="w-full text-sm border-collapse">
            <thead class="bg-surface-container-low border-b border-outline-variant/40">
              <tr>
                <th v-for="col in cols" :key="col"
                    class="px-4 py-3 text-left text-xs uppercase font-semibold text-on-surface-variant whitespace-nowrap">
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in pagedRows" :key="i"
                  class="border-t border-outline-variant/20 hover:bg-surface-container-low/60 transition-colors">
                <td v-for="col in cols" :key="col"
                    class="px-4 py-2.5 text-on-surface whitespace-nowrap max-w-[200px] truncate">
                  <span>{{ row[col] ?? '' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="filteredRows.length > pageSize"
             class="flex items-center justify-between mt-3 text-sm text-on-surface-variant">
          <button @click="page = Math.max(1, page - 1)" :disabled="page <= 1"
                  class="px-3 py-1 border border-outline-variant rounded-lg hover:bg-surface-container-low disabled:opacity-40">
            ← 上一页
          </button>
          <span>第 {{ page }} / {{ totalPages }} 页</span>
          <button @click="page = Math.min(totalPages, page + 1)" :disabled="page >= totalPages"
                  class="px-3 py-1 border border-outline-variant rounded-lg hover:bg-surface-container-low disabled:opacity-40">
            下一页 →
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Embedded mode -->
  <template v-if="!fullscreen">
    <div v-if="rows.length === 0" class="py-10 text-center text-on-surface-variant/60 text-sm">无数据</div>
    <template v-else>
      <div class="relative mb-3">
        <AppIcon name="search" class="w-4 h-4 text-on-surface-variant/50 absolute left-3 top-1/2 -translate-y-1/2" />
        <input type="search" v-model="search" :placeholder="searchPlaceholder"
               class="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg outline-none
                      bg-surface-container-lowest border border-outline-variant
                      focus:ring-2 focus:ring-primary/20 focus:border-primary" />
      </div>
      <div class="text-xs text-on-surface-variant/60 mb-2">
        {{ filteredRows.length !== rows.length ? `${filteredRows.length} / ${rows.length} 条` : `共 ${rows.length} 条` }}
      </div>
      <div class="overflow-x-auto rounded-xl border border-outline-variant/40">
        <table class="w-full text-sm border-collapse">
          <thead class="bg-surface-container-low border-b border-outline-variant/40">
            <tr>
              <th v-for="col in cols" :key="col"
                  class="px-4 py-3 text-left text-xs uppercase font-semibold text-on-surface-variant whitespace-nowrap">
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in pagedRows" :key="i"
                class="border-t border-outline-variant/20 hover:bg-surface-container-low/60 transition-colors">
              <td v-for="col in cols" :key="col"
                  class="px-4 py-2.5 text-on-surface whitespace-nowrap max-w-[200px] truncate">
                <span>{{ row[col] ?? '' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="filteredRows.length > pageSize"
           class="flex items-center justify-between mt-3 text-sm text-on-surface-variant">
        <button @click="page = Math.max(1, page - 1)" :disabled="page <= 1"
                class="px-3 py-1 border border-outline-variant rounded-lg hover:bg-surface-container-low disabled:opacity-40">
          ← 上一页
        </button>
        <span>第 {{ page }} / {{ totalPages }} 页</span>
        <button @click="page = Math.min(totalPages, page + 1)" :disabled="page >= totalPages"
                class="px-3 py-1 border border-outline-variant rounded-lg hover:bg-surface-container-low disabled:opacity-40">
          下一页 →
        </button>
      </div>
    </template>
  </template>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import AppIcon from './AppIcon.vue';

const props = defineProps({
  rows: { type: Array, required: true },
  cols: { type: Array, required: true },
  pageSize: { type: Number, default: 50 },
  fullscreen: { type: Boolean, default: false },
  title: { type: String, default: '' },
  searchPlaceholder: { type: String, default: '搜索...' },
});

defineEmits(['close']);

const page = ref(1);
const search = ref('');

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return props.rows;
  return props.rows.filter(row =>
    props.cols.some(col => String(row[col] ?? '').toLowerCase().includes(q))
  );
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / props.pageSize)));

const pagedRows = computed(() => {
  const start = (page.value - 1) * props.pageSize;
  return filteredRows.value.slice(start, start + props.pageSize);
});

watch([() => filteredRows.value.length, () => props.rows.length], () => {
  page.value = 1;
});
</script>
