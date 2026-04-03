<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div v-for="which in ['A', 'B']" :key="which">
      <div class="font-semibold text-sm text-slate-500 mb-3">文件 {{ which }} 工作表</div>
      <div class="flex flex-col gap-3">
        <div
          v-for="(cfg, idx) in (which === 'A' ? state.sheetConfigsA : state.sheetConfigsB)"
          :key="idx"
          class="sheet-item-group"
        >
          <div
            class="flex items-center gap-3 p-3 border rounded-lg transition-colors"
            :class="cfg.checked ? 'border-primary/40 bg-primary/5' : 'border-slate-200 bg-white'"
          >
            <input type="checkbox"
                   :checked="cfg.checked"
                   @change="onCheckChange(which, idx, $event.target.checked)"
                   class="flex-shrink-0" />
            <span class="sheet-name font-semibold text-sm text-slate-700 min-w-[60px]">{{ cfg.name }}</span>
            <template v-if="cfg.checked">
              <span class="flex items-center gap-2 text-sm text-slate-500">
                起始行:
                <input type="number" :value="cfg.headerRow" min="1" step="1"
                       class="w-20"
                       @change="onStartRowChange(which, idx, Number($event.target.value) || 1)" />
              </span>
              <span class="text-xs text-slate-400">{{ cfg.data.length }} 行</span>
              <button @click="cfg.previewOpen = !cfg.previewOpen"
                      class="text-xs text-primary hover:underline ml-auto">
                {{ cfg.previewOpen ? '▼' : '▶' }} 预览
              </button>
            </template>
          </div>
          <div v-if="cfg.previewOpen && cfg.checked"
               class="max-h-48 overflow-auto border border-t-0 border-slate-200 rounded-b-lg">
            <p v-if="cfg.headers.length === 0" class="text-slate-400 text-sm p-3">无数据</p>
            <template v-else>
              <table class="w-full text-xs border-collapse">
                <thead class="bg-slate-50 sticky top-0">
                  <tr>
                    <th v-for="h in cfg.headers" :key="h"
                        class="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap border-b border-slate-200">
                      {{ h }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, ri) in cfg.data.slice(0, 20)" :key="ri"
                      class="border-b border-slate-100 hover:bg-slate-50">
                    <td v-for="h in cfg.headers" :key="h" class="px-3 py-1.5 whitespace-nowrap text-slate-700">
                      {{ row[h] ?? '' }}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div class="text-xs text-slate-400 px-3 py-1.5">
                共 {{ cfg.data.length }} 行{{ cfg.data.length > 20 ? '，预览前 20 行' : '' }}
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';

const { state, onSheetCheckChange, onSheetStartRowChange } = inject('appState');

function onCheckChange(which, idx, checked) {
  onSheetCheckChange(which, idx, checked);
}

function onStartRowChange(which, idx, value) {
  onSheetStartRowChange(which, idx, value);
}
</script>
