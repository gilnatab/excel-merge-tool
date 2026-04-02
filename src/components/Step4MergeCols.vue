<template>
  <div>
    <div class="cols-row">
      <div v-for="which in ['A', 'B']" :key="which" class="cols-group">
        <h4>文件 {{ which }} 列</h4>
        <div>
          <template v-if="checkedConfigs(which).length === 0">
            <p style="color:#888;font-size:0.85em">请先勾选工作表</p>
          </template>
          <template v-else-if="state.selection[which].colsLinked || checkedConfigs(which).length === 1">
            <input
              class="cols-search"
              v-model="state.selection[which].colSearch"
              placeholder="搜索列名..."
            >
            <div class="cols-toggles">
              <a @click="selectAll(which, true)">全选</a> /
              <a @click="selectAll(which, false)">全不选</a>
            </div>
            <div class="cols-list">
              <label
                v-for="h in checkedConfigs(which)[0].cfg.headers"
                :key="h"
                :class="{ locked: h === linkedKeyCol(which) }"
                v-show="!state.selection[which].colSearch || h.toLowerCase().includes(state.selection[which].colSearch.toLowerCase())"
              >
                <input
                  type="checkbox"
                  :value="h"
                  :checked="isLinkedColSelected(which, h)"
                  :disabled="h === linkedKeyCol(which)"
                  @change="onLinkedColChange(which, h, $event.target.checked)"
                >
                {{ h }}
              </label>
            </div>
            <a v-if="checkedConfigs(which).length > 1" class="apply-all-link" @click="toggleLinked(which)">
              独立配置各工作表
            </a>
          </template>
          <template v-else>
            <div v-for="item in checkedConfigs(which)" :key="item.idx" class="per-sheet-section">
              <div class="per-sheet-label">{{ item.cfg.name }}</div>
              <input
                class="cols-search"
                v-model="state.selection[which].perSheetColSearch[item.idx]"
                placeholder="搜索列名..."
              >
              <div class="cols-toggles">
                <a @click="selectAllPerSheet(item.cfg, which, item.idx, true)">全选</a> /
                <a @click="selectAllPerSheet(item.cfg, which, item.idx, false)">全不选</a>
              </div>
              <div class="cols-list">
                <label
                  v-for="h in item.cfg.headers"
                  :key="h"
                  :class="{ locked: h === item.cfg.keyCol }"
                  v-show="!state.selection[which].perSheetColSearch[item.idx] || h.toLowerCase().includes((state.selection[which].perSheetColSearch[item.idx] || '').toLowerCase())"
                >
                  <input
                    type="checkbox"
                    :value="h"
                    :checked="isPerSheetColSelected(item.cfg, h)"
                    :disabled="h === item.cfg.keyCol"
                    @change="onPerSheetColChange(item.cfg, h, $event.target.checked)"
                  >
                  {{ h }}
                </label>
              </div>
            </div>
            <a class="apply-all-link" @click="toggleLinked(which)">同步所有工作表</a>
          </template>
        </div>
      </div>
    </div>
    <div class="btn-group">
      <button class="btn btn-primary" @click="runMerge">开始合并</button>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';

const { state, toggleColsLinked, runMerge: doRunMerge } = inject('appState');

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
  const keyCol = linkedKeyCol(which);
  if (h === keyCol) return true;
  if (sel.linkedSelectedCols.length === 0) return true;
  return sel.linkedSelectedCols.includes(h);
}

function onLinkedColChange(which, h, checked) {
  const sel = state.selection[which];
  const first = checkedConfigs(which)[0];
  if (!first) return;
  if (sel.linkedSelectedCols.length === 0) {
    sel.linkedSelectedCols = first.cfg.headers.slice();
  }
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
  if (!cfg.selectedCols || cfg.selectedCols.length === 0) return true;
  return cfg.selectedCols.includes(h);
}

function onPerSheetColChange(cfg, h, checked) {
  if (!cfg.selectedCols || cfg.selectedCols.length === 0) {
    cfg.selectedCols = cfg.headers.slice();
  }
  if (checked) {
    if (!cfg.selectedCols.includes(h)) cfg.selectedCols.push(h);
  } else {
    cfg.selectedCols = cfg.selectedCols.filter(c => c !== h);
  }
}

function selectAllPerSheet(cfg, which, idx, checked) {
  if (checked) {
    cfg.selectedCols = cfg.headers.slice();
  } else {
    cfg.selectedCols = [cfg.keyCol].filter(Boolean);
  }
}

function toggleLinked(which) {
  toggleColsLinked(which);
}

function runMerge() {
  doRunMerge();
}
</script>
