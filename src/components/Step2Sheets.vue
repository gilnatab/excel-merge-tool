<template>
  <div class="select-row">
    <div v-for="which in ['A', 'B']" :key="which" class="select-group">
      <label>文件 {{ which }} 工作表</label>
      <div class="sheet-check-list">
        <template v-for="(cfg, idx) in (which === 'A' ? state.sheetConfigsA : state.sheetConfigsB)" :key="idx">
          <div class="sheet-check-item" :class="{ checked: cfg.checked }">
            <input
              type="checkbox"
              :checked="cfg.checked"
              @change="onCheckChange(which, idx, $event.target.checked)"
            >
            <span class="sheet-name">{{ cfg.name }}</span>
            <span class="sheet-extra">
              <span class="sheet-start-row">
                起始行:
                <input
                  type="number"
                  :value="cfg.headerRow"
                  min="1"
                  @change="onStartRowChange(which, idx, $event.target.value)"
                >
              </span>
              <span class="sheet-row-count">{{ cfg.data.length }} 行</span>
              <span class="preview-toggle" @click="cfg.previewOpen = !cfg.previewOpen">
                {{ cfg.previewOpen ? '▼' : '▶' }} 预览
              </span>
            </span>
            <span v-if="cfg.headerHint" class="sheet-header-hint">
              提示：第1行可能是标题行，建议将起始行改为 {{ cfg.headerHint.suggestedRow }}
            </span>
          </div>
          <div v-if="cfg.previewOpen && cfg.checked" class="sheet-preview-wrap">
            <template v-if="cfg.headers.length === 0">
              <p style="color:#888;padding:8px">无数据</p>
            </template>
            <template v-else>
              <table>
                <thead>
                  <tr><th v-for="h in cfg.headers" :key="h">{{ h }}</th></tr>
                </thead>
                <tbody>
                  <tr v-for="(row, ri) in cfg.data.slice(0, 20)" :key="ri">
                    <td v-for="h in cfg.headers" :key="h">{{ row[h] ?? '' }}</td>
                  </tr>
                </tbody>
              </table>
              <div class="table-info" style="padding:4px 8px">
                共 {{ cfg.data.length }} 行{{ cfg.data.length > 20 ? '，预览前 20 行' : '' }}
              </div>
            </template>
          </div>
        </template>
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
