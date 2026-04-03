<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div v-for="which in ['A', 'B']" :key="which">
      <div class="font-semibold text-sm text-slate-500 mb-3">文件 {{ which }} 列</div>

      <template v-if="checkedConfigs(which).length === 0">
        <p class="text-slate-400 text-sm">请先勾选工作表</p>
      </template>

      <template v-else-if="state.selection[which].colsLinked || checkedConfigs(which).length === 1">
        <div class="flex gap-2 items-center mb-2">
          <input type="text" v-model="state.selection[which].colSearch"
                 placeholder="搜索列名..." class="flex-1" />
          <span class="text-xs text-primary bg-primary/10 px-2 py-1 rounded whitespace-nowrap">
            已选 {{ getSelectedCount(which) }} / {{ checkedConfigs(which)[0].cfg.headers.length }}
          </span>
        </div>
        <div class="flex gap-2 mb-2">
          <button @click="selectAll(which, true)"
                  class="text-xs text-primary hover:underline">全选</button>
          <span class="text-slate-300">|</span>
          <button @click="selectAll(which, false)"
                  class="text-xs text-primary hover:underline">全不选</button>
        </div>
        <div class="max-h-56 overflow-y-auto border border-slate-200 rounded-lg p-1">
          <template v-for="h in checkedConfigs(which)[0].cfg.headers" :key="h">
            <label
              v-show="!state.selection[which].colSearch || h.toLowerCase().includes(state.selection[which].colSearch.toLowerCase())"
              class="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer text-sm"
              :class="h === linkedKeyCol(which) ? 'opacity-50 cursor-default' : ''"
            >
              <input type="checkbox"
                     :checked="isLinkedColSelected(which, h)"
                     :disabled="h === linkedKeyCol(which)"
                     @change="h !== linkedKeyCol(which) && onLinkedColChange(which, h, $event.target.checked)" />
              <span>{{ h }}</span>
            </label>
          </template>
        </div>
        <a v-if="checkedConfigs(which).length > 1"
           class="block mt-2 text-xs text-primary cursor-pointer hover:underline"
           @click="toggleLinked(which)">独立配置各工作表</a>
      </template>

      <template v-else>
        <div class="flex flex-col gap-3">
          <div v-for="item in checkedConfigs(which)" :key="item.idx"
               class="border border-slate-200 rounded-lg p-3">
            <div class="text-xs font-semibold text-primary mb-2">{{ item.cfg.name }}</div>
            <div class="flex gap-2 items-center mb-2">
              <input type="text"
                     v-model="state.selection[which].perSheetColSearch[item.idx]"
                     placeholder="搜索列名..." class="flex-1" />
              <span class="text-xs text-primary bg-primary/10 px-2 py-1 rounded whitespace-nowrap">
                已选 {{ getPerSheetSelectedCount(item.cfg) }} / {{ item.cfg.headers.length }}
              </span>
            </div>
            <div class="flex gap-2 mb-2">
              <button @click="selectAllPerSheet(item.cfg, true)"
                      class="text-xs text-primary hover:underline">全选</button>
              <span class="text-slate-300">|</span>
              <button @click="selectAllPerSheet(item.cfg, false)"
                      class="text-xs text-primary hover:underline">全不选</button>
            </div>
            <div class="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-1">
              <label
                v-for="h in item.cfg.headers"
                :key="h"
                v-show="!state.selection[which].perSheetColSearch[item.idx] || h.toLowerCase().includes((state.selection[which].perSheetColSearch[item.idx] || '').toLowerCase())"
                class="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-slate-50 cursor-pointer text-sm"
                :class="h === item.cfg.keyCol ? 'opacity-50 cursor-default' : ''"
              >
                <input type="checkbox"
                       :checked="isPerSheetColSelected(item.cfg, h)"
                       :disabled="h === item.cfg.keyCol"
                       @change="h !== item.cfg.keyCol && onPerSheetColChange(item.cfg, h, $event.target.checked)" />
                <span>{{ h }}</span>
              </label>
            </div>
          </div>
        </div>
        <a class="block mt-2 text-xs text-primary cursor-pointer hover:underline"
           @click="toggleLinked(which)">同步所有工作表</a>
      </template>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';

const { state, toggleColsLinked } = inject('appState');

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
  const first = checkedConfigs(which)[0];
  if (!first) return;
  const keyCol = linkedKeyCol(which);
  if (checked) {
    sel.linkedSelectedCols = first.cfg.headers.slice();
  } else {
    sel.linkedSelectedCols = [keyCol].filter(Boolean);
  }
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

function selectAllPerSheet(cfg, checked) {
  if (checked) {
    cfg.selectedCols = cfg.headers.slice();
  } else {
    cfg.selectedCols = [cfg.keyCol].filter(Boolean);
  }
}

function toggleLinked(which) {
  toggleColsLinked(which);
}

function getSelectedCount(which) {
  return state.selection[which].linkedSelectedCols.length;
}

function getPerSheetSelectedCount(cfg) {
  return (cfg.selectedCols || []).length;
}
</script>
