<template>
  <div class="max-w-5xl mx-auto w-full flex-1 min-h-0 flex flex-col">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
      <div v-for="which in ['A', 'B']" :key="which"
           class="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 flex flex-col min-h-0">
        <div class="px-5 py-4 border-b border-outline-variant/30 shrink-0">
          <div class="flex items-center justify-between mb-3">
            <span class="font-semibold text-on-surface">文件 {{ which }}</span>
            <span class="text-xs text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-full">
              已选 {{ getSelectedCount(which) }} / {{ totalCols(which) }}
            </span>
          </div>
          <!-- Search -->
          <div class="relative mb-2">
            <AppIcon name="search" class="w-4 h-4 text-on-surface-variant/50 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" v-model="state.selection[which].colSearch"
                   placeholder="搜索列名..." class="w-full pl-9 pr-3 text-sm" />
          </div>
          <!-- Select all / none -->
          <div class="flex gap-3 text-xs">
            <button @click="selectAll(which, true)"
                    class="text-primary hover:underline font-medium">全选</button>
            <span class="text-outline-variant">|</span>
            <button @click="selectAll(which, false)"
                    class="text-on-surface-variant hover:underline">全不选</button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-2">
          <template v-if="checkedConfigs(which).length === 0">
            <p class="text-on-surface-variant text-sm p-4">请先勾选工作表</p>
          </template>
          <template v-else-if="state.selection[which].colsLinked || checkedConfigs(which).length === 1">
            <!-- Locked join key row -->
            <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-fixed/50 mb-1">
              <AppIcon name="lock" class="w-4 h-4 text-primary shrink-0" />
              <span class="text-sm text-on-surface font-medium flex-1">{{ linkedKeyCol(which) }}</span>
              <span class="text-xs text-primary font-semibold">关联键</span>
            </div>
            <!-- Other columns -->
            <template v-for="h in checkedConfigs(which)[0].cfg.headers" :key="h">
              <label
                v-if="h !== linkedKeyCol(which) && matchesSheetSearch(which, h)"
                class="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-container-low cursor-pointer text-sm transition-colors">
                <input type="checkbox"
                       :checked="isLinkedColSelected(which, h)"
                       @change="onLinkedColChange(which, h, $event.target.checked)" />
                <span class="text-on-surface">{{ h }}</span>
              </label>
            </template>
          </template>
          <template v-else>
            <!-- Per-sheet independent -->
            <div
              v-for="item in checkedConfigs(which)"
              :key="item.idx"
              :data-testid="`step4-sheet-panel-${which.toLowerCase()}-${item.idx}`"
              :class="[
                'mb-4 rounded-xl border transition-colors',
                isSheetCollapsed(which, item.idx)
                  ? 'border-outline-variant/30 bg-surface-container-low/60'
                  : 'border-outline-variant/20 bg-transparent'
              ]">
              <div class="flex items-center gap-2 px-3 py-2.5">
                <div class="min-w-0 flex-1">
                  <div class="text-xs font-semibold text-primary truncate">{{ item.cfg.name }}</div>
                  <div class="text-[11px] text-on-surface-variant mt-0.5">
                    已选 {{ selectedColsForSheet(item.cfg) }} / {{ totalColsForSheet(item.cfg) }}
                  </div>
                </div>
                <button
                  type="button"
                  :data-testid="`btn-step4-toggle-sheet-${which.toLowerCase()}-${item.idx}`"
                  @click="toggleSheetCollapsed(which, item.idx)"
                  class="flex items-center gap-1.5 rounded-lg border border-outline-variant/30 bg-surface-container-low px-2.5 py-1.5 text-xs text-on-surface-variant transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
                  <span>{{ isSheetCollapsed(which, item.idx) ? '展开' : '收起' }}</span>
                  <AppIcon :name="isSheetCollapsed(which, item.idx) ? 'chevron_right' : 'expand_more'" class="w-4 h-4" />
                </button>
              </div>
              <template v-if="!isSheetCollapsed(which, item.idx)">
                <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-fixed/50 mb-1 mx-2">
                  <AppIcon name="lock" class="w-4 h-4 text-primary shrink-0" />
                  <span class="text-sm text-on-surface font-medium flex-1">{{ item.cfg.keyCol }}</span>
                  <span class="text-xs text-primary font-semibold">关联键</span>
                </div>
                <template v-for="h in item.cfg.headers" :key="h">
                  <label
                    v-if="h !== item.cfg.keyCol && matchesSheetSearch(which, h)"
                    class="mx-2 flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-surface-container-low cursor-pointer text-sm transition-colors">
                    <input type="checkbox"
                           :checked="isPerSheetColSelected(item.cfg, h)"
                           @change="onPerSheetColChange(item.cfg, h, $event.target.checked)" />
                    <span class="text-on-surface">{{ h }}</span>
                  </label>
                </template>
                <div class="h-2"></div>
              </template>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, ref } from 'vue';
import AppIcon from './AppIcon.vue';

const { state, toggleColsLinked } = inject('appState');
const collapsedSheets = ref({ A: {}, B: {} });

function checkedConfigs(which) {
  const configs = which === 'A' ? state.sheetConfigsA : state.sheetConfigsB;
  return configs
    .map((cfg, idx) => ({ cfg, idx }))
    .filter(({ cfg }) => cfg.checked && cfg.headers.length > 0);
}

function linkedKeyCol(which) {
  const sel = state.selection[which];
  const first = checkedConfigs(which)[0];
  if (!first) return '';
  return sel.keyLinked || checkedConfigs(which).length === 1 ? sel.linkedKeyCol : first.cfg.keyCol;
}

function totalCols(which) {
  const items = checkedConfigs(which);
  if (items.length === 0) return 0;

  if (state.selection[which].colsLinked || items.length === 1) {
    const keyCol = linkedKeyCol(which);
    return items[0].cfg.headers.filter(h => h !== keyCol).length;
  }

  return items.reduce((sum, { cfg }) => (
    sum + cfg.headers.filter(h => h !== cfg.keyCol).length
  ), 0);
}

function getSelectedCount(which) {
  const items = checkedConfigs(which);
  if (items.length === 0) return 0;

  if (state.selection[which].colsLinked || items.length === 1) {
    const keyCol = linkedKeyCol(which);
    return state.selection[which].linkedSelectedCols.filter(h => h !== keyCol).length;
  }

  return items.reduce((sum, { cfg }) => (
    sum + (cfg.selectedCols || []).filter(h => h !== cfg.keyCol).length
  ), 0);
}

function totalColsForSheet(cfg) {
  return cfg.headers.filter(h => h !== cfg.keyCol).length;
}

function selectedColsForSheet(cfg) {
  return (cfg.selectedCols || []).filter(h => h !== cfg.keyCol).length;
}

function matchesSheetSearch(which, header) {
  const search = (state.selection[which].colSearch || '').trim().toLowerCase();
  return !search || header.toLowerCase().includes(search);
}

function isLinkedColSelected(which, h) {
  const sel = state.selection[which];
  if (h === linkedKeyCol(which)) return true;
  return sel.linkedSelectedCols.includes(h);
}

function onLinkedColChange(which, h, checked) {
  const sel = state.selection[which];
  if (checked) {
    if (!sel.linkedSelectedCols.includes(h)) sel.linkedSelectedCols.push(h);
  } else {
    sel.linkedSelectedCols = sel.linkedSelectedCols.filter(c => c !== h);
  }
}

function selectAll(which, checked) {
  const sel = state.selection[which];
  const items = checkedConfigs(which);
  const first = items[0];
  if (!first) return;

  if (state.selection[which].colsLinked || items.length === 1) {
    const keyCol = linkedKeyCol(which);
    if (checked) {
      sel.linkedSelectedCols = first.cfg.headers.filter(h => h !== keyCol);
    } else {
      sel.linkedSelectedCols = [];
    }
    return;
  }

  items.forEach(({ cfg }) => {
    cfg.selectedCols = checked
      ? cfg.headers.filter(h => h !== cfg.keyCol)
      : [];
  });
}

function isPerSheetColSelected(cfg, h) {
  if (h === cfg.keyCol) return true;
  return (cfg.selectedCols || []).includes(h);
}

function onPerSheetColChange(cfg, h, checked) {
  if (!cfg.selectedCols) cfg.selectedCols = [];
  if (checked) {
    if (!cfg.selectedCols.includes(h)) cfg.selectedCols.push(h);
  } else {
    cfg.selectedCols = cfg.selectedCols.filter(c => c !== h);
  }
}

function isSheetCollapsed(which, idx) {
  return !!collapsedSheets.value[which]?.[idx];
}

function toggleSheetCollapsed(which, idx) {
  collapsedSheets.value[which][idx] = !collapsedSheets.value[which][idx];
}

function toggleLinked(which) {
  toggleColsLinked(which);
}
</script>
