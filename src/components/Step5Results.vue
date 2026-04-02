<template>
  <div v-if="state.mergeResult">
    <!-- Tabs -->
    <div class="tabs">
      <div
        class="tab"
        :class="{ active: state.ui.activeTab === 'matched' }"
        @click="state.ui.activeTab = 'matched'"
      >
        匹配结果
        <span class="badge" style="background:#2ecc71">{{ state.mergeResult.matched.length }}</span>
      </div>
      <div
        class="tab"
        :class="{ active: state.ui.activeTab === 'unmatched' }"
        @click="state.ui.activeTab = 'unmatched'"
      >
        未匹配数据
        <span class="badge" style="background:#f39c12">
          {{ state.mergeResult.unmatchedA.length + state.mergeResult.unmatchedB.length }}
        </span>
      </div>
      <div
        class="tab"
        :class="{ active: state.ui.activeTab === 'conflicts' }"
        @click="state.ui.activeTab = 'conflicts'"
      >
        重复键冲突
        <span v-if="state.conflictKeys.length > 0" class="badge">{{ state.conflictKeys.length }}</span>
      </div>
    </div>

    <!-- Tab: Matched -->
    <div v-if="state.ui.activeTab === 'matched'" class="tab-content active">
      <div class="table-info">共 {{ state.mergeResult.matched.length }} 条匹配记录</div>
      <div class="table-wrap">
        <DataTable :rows="state.mergeResult.matched" :cols="outputColNames" />
      </div>
    </div>

    <!-- Tab: Unmatched -->
    <div v-if="state.ui.activeTab === 'unmatched'" class="tab-content active flex">
      <div v-if="state.mergeResult.unmatchedA.length > 0" class="unmatched-section">
        <h4>仅在文件 A 中</h4>
        <div class="toggle-all">
          <a @click="toggleAllUnmatched('A', true)">全选</a> /
          <a @click="toggleAllUnmatched('A', false)">全不选</a>
        </div>
        <div class="table-info">共 {{ state.mergeResult.unmatchedA.length }} 条</div>
        <div class="table-wrap">
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th style="width:40px"></th>
                  <th v-for="c in state.mergeResult.colsA" :key="c">{{ c }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, i) in state.mergeResult.unmatchedA" :key="i">
                  <td>
                    <input
                      type="checkbox"
                      :checked="state.unmatchedSelection.A.includes(i)"
                      @change="toggleUnmatched('A', i, $event.target.checked)"
                    >
                  </td>
                  <td v-for="c in state.mergeResult.colsA" :key="c">{{ item._row[c] ?? '' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div v-if="state.mergeResult.unmatchedB.length > 0" class="unmatched-section">
        <h4>仅在文件 B 中</h4>
        <div class="toggle-all">
          <a @click="toggleAllUnmatched('B', true)">全选</a> /
          <a @click="toggleAllUnmatched('B', false)">全不选</a>
        </div>
        <div class="table-info">共 {{ state.mergeResult.unmatchedB.length }} 条</div>
        <div class="table-wrap">
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th style="width:40px"></th>
                  <th v-for="c in state.mergeResult.colsB" :key="c">{{ c }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, i) in state.mergeResult.unmatchedB" :key="i">
                  <td>
                    <input
                      type="checkbox"
                      :checked="state.unmatchedSelection.B.includes(i)"
                      @change="toggleUnmatched('B', i, $event.target.checked)"
                    >
                  </td>
                  <td v-for="c in state.mergeResult.colsB" :key="c">{{ item._row[c] ?? '' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div v-if="state.mergeResult.unmatchedA.length === 0 && state.mergeResult.unmatchedB.length === 0">
        <p style="color:#888;text-align:center;padding:20px;">无未匹配数据</p>
      </div>
    </div>

    <!-- Tab: Conflicts -->
    <div v-if="state.ui.activeTab === 'conflicts'" class="tab-content active">
      <div v-if="state.conflictKeys.length > 0" style="display:flex;gap:8px;align-items:center;margin-bottom:10px;">
        <span style="font-size:0.85em;color:#555;font-weight:600;">批量操作：</span>
        <button class="btn btn-sm btn-primary" @click="resolveAllConflicts('all')">全部保留全部</button>
        <button class="btn btn-sm btn-secondary" @click="resolveAllConflicts('first')">全部仅保留首条</button>
      </div>
      <div class="conflicts-container">
        <template v-if="state.conflictKeys.length === 0">
          <p style="color:#888;text-align:center;padding:20px;">没有重复键冲突</p>
        </template>
        <div
          v-for="(key, ci) in state.conflictKeys"
          :key="key"
          class="conflict-group"
        >
          <div class="conflict-header">
            键 "{{ key }}"：文件A {{ state.mergeResult.conflicts[key].rowsA.length }} 行，文件B {{ state.mergeResult.conflicts[key].rowsB.length }} 行
            <span v-if="state.conflictResolutions[key]" class="conflict-status">
              {{ { all: '✓ 保留全部', first: '✓ 仅保留首条', remove: '✓ 已移除' }[state.conflictResolutions[key]] }}
            </span>
          </div>
          <div class="conflict-side-by-side">
            <div class="conflict-side">
              <div class="conflict-side-label label-a">文件 A</div>
              <table>
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
            <div class="conflict-side">
              <div class="conflict-side-label label-b">文件 B</div>
              <table>
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
          <div class="conflict-actions">
            <button
              class="btn btn-sm btn-primary"
              :class="{ chosen: state.conflictResolutions[key] === 'all' }"
              @click="resolveConflict(ci, 'all')"
            >保留全部</button>
            <button
              class="btn btn-sm btn-secondary"
              :class="{ chosen: state.conflictResolutions[key] === 'first' }"
              @click="resolveConflict(ci, 'first')"
            >仅保留首条</button>
            <button
              class="btn btn-sm btn-danger"
              :class="{ chosen: state.conflictResolutions[key] === 'remove' }"
              @click="resolveConflict(ci, 'remove')"
            >移除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Download section -->
    <div class="download-section">
      <div v-if="showSheetOutputOption" style="margin-bottom:6px;font-size:0.9em;">
        <label>
          <input type="checkbox" v-model="state.outputOptions.keepSheetOutput">
          按工作表分页输出（多 Sheet 时有效）
        </label>
      </div>
      <div style="margin-bottom:10px;font-size:0.9em;display:flex;gap:16px;flex-wrap:wrap;">
        <label><input type="checkbox" v-model="state.outputOptions.extraSheetUnmatchedA"> 保存未匹配 A 到独立工作表</label>
        <label><input type="checkbox" v-model="state.outputOptions.extraSheetUnmatchedB"> 保存未匹配 B 到独立工作表</label>
        <label><input type="checkbox" v-model="state.outputOptions.extraSheetConflicts"> 保存冲突数据到独立工作表</label>
      </div>
      <div class="btn-group" style="align-items:center;">
        <button class="btn btn-success" @click="downloadExcel">下载 Excel</button>
        <button
          class="btn btn-secondary"
          :disabled="csvDisabled"
          :style="{ opacity: csvDisabled ? 0.4 : 1, cursor: csvDisabled ? 'not-allowed' : '' }"
          @click="downloadCSV"
        >下载 CSV</button>
        <span v-if="csvDisabled" style="font-size:0.8em;color:#e74c3c;margin-left:4px;">
          CSV 不支持多 Sheet 输出（已启用：{{ csvDisabledReasons.join('、') }}）
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, computed } from 'vue';
import DataTable from './DataTable.vue';

const { state, resolveConflict, resolveAllConflicts, downloadExcel, downloadCSV } = inject('appState');

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

function toggleUnmatched(which, idx, checked) {
  const sel = state.unmatchedSelection[which];
  if (checked) {
    if (!sel.includes(idx)) sel.push(idx);
  } else {
    const pos = sel.indexOf(idx);
    if (pos !== -1) sel.splice(pos, 1);
  }
}

function toggleAllUnmatched(which, checked) {
  const r = state.mergeResult;
  const list = which === 'A' ? r.unmatchedA : r.unmatchedB;
  if (checked) {
    state.unmatchedSelection[which] = list.map((_, i) => i);
  } else {
    state.unmatchedSelection[which] = [];
  }
}
</script>
