<template>
  <div class="select-row">
    <div v-for="which in ['A', 'B']" :key="which" class="select-group">
      <label>文件 {{ which }} 关联列 (键)</label>
      <div :id="'keyColList' + which">
        <template v-if="checkedConfigs(which).length === 0">
          <p style="color:#888;font-size:0.85em">请先勾选工作表</p>
        </template>
        <template v-else-if="state.selection[which].keyLinked || checkedConfigs(which).length === 1">
          <select v-model="state.selection[which].linkedKeyCol" @change="onKeyChange">
            <option v-for="h in checkedConfigs(which)[0].cfg.headers" :key="h" :value="h">{{ h }}</option>
          </select>
          <a v-if="checkedConfigs(which).length > 1" class="apply-all-link" @click="toggleLinked(which)">
            独立配置各工作表
          </a>
        </template>
        <template v-else>
          <div v-for="item in checkedConfigs(which)" :key="item.idx" class="per-sheet-section">
            <div class="per-sheet-label">{{ item.cfg.name }}</div>
            <select v-model="item.cfg.keyCol" @change="onKeyChange">
              <option v-for="h in item.cfg.headers" :key="h" :value="h">{{ h }}</option>
            </select>
          </div>
          <a class="apply-all-link" @click="toggleLinked(which)">同步所有工作表</a>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';

const { state, onKeyColChange, toggleKeyLinked } = inject('appState');

function checkedConfigs(which) {
  const configs = which === 'A' ? state.sheetConfigsA : state.sheetConfigsB;
  return configs
    .map((cfg, idx) => ({ cfg, idx }))
    .filter(({ cfg }) => cfg.checked && cfg.headers.length > 0);
}

function onKeyChange() {
  onKeyColChange();
}

function toggleLinked(which) {
  toggleKeyLinked(which);
}
</script>
