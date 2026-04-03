<template>
  <NGrid :cols="{ xs: 1, m: 2 }" :x-gap="16" :y-gap="16" responsive="screen">
    <NGridItem v-for="which in ['A', 'B']" :key="which">
      <div style="font-weight: 600; font-size: 0.9em; color: #555; margin-bottom: 8px;">
        文件 {{ which }} 关联列 (键)
      </div>
      <template v-if="checkedConfigs(which).length === 0">
        <p style="color: #aaa; font-size: 0.85em;">请先勾选工作表</p>
      </template>
      <template v-else-if="state.selection[which].keyLinked || checkedConfigs(which).length === 1">
        <NSelect
          v-model:value="state.selection[which].linkedKeyCol"
          :options="headerOptions(which)"
          placeholder="请选择关联列"
          @update:value="onKeyChange"
        />
        <a
          v-if="checkedConfigs(which).length > 1"
          class="apply-all-link"
          @click="toggleLinked(which)"
        >独立配置各工作表</a>
      </template>
      <template v-else>
        <NSpace vertical :size="8">
          <div v-for="item in checkedConfigs(which)" :key="item.idx" class="per-sheet-section">
            <div class="per-sheet-label">{{ item.cfg.name }}</div>
            <NSelect
              v-model:value="item.cfg.keyCol"
              :options="item.cfg.headers.map(h => ({ label: h, value: h }))"
              placeholder="请选择关联列"
              @update:value="onKeyChange"
            />
          </div>
        </NSpace>
        <a class="apply-all-link" @click="toggleLinked(which)">同步所有工作表</a>
      </template>
    </NGridItem>
  </NGrid>
</template>

<script setup>
import { inject } from 'vue';
import { NGrid, NGridItem, NSelect, NSpace } from 'naive-ui';

const { state, onKeyColChange, toggleKeyLinked } = inject('appState');

function checkedConfigs(which) {
  const configs = which === 'A' ? state.sheetConfigsA : state.sheetConfigsB;
  return configs
    .map((cfg, idx) => ({ cfg, idx }))
    .filter(({ cfg }) => cfg.checked && cfg.headers.length > 0);
}

function headerOptions(which) {
  const first = checkedConfigs(which)[0];
  return first ? first.cfg.headers.map(h => ({ label: h, value: h })) : [];
}

function onKeyChange() {
  onKeyColChange();
}

function toggleLinked(which) {
  toggleKeyLinked(which);
}
</script>
