<template>
  <div>
    <NGrid :cols="{ xs: 1, m: 2 }" :x-gap="16" :y-gap="16" responsive="screen">
      <NGridItem v-for="which in ['A', 'B']" :key="which">
        <div style="font-weight: 600; font-size: 0.9em; color: #555; margin-bottom: 10px;">
          文件 {{ which }} 列
        </div>
        <template v-if="checkedConfigs(which).length === 0">
          <p style="color: #aaa; font-size: 0.85em;">请先勾选工作表</p>
        </template>
        <template v-else-if="state.selection[which].colsLinked || checkedConfigs(which).length === 1">
          <div style="display: flex; gap: 8px; align-items: flex-start; margin-bottom: 8px;">
            <NInput
              v-model:value="state.selection[which].colSearch"
              placeholder="搜索列名..."
              clearable
              size="small"
              style="flex: 1"
            />
            <div style="font-size: 0.8em; color: #4361ee; background: #f0f3ff; padding: 4px 8px; border-radius: 4px; white-space: nowrap; margin-top: 2px;">
              已选 {{ getSelectedCount(which) }} / {{ checkedConfigs(which)[0].cfg.headers.length }}
            </div>
          </div>
          <div class="cols-actions">
            <NButton text size="small" @click="selectAll(which, true)">全选</NButton>
            <span style="color: #ccc; font-size: 0.9em;">|</span>
            <NButton text size="small" @click="selectAll(which, false)">全不选</NButton>
          </div>
          <div class="cols-list">
            <template v-for="h in checkedConfigs(which)[0].cfg.headers" :key="h">
              <div
                v-show="!state.selection[which].colSearch || h.toLowerCase().includes(state.selection[which].colSearch.toLowerCase())"
                class="cols-list-item"
                :class="{ 'is-locked': h === linkedKeyCol(which) }"
                @click="h !== linkedKeyCol(which) && onLinkedColChange(which, h, !isLinkedColSelected(which, h))"
              >
                <NCheckbox
                  :checked="isLinkedColSelected(which, h)"
                  :disabled="h === linkedKeyCol(which)"
                  @update:checked="(v) => onLinkedColChange(which, h, v)"
                  @click.stop
                />
                <span class="col-name-text">{{ h }}</span>
              </div>
            </template>
          </div>
          <a v-if="checkedConfigs(which).length > 1" class="apply-all-link" @click="toggleLinked(which)">
            独立配置各工作表
          </a>
        </template>
        <template v-else>
          <NSpace vertical :size="8">
            <div v-for="item in checkedConfigs(which)" :key="item.idx" class="per-sheet-section">
              <div class="per-sheet-label">{{ item.cfg.name }}</div>
              <div style="display: flex; gap: 8px; align-items: flex-start; margin-bottom: 8px;">
                <NInput
                  v-model:value="state.selection[which].perSheetColSearch[item.idx]"
                  placeholder="搜索列名..."
                  clearable
                  size="small"
                  style="flex: 1"
                />
                <div style="font-size: 0.8em; color: #4361ee; background: #f0f3ff; padding: 4px 8px; border-radius: 4px; white-space: nowrap; margin-top: 2px;">
                  已选 {{ getPerSheetSelectedCount(item.cfg) }} / {{ item.cfg.headers.length }}
                </div>
              </div>
              <div class="cols-actions">
                <NButton text size="small" @click="selectAllPerSheet(item.cfg, true)">全选</NButton>
                <span style="color: #ccc; font-size: 0.9em;">|</span>
                <NButton text size="small" @click="selectAllPerSheet(item.cfg, false)">全不选</NButton>
              </div>
              <div class="cols-list">
                <div
                  v-for="h in item.cfg.headers"
                  :key="h"
                  v-show="!state.selection[which].perSheetColSearch[item.idx] || h.toLowerCase().includes((state.selection[which].perSheetColSearch[item.idx] || '').toLowerCase())"
                  class="cols-list-item"
                  :class="{ 'is-locked': h === item.cfg.keyCol }"
                  @click="h !== item.cfg.keyCol && onPerSheetColChange(item.cfg, h, !isPerSheetColSelected(item.cfg, h))"
                >
                  <NCheckbox
                    :checked="isPerSheetColSelected(item.cfg, h)"
                    :disabled="h === item.cfg.keyCol"
                    @update:checked="(v) => onPerSheetColChange(item.cfg, h, v)"
                    @click.stop
                  />
                  <span class="col-name-text">{{ h }}</span>
                </div>
              </div>
            </div>
          </NSpace>
          <a class="apply-all-link" @click="toggleLinked(which)">同步所有工作表</a>
        </template>
      </NGridItem>
    </NGrid>

    <div style="display: flex; justify-content: center; margin-top: 20px;">
      <NButton type="primary" size="large" @click="runMerge">开始合并</NButton>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';
import { NGrid, NGridItem, NInput, NCheckbox, NButton, NSpace } from 'naive-ui';

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

function runMerge() {
  doRunMerge();
}
</script>
