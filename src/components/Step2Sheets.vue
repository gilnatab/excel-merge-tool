<template>
  <div class="max-w-5xl mx-auto w-full flex-1 min-h-0 flex flex-col">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
      <div v-for="which in ['A', 'B']" :key="which" class="min-h-0">
        <section class="h-full min-h-0 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 flex flex-col overflow-hidden">
          <div class="px-4 pt-4 pb-3 border-b border-outline-variant/30 shrink-0 bg-surface-container-low/50">
            <div class="flex items-center justify-between gap-3 mb-1">
              <div>
                <p class="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                  文件 {{ which }}
                </p>
                <p class="text-sm text-on-surface/80 mt-0.5">
                  选择工作表并设置表头起始行
                </p>
              </div>
              <span class="shrink-0 text-xs text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full">
                已选 {{ checkedCount(which) }} / {{ configs(which).length }}
              </span>
            </div>

            <div class="px-2 pt-1 pb-1 h-[7rem]">
              <div class="h-full overflow-x-auto overflow-y-hidden">
                <div class="flex gap-1 min-w-max items-stretch">
                <div v-for="(cfg, idx) in configs(which)" :key="idx"
                     :data-testid="`step2-sheet-card-${which.toLowerCase()}-${idx}`"
                     class="w-56 shrink-0 rounded-2xl border-2 p-3 transition-all my-0.5"
                     :class="[
                       !cfg.checked
                         ? 'cursor-default bg-surface-container opacity-70 border-transparent'
                         : selectedPreviewSheet[which] === idx
                           ? 'cursor-pointer border-primary bg-primary-fixed/35 shadow-sm shadow-primary/10 hover:border-primary hover:bg-primary-fixed/35'
                           : 'cursor-pointer bg-surface-container-lowest border-outline-variant/40 hover:border-outline-variant/70'
                     ]"
                     @click="selectPreview(which, idx)">
                  <div class="flex items-start gap-2">
                    <input type="checkbox"
                           :checked="cfg.checked"
                           @click.stop
                           @change="onCheckChange(which, idx, $event.target.checked)"
                           class="shrink-0 mt-0.5" />
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <div class="sheet-name min-w-0 flex-1 text-sm font-medium text-on-surface truncate">
                          {{ cfg.name }}
                        </div>
                        <button v-if="cfg.checked"
                              @click.stop="selectPreview(which, idx)"
                              aria-label="预览"
                              :data-testid="`btn-step2-preview-${which.toLowerCase()}-${idx}`"
                              class="shrink-0 flex items-center gap-1 text-primary hover:underline text-xs font-medium">
                          <AppIcon name="visibility" class="w-3.5 h-3.5" />
                          预览
                        </button>
                      </div>

                      <div class="mt-3 flex items-center justify-between gap-2 text-xs text-on-surface-variant">
                        <div class="shrink-0">
                          {{ cfg.data.length }} 行
                        </div>
                        <label v-if="cfg.checked"
                               class="flex items-center gap-1.5"
                               @click.stop>
                          <span>起始行</span>
                          <input type="number"
                                 :value="cfg.headerRow"
                                 min="1"
                                 step="1"
                                 class="w-14 text-xs py-0.5 px-2"
                                 @click.stop
                                 @change="onStartRowChange(which, idx, Number($event.target.value) || 1)" />
                          <span>行</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div v-if="!activePreview(which)" class="flex-1 flex items-center justify-center text-on-surface-variant/50 text-sm">
              <div class="text-center">
                <AppIcon name="grid_on" class="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>请选择上方工作表</p>
              </div>
            </div>

            <template v-else>
              <div class="flex items-center justify-between px-4 py-3 border-b border-outline-variant/30 shrink-0">
                <div class="min-w-0">
                  <div class="text-sm font-medium text-on-surface truncate">{{ activePreview(which).name }}</div>
                  <div class="text-xs text-on-surface-variant/70 mt-0.5">
                    {{ activePreview(which).data.length }} 行数据预览
                  </div>
                </div>
                <button @click="openFullscreen(which)"
                        aria-label="全屏查看"
                        :data-testid="`btn-step2-open-fullscreen-${which.toLowerCase()}`"
                        class="shrink-0 flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors">
                  <AppIcon name="open_in_full" class="w-4 h-4" />
                  查看全部
                </button>
              </div>

              <div class="flex-1 min-h-0 min-w-0 p-3 flex">
                <InlinePreviewTable
                  :rows="activePreview(which).data"
                  :cols="activePreview(which).headers"
                  empty-text="暂无数据" />
              </div>
            </template>
          </div>
        </section>
      </div>
    </div>

    <DataTable v-if="showFullscreen && fullscreenCfg"
               :rows="fullscreenCfg.data"
               :cols="fullscreenCfg.headers"
               :fullscreen="true"
               :title="fullscreenCfg.name"
               @close="showFullscreen = false" />
  </div>
</template>

<script setup>
import { inject, ref, watchEffect } from 'vue';
import AppIcon from './AppIcon.vue';
import DataTable from './DataTable.vue';
import InlinePreviewTable from './InlinePreviewTable.vue';

const { state, onSheetCheckChange, onSheetStartRowChange } = inject('appState');

const selectedPreviewSheet = ref({ A: null, B: null });
const showFullscreen = ref(false);
const fullscreenCfg = ref(null);

function configs(which) {
  return which === 'A' ? state.sheetConfigsA : state.sheetConfigsB;
}

function checkedCount(which) {
  return configs(which).filter(cfg => cfg.checked).length;
}

function activePreview(which) {
  const idx = selectedPreviewSheet.value[which];
  if (idx === null) return null;
  const cfg = configs(which)[idx];
  return cfg?.checked ? cfg : null;
}

function selectPreview(which, idx) {
  if (!configs(which)[idx]?.checked) return;
  selectedPreviewSheet.value[which] = idx;
}

function openFullscreen(which) {
  const idx = selectedPreviewSheet.value[which];
  if (idx === null) return;
  fullscreenCfg.value = configs(which)[idx];
  showFullscreen.value = true;
}

function onCheckChange(which, idx, checked) {
  onSheetCheckChange(which, idx, checked);
  if (!checked && selectedPreviewSheet.value[which] === idx) {
    selectedPreviewSheet.value[which] = null;
  }
}

function onStartRowChange(which, idx, value) {
  onSheetStartRowChange(which, idx, value);
}

watchEffect(() => {
  for (const which of ['A', 'B']) {
    const availableConfigs = configs(which);
    const currentIdx = selectedPreviewSheet.value[which];
    const currentCfg = currentIdx === null ? null : availableConfigs[currentIdx];
    if (currentCfg?.checked) continue;

    const firstCheckedIdx = availableConfigs.findIndex(cfg => cfg.checked);
    selectedPreviewSheet.value[which] = firstCheckedIdx >= 0 ? firstCheckedIdx : null;
  }
});
</script>
