<template>
  <div v-if="state.mergeResult">
    <NTabs v-model:value="state.ui.activeTab" type="line" animated>
      <!-- Tab: Matched -->
      <NTabPane
        name="matched"
        :tab="`匹配结果 (${state.mergeResult.matched.length})`"
      >
        <DataTable :rows="state.mergeResult.matched" :cols="outputColNames" />
      </NTabPane>

      <!-- Tab: Unmatched -->
      <NTabPane
        name="unmatched"
        :tab="`未匹配数据 (${state.mergeResult.unmatchedA.length + state.mergeResult.unmatchedB.length})`"
      >
        <div v-if="state.mergeResult.unmatchedA.length === 0 && state.mergeResult.unmatchedB.length === 0">
          <NEmpty description="无未匹配数据" style="padding: 40px 0;" />
        </div>
        <NGrid v-else :cols="{ xs: 1, m: 2 }" :x-gap="16" :y-gap="16" responsive="screen">
          <NGridItem v-if="state.mergeResult.unmatchedA.length > 0">
            <div class="unmatched-section-title">仅在 {{ state.filenameA || '文件 A' }} 中</div>
            <div class="table-info-text">共 {{ state.mergeResult.unmatchedA.length }} 条</div>
            <NDataTable
              :columns="unmatchedAColumns"
              :data="unmatchedAData"
              :row-key="(row) => row.__idx"
              :checked-row-keys="state.unmatchedSelection.A"
              :max-height="320"
              :scroll-x="unmatchedAScrollWidth"
              :bordered="false"
              size="small"
              @update:checked-row-keys="(keys) => (state.unmatchedSelection.A = keys)"
            />
          </NGridItem>
          <NGridItem v-if="state.mergeResult.unmatchedB.length > 0">
            <div class="unmatched-section-title">仅在 {{ state.filenameB || '文件 B' }} 中</div>
            <div class="table-info-text">共 {{ state.mergeResult.unmatchedB.length }} 条</div>
            <NDataTable
              :columns="unmatchedBColumns"
              :data="unmatchedBData"
              :row-key="(row) => row.__idx"
              :checked-row-keys="state.unmatchedSelection.B"
              :max-height="320"
              :scroll-x="unmatchedBScrollWidth"
              :bordered="false"
              size="small"
              @update:checked-row-keys="(keys) => (state.unmatchedSelection.B = keys)"
            />
          </NGridItem>
        </NGrid>
      </NTabPane>

      <!-- Tab: Conflicts -->
      <NTabPane name="conflicts">
        <template #tab>
          <NBadge :value="unhandledConflictsCount" :dot="false" :show="unhandledConflictsCount > 0" type="error">
            {{ conflictsTabLabel }}
          </NBadge>
        </template>

        <div v-if="state.conflictKeys.length > 0" style="margin-bottom: 16px;">
          <NGrid :cols="{ xs: 1, m: 2 }" :x-gap="12" :y-gap="12">
            <NGridItem>
              <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                <span style="font-size: 0.85em; color: #555; font-weight: 600;">批量操作：</span>
                <NButton size="small" type="primary" secondary @click="resolveAllConflicts('all')">全部保留全部</NButton>
                <NButton size="small" secondary @click="resolveAllConflicts('first')">全部仅保留首条</NButton>
              </div>
            </NGridItem>
            <NGridItem>
              <NInput
                v-model:value="state.ui.conflictSearch"
                placeholder="搜索冲突键值..."
                clearable
                size="small"
              />
            </NGridItem>
          </NGrid>
        </div>

        <div class="conflicts-container">
          <NEmpty v-if="state.conflictKeys.length === 0" description="没有重复键冲突" style="padding: 40px 0;" />
          <NEmpty v-else-if="filteredConflictKeys.length === 0" description="没有匹配的搜索结果" style="padding: 40px 0;" />
          <div
            v-for="(key, ci) in filteredConflictKeys"
            :key="key"
            class="conflict-group"
          >
            <div class="conflict-header-row">
              <span class="conflict-key-text">
                键 "{{ key }}"：{{ state.filenameA || '文件 A' }} {{ state.mergeResult.conflicts[key].rowsA.length }} 行，{{ state.filenameB || '文件 B' }} {{ state.mergeResult.conflicts[key].rowsB.length }} 行
              </span>
              <span v-if="state.conflictResolutions[key]" class="conflict-status-text">
                {{ { all: '✓ 保留全部', first: '✓ 仅保留首条', remove: '✓ 已移除' }[state.conflictResolutions[key]] }}
              </span>
            </div>
            <div class="conflict-side-by-side">
              <div class="conflict-side">
                <div class="conflict-side-label-a">{{ state.filenameA || '文件 A' }}</div>
                <div class="inline-table-wrap">
                  <table class="inline-table">
                    <thead>
                      <tr><th v-for="c in state.mergeResult.colsA" :key="c">{{ c }}</th></tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, ri) in state.mergeResult.conflicts[key].rowsA" :key="ri">
                        <td v-for="c in state.mergeResult.colsA" :key="c">{{ row[c] ?? '' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div class="conflict-side">
                <div class="conflict-side-label-b">{{ state.filenameB || '文件 B' }}</div>
                <div class="inline-table-wrap">
                  <table class="inline-table">
                    <thead>
                      <tr><th v-for="c in state.mergeResult.colsB" :key="c">{{ c }}</th></tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, ri) in state.mergeResult.conflicts[key].rowsB" :key="ri">
                        <td v-for="c in state.mergeResult.colsB" :key="c">{{ row[c] ?? '' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <NSpace style="margin-top: 10px;" :size="8">
              <NButton
                size="small"
                :type="state.conflictResolutions[key] === 'all' ? 'primary' : 'default'"
                :secondary="state.conflictResolutions[key] !== 'all'"
                @click="resolveConflict(ci, 'all')"
              >保留全部</NButton>
              <NButton
                size="small"
                :type="state.conflictResolutions[key] === 'first' ? 'primary' : 'default'"
                :secondary="state.conflictResolutions[key] !== 'first'"
                @click="resolveConflict(ci, 'first')"
              >仅保留首条</NButton>
              <NButton
                size="small"
                :type="state.conflictResolutions[key] === 'remove' ? 'error' : 'default'"
                :secondary="state.conflictResolutions[key] !== 'remove'"
                @click="resolveConflict(ci, 'remove')"
              >移除</NButton>
            </NSpace>
          </div>
        </div>
      </NTabPane>
    </NTabs>

    <!-- Download section -->
    <div class="download-section">
      <div class="download-options">
        <NCheckbox
          v-if="showSheetOutputOption"
          v-model:checked="state.outputOptions.keepSheetOutput"
        >按工作表分页输出（多 Sheet 时有效）</NCheckbox>
        <NCheckbox v-model:checked="state.outputOptions.extraSheetUnmatchedA">保存未匹配 A 到独立工作表</NCheckbox>
        <NCheckbox v-model:checked="state.outputOptions.extraSheetUnmatchedB">保存未匹配 B 到独立工作表</NCheckbox>
        <NCheckbox v-model:checked="state.outputOptions.extraSheetConflicts">保存冲突数据到独立工作表</NCheckbox>
      </div>
      <NSpace align="center" :size="12">
        <NButton type="success" size="medium" @click="downloadExcel">下载 Excel</NButton>
        <NButton
          size="medium"
          :disabled="csvDisabled"
          @click="downloadCSV"
        >下载 CSV</NButton>
        <span v-if="csvDisabled" style="font-size: 0.8em; color: #e74c3c;">
          CSV 不支持多 Sheet 输出（已启用：{{ csvDisabledReasons.join('、') }}）
        </span>
      </NSpace>
    </div>
  </div>
</template>

<script setup>
import { inject, computed } from 'vue';
import { NTabs, NTabPane, NGrid, NGridItem, NDataTable, NEmpty, NButton, NSpace, NCheckbox, NBadge } from 'naive-ui';
import DataTable from './DataTable.vue';

const { state, resolveConflict, resolveAllConflicts, downloadExcel, downloadCSV } = inject('appState');

const unhandledConflictsCount = computed(() => {
  return state.conflictKeys.filter(key => !state.conflictResolutions[key]).length;
});

const outputColNames = computed(() =>
  state.mergeResult ? state.mergeResult.outputCols.map(c => c.name) : []
);

const showSheetOutputOption = computed(() => {
  const multiA = state.sheetConfigsA.filter(c => c.checked).length > 1;
  const multiB = state.sheetConfigsB.filter(c => c.checked).length > 1;
  return multiA || multiB;
});

const csvDisabled = computed(() => {
  const opts = state.outputOptions;
  return opts.keepSheetOutput || opts.extraSheetUnmatchedA || opts.extraSheetUnmatchedB || opts.extraSheetConflicts;
});

const csvDisabledReasons = computed(() => {
  const opts = state.outputOptions;
  const r = [];
  if (opts.keepSheetOutput) r.push('按工作表分页');
  if (opts.extraSheetUnmatchedA || opts.extraSheetUnmatchedB || opts.extraSheetConflicts) r.push('额外数据 Sheet');
  return r;
});

const conflictsTabLabel = computed(() => {
  const n = state.conflictKeys.length;
  return n > 0 ? `重复键冲突 (${n})` : '重复键冲突';
});

const filteredConflictKeys = computed(() => {
  const search = (state.ui.conflictSearch || '').toLowerCase();
  if (!search) return state.conflictKeys;
  return state.conflictKeys.filter(key => key.toLowerCase().includes(search));
});

// ── Unmatched A ──
function makeDataTableCols(colNames) {
  return [
    { type: 'selection', fixed: 'left', width: 48 },
    ...colNames.map(c => ({
      title: c,
      key: c,
      width: Math.min(Math.max(c.length * 10 + 24, 80), 200),
      ellipsis: { tooltip: true },
    })),
  ];
}

const unmatchedAColumns = computed(() =>
  state.mergeResult ? makeDataTableCols(state.mergeResult.colsA) : []
);
const unmatchedBColumns = computed(() =>
  state.mergeResult ? makeDataTableCols(state.mergeResult.colsB) : []
);

const unmatchedAData = computed(() =>
  state.mergeResult
    ? state.mergeResult.unmatchedA.map((item, i) => ({ __idx: i, ...item._row }))
    : []
);
const unmatchedBData = computed(() =>
  state.mergeResult
    ? state.mergeResult.unmatchedB.map((item, i) => ({ __idx: i, ...item._row }))
    : []
);

function colScrollWidth(cols) {
  return 48 + cols.reduce((sum, c) => sum + Math.min(Math.max(c.length * 10 + 24, 80), 200), 0);
}
const unmatchedAScrollWidth = computed(() =>
  state.mergeResult ? colScrollWidth(state.mergeResult.colsA) : 0
);
const unmatchedBScrollWidth = computed(() =>
  state.mergeResult ? colScrollWidth(state.mergeResult.colsB) : 0
);
</script>
