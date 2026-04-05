<template>
  <div ref="rootEl"
       :class="[
         'shrink-0 relative transition-[width] duration-200 ease-out',
         isCollapsed ? 'w-16' : 'w-64'
       ]">
    <!-- Collapsed: in-flow, stretches to match the row height -->
    <div v-if="isCollapsed"
         :data-testid="collapsedTestId"
         class="h-full rounded-2xl border border-outline-variant/30 bg-surface-container-lowest flex flex-col items-center justify-center gap-3 px-2 py-4">
      <button @click="isCollapsed = false"
              :data-testid="expandButtonTestId"
              type="button"
              title="展开导出设置"
              class="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant/40 bg-surface-container-low text-on-surface-variant transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
        <AppIcon name="chevron_left" class="w-4 h-4" />
      </button>
      <div class="flex flex-col items-center gap-2 text-center">
        <AppIcon name="settings" class="w-5 h-5 text-on-surface-variant" />
        <span class="text-[11px] font-medium leading-4 text-on-surface-variant">
          导出<br>设置
        </span>
      </div>
    </div>

    <!-- Expanded: absolutely positioned so it overlays content below without affecting row height -->
    <div v-else
         :data-testid="panelTestId"
         class="absolute top-0 left-0 w-full z-20 flex flex-col rounded-2xl shadow-xl shadow-black/10 border border-outline-variant/30 bg-surface-container-lowest">
      <div class="flex justify-end px-3 pt-3 pb-2">
        <button @click="isCollapsed = true"
                :data-testid="collapseButtonTestId"
                type="button"
                class="flex items-center gap-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-xs font-medium text-on-surface-variant transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
          <span>收起</span>
          <AppIcon name="chevron_right" class="w-4 h-4" />
        </button>
      </div>
      <div class="px-3 pb-3">
        <ExportSettings />
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, computed, ref, watch, onBeforeUnmount } from 'vue';
import AppIcon from './AppIcon.vue';
import ExportSettings from './ExportSettings.vue';

defineProps({
  panelTestId: { type: String, required: true },
  collapsedTestId: { type: String, required: true },
  collapseButtonTestId: { type: String, required: true },
  expandButtonTestId: { type: String, required: true },
});

const { state } = inject('appState');
const rootEl = ref(null);

const isCollapsed = computed({
  get: () => state.ui.exportSettingsCollapsed,
  set: value => {
    state.ui.exportSettingsCollapsed = value;
  },
});

function handleOutsideClick(event) {
  if (rootEl.value && !rootEl.value.contains(event.target)) {
    isCollapsed.value = true;
  }
}

let addListenerTimer = null;

watch(
  () => isCollapsed.value,
  (collapsed) => {
    clearTimeout(addListenerTimer);
    if (!collapsed) {
      // Use setTimeout (macrotask) so the expand-button's own click event finishes
      // propagating before we start listening — avoids an immediate self-close.
      // Capture phase lets outside clicks still reach their intended target.
      addListenerTimer = setTimeout(() => {
        document.addEventListener('click', handleOutsideClick, true);
      }, 0);
    } else {
      document.removeEventListener('click', handleOutsideClick, true);
    }
  }
);

onBeforeUnmount(() => {
  clearTimeout(addListenerTimer);
  document.removeEventListener('click', handleOutsideClick, true);
});
</script>
