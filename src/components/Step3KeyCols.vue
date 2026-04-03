<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div v-for="which in ['A', 'B']" :key="which">
      <div class="font-semibold text-sm text-slate-500 mb-3">文件 {{ which }} 关联列 (键)</div>

      <template v-if="checkedConfigs(which).length === 0">
        <p class="text-slate-400 text-sm">请先勾选工作表</p>
      </template>

      <template v-else-if="state.selection[which].keyLinked || checkedConfigs(which).length === 1">
        <select v-model="state.selection[which].linkedKeyCol"
                class="w-full"
                @change="onKeyChange">
          <option value="" disabled>请选择关联列</option>
          <option v-for="h in headerOptions(which)" :key="h" :value="h">{{ h }}</option>
        </select>
        <a v-if="checkedConfigs(which).length > 1"
           class="block mt-2 text-xs text-primary cursor-pointer hover:underline"
           @click="toggleLinked(which)">独立配置各工作表</a>
      </template>

      <template v-else>
        <div class="flex flex-col gap-3">
          <div v-for="item in checkedConfigs(which)" :key="item.idx"
               class="border border-slate-200 rounded-lg p-3">
            <div class="text-xs font-semibold text-primary mb-2">{{ item.cfg.name }}</div>
            <select v-model="item.cfg.keyCol"
                    class="w-full"
                    @change="onKeyChange">
              <option value="" disabled>请选择关联列</option>
              <option v-for="h in item.cfg.headers" :key="h" :value="h">{{ h }}</option>
            </select>
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

const { state, onKeyColChange, toggleKeyLinked } = inject('appState');

function checkedConfigs(which) {
  const configs = which === 'A' ? state.sheetConfigsA : state.sheetConfigsB;
  return configs
    .map((cfg, idx) => ({ cfg, idx }))
    .filter(({ cfg }) => cfg.checked && cfg.headers.length > 0);
}

function headerOptions(which) {
  const first = checkedConfigs(which)[0];
  return first ? first.cfg.headers : [];
}

function onKeyChange() {
  onKeyColChange();
}

function toggleLinked(which) {
  toggleKeyLinked(which);
}
</script>
