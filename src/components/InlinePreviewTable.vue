<template>
  <div class="flex-1 min-h-0 min-w-0 flex flex-col">
    <div v-if="rows.length === 0 || cols.length === 0"
         class="flex-1 flex items-center justify-center text-on-surface-variant text-sm">
      {{ emptyText }}
    </div>
    <template v-else>
      <div ref="viewportRef" class="flex-1 min-h-0 min-w-0 overflow-auto rounded-xl border border-outline-variant/30">
        <table class="w-full min-w-max text-xs border-collapse">
          <thead ref="headerRef" class="bg-surface-container-low sticky top-0">
            <tr>
              <th v-for="col in cols" :key="col"
                  class="px-3 py-2 text-left font-semibold text-on-surface-variant whitespace-nowrap border-b border-outline-variant/40">
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in visibleRows" :key="index"
                :ref="index === 0 ? setSampleRowRef : null"
                class="border-b border-outline-variant/20 hover:bg-surface-container-low/60">
              <td v-for="col in cols" :key="col"
                  class="px-3 py-1.5 whitespace-nowrap text-on-surface">
                {{ row[col] ?? '' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="shrink-0 text-xs text-on-surface-variant/60 px-1 pt-2">
        {{ summaryText }}
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({
  rows: { type: Array, required: true },
  cols: { type: Array, required: true },
  minRows: { type: Number, default: 3 },
  emptyText: { type: String, default: '暂无数据' },
});

const viewportRef = ref(null);
const headerRef = ref(null);
const sampleRowRef = ref(null);
const visibleRowLimit = ref(8);

let resizeObserver = null;
let rafId = null;

const visibleRows = computed(() => props.rows.slice(0, visibleRowLimit.value));

const summaryText = computed(() => {
  const visibleCount = visibleRows.value.length;
  if (props.rows.length <= visibleCount) return `共 ${props.rows.length} 行`;
  return `共 ${props.rows.length} 行，当前视窗显示 ${visibleCount} 行`;
});

function setSampleRowRef(el) {
  sampleRowRef.value = el ?? null;
}

function getRootFontSize() {
  if (typeof window === 'undefined') return 16;
  return Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

function estimateHeaderHeight() {
  const measured = headerRef.value?.getBoundingClientRect().height;
  if (measured) return measured;

  const rem = getRootFontSize();
  const lineHeight = rem;
  const verticalPadding = rem;
  return lineHeight + verticalPadding + 1;
}

function estimateRowHeight() {
  const measured = sampleRowRef.value?.getBoundingClientRect().height;
  if (measured) return measured;

  const rem = getRootFontSize();
  const lineHeight = rem;
  const verticalPadding = rem * 0.75;
  return lineHeight + verticalPadding + 1;
}

function updateVisibleRowLimit() {
  if (!viewportRef.value || props.rows.length === 0 || props.cols.length === 0) return;

  const availableHeight = viewportRef.value.clientHeight;
  const headerHeight = estimateHeaderHeight();
  const rowHeight = estimateRowHeight();
  const bodyHeight = Math.max(availableHeight - headerHeight, rowHeight);
  const nextLimit = Math.max(props.minRows, Math.floor(bodyHeight / rowHeight));

  visibleRowLimit.value = Number.isFinite(nextLimit) ? nextLimit : props.minRows;
}

function scheduleMeasurement() {
  if (typeof window === 'undefined') return;
  if (rafId !== null) window.cancelAnimationFrame(rafId);
  rafId = window.requestAnimationFrame(() => {
    rafId = null;
    updateVisibleRowLimit();
  });
}

onMounted(async () => {
  await nextTick();
  scheduleMeasurement();

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', scheduleMeasurement);
  }

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => scheduleMeasurement());
    if (viewportRef.value) resizeObserver.observe(viewportRef.value);
    if (headerRef.value) resizeObserver.observe(headerRef.value);
  }
});

watch(
  () => [props.rows.length, props.cols.length],
  async () => {
    await nextTick();
    scheduleMeasurement();
  }
);

watch(sampleRowRef, () => {
  scheduleMeasurement();
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', scheduleMeasurement);
    if (rafId !== null) window.cancelAnimationFrame(rafId);
  }
  resizeObserver?.disconnect();
});
</script>
