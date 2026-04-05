<template>
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

      <div class="flex-1 min-h-0 flex flex-col px-4">
        <div class="flex-1 min-h-0 overflow-auto py-2">
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
        </div>

        <div class="shrink-0 py-3 flex flex-wrap items-center justify-between gap-3 text-sm text-on-surface-variant border-t border-outline-variant/20">
          <div class="flex flex-wrap items-center gap-3">
            <span data-testid="text-pagination-summary">{{ rangeSummaryText }}</span>
            <span class="hidden sm:block w-px h-6 bg-outline-variant/30"></span>
            <label class="flex items-center gap-2">
              <span>每页</span>
              <select v-model.number="currentPageSize"
                      data-testid="select-page-size"
                      class="min-w-20 py-1.5 pr-8 text-sm">
                <option v-for="size in fullscreenPageSizeOptions" :key="size" :value="size">
                  {{ formatNumber(size) }}
                </option>
              </select>
              <span>条</span>
            </label>
          </div>

          <div class="flex flex-wrap items-center justify-end gap-3">
            <div class="flex items-center gap-2">
              <span>跳至</span>
              <input v-model="jumpPageInput"
                     data-testid="input-jump-page"
                     type="number"
                     min="1"
                     :max="totalPages"
                     class="w-20 py-1 px-2 text-sm"
                     @keydown.enter.prevent="applyJumpPage"
                     @blur="normalizeJumpPageInput" />
              <span>页</span>
              <button @click="applyJumpPage"
                      data-testid="btn-jump-page"
                      class="px-3 py-1 border border-outline-variant rounded-lg hover:bg-surface-container-low">
                跳转
              </button>
            </div>
            <span class="hidden sm:block w-px h-6 bg-outline-variant/30"></span>
            <div class="flex flex-wrap items-center gap-3">
              <button @click="goToPreviousPage" :disabled="page <= 1"
                      class="px-3 py-1 border border-outline-variant rounded-lg hover:bg-surface-container-low disabled:opacity-40">
                上一页
              </button>
              <span>第 {{ formatNumber(page) }} / {{ formatNumber(totalPages) }} 页</span>
              <button @click="goToNextPage" :disabled="page >= totalPages"
                      class="px-3 py-1 border border-outline-variant rounded-lg hover:bg-surface-container-low disabled:opacity-40">
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <template v-if="!fullscreen">
    <div v-if="rows.length === 0" class="py-10 text-center text-on-surface-variant/60 text-sm">暂无数据</div>
    <template v-else>
      <div class="relative mb-3">
        <AppIcon name="search" class="w-4 h-4 text-on-surface-variant/50 absolute left-3 top-1/2 -translate-y-1/2" />
        <input type="search" v-model="search" :placeholder="searchPlaceholder"
               class="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg outline-none
                      bg-surface-container-lowest border border-outline-variant
                      focus:ring-2 focus:ring-primary/20 focus:border-primary" />
      </div>

      <div class="text-xs text-on-surface-variant/60 mb-2">
        {{ rangeSummaryText }}
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

      <div v-if="totalPages > 1"
           class="flex items-center justify-end gap-3 mt-3 text-sm text-on-surface-variant">
        <button @click="goToPreviousPage" :disabled="page <= 1"
                class="px-3 py-1 border border-outline-variant rounded-lg hover:bg-surface-container-low disabled:opacity-40">
          上一页
        </button>
        <span>第 {{ formatNumber(page) }} / {{ formatNumber(totalPages) }} 页</span>
        <button @click="goToNextPage" :disabled="page >= totalPages"
                class="px-3 py-1 border border-outline-variant rounded-lg hover:bg-surface-container-low disabled:opacity-40">
          下一页
        </button>
      </div>
    </template>
  </template>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
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
const currentPageSize = ref(props.pageSize);
const jumpPageInput = ref('1');

const numberFormatter = new Intl.NumberFormat('zh-CN');

const filteredRows = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return props.rows;
  return props.rows.filter(row =>
    props.cols.some(col => String(row[col] ?? '').toLowerCase().includes(q))
  );
});

const fullscreenPageSizeOptions = computed(() =>
  [...new Set([25, 50, 100, 200, props.pageSize].filter(size => size > 0))].sort((a, b) => a - b)
);

const effectivePageSize = computed(() =>
  props.fullscreen ? currentPageSize.value : props.pageSize
);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredRows.value.length / effectivePageSize.value))
);

const pageStart = computed(() => {
  if (filteredRows.value.length === 0) return 0;
  return (page.value - 1) * effectivePageSize.value + 1;
});

const pageEnd = computed(() => {
  if (filteredRows.value.length === 0) return 0;
  return Math.min(pageStart.value + effectivePageSize.value - 1, filteredRows.value.length);
});

const rangeSummaryText = computed(() => {
  let text = `显示 ${formatNumber(pageStart.value)} 至 ${formatNumber(pageEnd.value)} 条，共 ${formatNumber(filteredRows.value.length)} 条记录`;
  if (filteredRows.value.length !== props.rows.length) {
    text += `（筛选前共 ${formatNumber(props.rows.length)} 条）`;
  }
  return text;
});

const pagedRows = computed(() => {
  const start = (page.value - 1) * effectivePageSize.value;
  return filteredRows.value.slice(start, start + effectivePageSize.value);
});

function formatNumber(value) {
  return numberFormatter.format(value);
}

function goToPreviousPage() {
  page.value = Math.max(1, page.value - 1);
}

function goToNextPage() {
  page.value = Math.min(totalPages.value, page.value + 1);
}

function syncJumpInput() {
  jumpPageInput.value = String(page.value);
}

function normalizeJumpPageInput() {
  const parsed = Number.parseInt(jumpPageInput.value, 10);
  if (!Number.isFinite(parsed)) {
    syncJumpInput();
    return;
  }
  jumpPageInput.value = String(Math.min(totalPages.value, Math.max(1, parsed)));
}

function applyJumpPage() {
  const parsed = Number.parseInt(jumpPageInput.value, 10);
  if (!Number.isFinite(parsed)) {
    syncJumpInput();
    return;
  }
  page.value = Math.min(totalPages.value, Math.max(1, parsed));
}

watch(
  () => props.pageSize,
  size => {
    currentPageSize.value = size;
  }
);

watch([() => filteredRows.value.length, () => props.rows.length], () => {
  page.value = 1;
});

watch(effectivePageSize, () => {
  page.value = 1;
});

watch(totalPages, total => {
  if (page.value > total) page.value = total;
});

watch(page, () => {
  syncJumpInput();
}, { immediate: true });
</script>
