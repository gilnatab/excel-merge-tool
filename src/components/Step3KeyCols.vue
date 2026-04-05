<template>
  <div class="max-w-5xl mx-auto w-full flex-1 min-h-0 flex flex-col">
    <div class="flex items-center gap-3 mb-6 px-1 shrink-0">
      <label class="flex items-center gap-2 cursor-pointer select-none">
        <input type="checkbox" :checked="bothLinked" :disabled="!canUseLinkedMode" @change="toggleBothLinked" />
        <span class="text-sm font-medium text-on-surface">同步所有工作表（使用相同关联键）</span>
      </label>
      <span v-if="!canUseLinkedMode" class="text-xs text-on-surface-variant">
        当前工作表没有公共关联键，已切换为分别配置
      </span>
    </div>

    <div v-if="bothLinked" class="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
      <div v-for="which in ['A', 'B']" :key="which"
           class="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 flex flex-col min-h-0 overflow-hidden">
        <div class="flex items-center gap-2 mb-4 shrink-0">
          <AppIcon name="link" class="w-5 h-5 text-primary" />
          <span class="font-semibold text-on-surface">文件 {{ which }} 关联键</span>
          <button v-if="checkedConfigs(which).length > 0"
                  @click="which === 'A' ? showFullscreenA = true : showFullscreenB = true"
                  class="ml-auto flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors">
            <AppIcon name="open_in_full" class="w-4 h-4" />
            查看全部
          </button>
        </div>
        <template v-if="checkedConfigs(which).length === 0">
          <p class="text-on-surface-variant text-sm">请先勾选工作表</p>
        </template>
        <template v-else>
          <select
            v-model="state.selection[which].linkedKeyCol"
            class="w-full shrink-0"
            @change="onKeyChange(which, $event.target.value)">
            <option value="" disabled>请选择关联列</option>
            <option v-for="h in headerOptions(which)" :key="h" :value="h">{{ h }}</option>
          </select>
          <div v-if="previewData(which).length > 0" class="mt-4 flex-1 min-h-0 flex flex-col">
            <p class="text-xs text-on-surface-variant mb-2 shrink-0">数据预览</p>
            <InlinePreviewTable
              :rows="previewData(which)"
              :cols="previewHeaders(which)"
              empty-text="暂无数据" />
          </div>
        </template>
      </div>
    </div>

    <div v-else class="flex gap-6 flex-1 min-h-0">
      <aside class="w-80 shrink-0 bg-surface-container-low rounded-2xl p-3 overflow-y-auto">
        <template v-for="which in ['A', 'B']" :key="which">
          <p class="text-xs font-semibold text-on-surface-variant uppercase tracking-wide px-2 py-1 mb-1">
            文件 {{ which }}
          </p>
          <div v-for="item in checkedConfigs(which)" :key="`${which}-${item.idx}`"
               @click="activeSheet = { which, idx: item.idx }"
               :class="[
                 'flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors mb-1',
                 isActive(which, item.idx) ? 'bg-surface-container-lowest border border-outline-variant/40' : 'hover:bg-surface-container'
               ]">
            <div class="flex items-center gap-2 min-w-0">
              <AppIcon name="description" class="w-4 h-4 text-on-surface-variant/60 shrink-0" />
              <span class="text-sm text-on-surface truncate">{{ item.cfg.name }}</span>
            </div>
            <span v-if="item.cfg.keyCol"
                  class="shrink-0 text-xs bg-primary-fixed text-primary px-2 py-0.5 rounded-full font-medium ml-2">
              已配置
            </span>
          </div>
          <div class="h-3"></div>
        </template>
      </aside>

      <section class="flex-1 min-w-0 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 flex flex-col min-h-0">
        <div v-if="!activeSheet" class="flex items-center justify-center h-40 text-on-surface-variant/50">
          <div class="text-center">
            <AppIcon name="link" class="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p class="text-sm">从左侧选择工作表进行配置</p>
          </div>
        </div>
        <template v-else>
          <div class="flex items-center gap-2 mb-5 shrink-0">
            <AppIcon name="link" class="w-5 h-5 text-primary" />
            <span class="font-semibold text-on-surface">
              文件 {{ activeSheet.which }} - {{ activeConfig?.name }}
            </span>
          </div>
          <label class="block text-sm text-on-surface-variant mb-2">关联键列</label>
          <select
            v-model="activeConfig.keyCol"
            class="w-full mb-5"
            @change="onKeyChange(null, $event.target.value)">
            <option value="" disabled>请选择关联列</option>
            <option v-for="h in activeConfig.headers" :key="h" :value="h">{{ h }}</option>
          </select>
          <div class="flex items-start gap-2 bg-surface-container-low rounded-xl p-3 shrink-0">
            <AppIcon name="info" class="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p class="text-xs text-on-surface-variant leading-relaxed">
              关联键是用于匹配两个文件中相同记录的列。选择包含唯一标识符的列，例如 ID 或编号。
            </p>
          </div>
          <div v-if="activeConfig?.data?.length" class="mt-5 flex-1 min-h-0 flex flex-col">
            <div class="mb-3 flex items-center justify-between shrink-0">
              <p class="text-xs text-on-surface-variant">数据预览</p>
              <button
                @click="showIndependentFullscreen = true"
                class="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors">
                <AppIcon name="open_in_full" class="w-4 h-4" />
                查看全部
              </button>
            </div>
            <InlinePreviewTable
              :rows="activeConfig.data"
              :cols="activeConfig.headers"
              empty-text="暂无数据" />
          </div>
        </template>
      </section>
    </div>

    <DataTable v-if="showFullscreenA && checkedConfigs('A')[0]"
               :rows="checkedConfigs('A')[0].cfg.data"
               :cols="checkedConfigs('A')[0].cfg.headers"
               :fullscreen="true"
               title="文件 A 数据预览"
               @close="showFullscreenA = false" />
    <DataTable v-if="showFullscreenB && checkedConfigs('B')[0]"
               :rows="checkedConfigs('B')[0].cfg.data"
               :cols="checkedConfigs('B')[0].cfg.headers"
               :fullscreen="true"
               title="文件 B 数据预览"
               @close="showFullscreenB = false" />
    <DataTable v-if="showIndependentFullscreen && activeConfig"
               :rows="activeConfig.data"
               :cols="activeConfig.headers"
               :fullscreen="true"
               :title="`文件 ${activeSheet?.which} - ${activeConfig?.name}`"
               @close="showIndependentFullscreen = false" />
  </div>
</template>

<script setup>
import { computed, inject, ref, watchEffect } from 'vue';
import AppIcon from './AppIcon.vue';
import DataTable from './DataTable.vue';
import InlinePreviewTable from './InlinePreviewTable.vue';

const { state, onKeyColChange, toggleKeyLinked } = inject('appState');

const activeSheet = ref(null);
const showFullscreenA = ref(false);
const showFullscreenB = ref(false);
const showIndependentFullscreen = ref(false);

const bothLinked = computed(() =>
  state.selection.A.keyLinked && state.selection.B.keyLinked
);

const canUseLinkedMode = computed(() =>
  canLink('A') && canLink('B')
);

function toggleBothLinked() {
  const next = !bothLinked.value;
  if (state.selection.A.keyLinked !== next) toggleKeyLinked('A');
  if (state.selection.B.keyLinked !== next) toggleKeyLinked('B');
}

function checkedConfigs(which) {
  const configs = which === 'A' ? state.sheetConfigsA : state.sheetConfigsB;
  return configs
    .map((cfg, idx) => ({ cfg, idx }))
    .filter(({ cfg }) => cfg.checked && cfg.headers.length > 0);
}

function headerOptions(which) {
  const items = checkedConfigs(which);
  if (items.length === 0) return [];
  return items.slice(1).reduce(
    (common, item) => common.filter(header => item.cfg.headers.includes(header)),
    [...items[0].cfg.headers]
  );
}

function canLink(which) {
  const items = checkedConfigs(which);
  return items.length <= 1 || headerOptions(which).length > 0;
}

function previewData(which) {
  const first = checkedConfigs(which)[0];
  return first ? first.cfg.data : [];
}

function previewHeaders(which) {
  const first = checkedConfigs(which)[0];
  return first ? first.cfg.headers : [];
}

function isActive(which, idx) {
  return activeSheet.value?.which === which && activeSheet.value?.idx === idx;
}

const activeConfig = computed(() => {
  if (!activeSheet.value) return null;
  const { which, idx } = activeSheet.value;
  const configs = which === 'A' ? state.sheetConfigsA : state.sheetConfigsB;
  return configs[idx] ?? null;
});

function onKeyChange(which = null, value = '') {
  if (which) {
    const first = checkedConfigs(which)[0];
    if (first) {
      const nextKey = value || state.selection[which].linkedKeyCol;
      first.cfg.keyCol = nextKey;
      state.selection[which].linkedKeyCol = nextKey;
    }
  } else if (activeSheet.value) {
    const activeWhich = activeSheet.value.which;
    if (activeConfig.value) {
      activeConfig.value.keyCol = value || activeConfig.value.keyCol;
    }
    if (checkedConfigs(activeWhich).length === 1 && activeConfig.value) {
      state.selection[activeWhich].linkedKeyCol = activeConfig.value.keyCol;
    }
  }
  onKeyColChange();
}

watchEffect(() => {
  if (bothLinked.value) {
    activeSheet.value = null;
    return;
  }

  const currentExists = activeSheet.value && checkedConfigs(activeSheet.value.which)
    .some(item => item.idx === activeSheet.value.idx);

  if (currentExists) return;

  const firstA = checkedConfigs('A')[0];
  const firstB = checkedConfigs('B')[0];
  activeSheet.value = firstA
    ? { which: 'A', idx: firstA.idx }
    : firstB
      ? { which: 'B', idx: firstB.idx }
      : null;
});
</script>
