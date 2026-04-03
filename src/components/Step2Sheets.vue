<template>
  <NGrid :cols="{ xs: 1, m: 2 }" :x-gap="16" :y-gap="16" responsive="screen">
    <NGridItem v-for="which in ['A', 'B']" :key="which">
      <div style="font-weight: 600; font-size: 0.9em; color: #555; margin-bottom: 8px;">
        文件 {{ which }} 工作表
      </div>
      <NSpace vertical :size="12" item-style="width: 100%">
        <div
          v-for="(cfg, idx) in (which === 'A' ? state.sheetConfigsA : state.sheetConfigsB)"
          :key="idx"
          class="sheet-item-group"
        >
          <div
            class="sheet-check-item"
            :class="{ 'is-checked': cfg.checked, 'has-preview': cfg.previewOpen && cfg.checked }"
          >
            <NCheckbox
              :checked="cfg.checked"
              @update:checked="(v) => onCheckChange(which, idx, v)"
            />
            <span class="sheet-name">{{ cfg.name }}</span>
            <span class="sheet-extra">
              <span class="sheet-start-row">
                起始行:
                <NInputNumber
                  :value="cfg.headerRow"
                  :min="1"
                  :precision="0"
                  :show-button="true"
                  size="small"
                  style="width: 88px"
                  @update:value="(v) => onStartRowChange(which, idx, v ?? 1)"
                />
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
              <p style="color:#888; padding: 8px; font-size: 0.85em;">无数据</p>
            </template>
            <template v-else>
              <table class="inline-table">
                <thead>
                  <tr><th v-for="h in cfg.headers" :key="h">{{ h }}</th></tr>
                </thead>
                <tbody>
                  <tr v-for="(row, ri) in cfg.data.slice(0, 20)" :key="ri">
                    <td v-for="h in cfg.headers" :key="h">{{ row[h] ?? '' }}</td>
                  </tr>
                </tbody>
              </table>
              <div class="table-info-text" style="padding: 4px 10px;">
                共 {{ cfg.data.length }} 行{{ cfg.data.length > 20 ? '，预览前 20 行' : '' }}
              </div>
            </template>
          </div>
        </div>
      </NSpace>
    </NGridItem>
  </NGrid>
</template>

<script setup>
import { inject } from 'vue';
import { NGrid, NGridItem, NCheckbox, NInputNumber, NSpace } from 'naive-ui';

const { state, onSheetCheckChange, onSheetStartRowChange } = inject('appState');

function onCheckChange(which, idx, checked) {
  onSheetCheckChange(which, idx, checked);
}

function onStartRowChange(which, idx, value) {
  onSheetStartRowChange(which, idx, value);
}
</script>
