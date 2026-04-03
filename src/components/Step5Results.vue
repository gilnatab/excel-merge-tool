<template>
  <div v-if="state.mergeResult">
    <!-- Tab bar -->
    <div class="flex border-b border-slate-200 mb-6">
      <button v-for="tab in tabs" :key="tab.id"
              :data-testid="`tab-${tab.id}`"
              @click="state.ui.activeTab = tab.id"
              :class="[
                'px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2',
                state.ui.activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              ]">
        {{ tab.label }}
        <span v-if="tab.badge > 0"
              :class="[
                'text-xs px-2 py-0.5 rounded-full font-semibold',
                tab.id === 'conflicts' && unhandledConflictsCount > 0
                  ? 'bg-red-100 text-red-600'
                  : 'bg-slate-100 text-slate-500'
              ]">
          {{ tab.badge }}
        </span>
      </button>
    </div>

    <!-- Tab: Matched -->
    <div v-show="state.ui.activeTab === 'matched'">
      <DataTable :rows="state.mergeResult.matched" :cols="outputColNames" />
    </div>

    <!-- Tab: Unmatched -->
    <div v-show="state.ui.activeTab === 'unmatched'">
      <div v-if="state.mergeResult.unmatchedA.length === 0 && state.mergeResult.unmatchedB.length === 0"
           class="py-10 text-center text-slate-400 text-sm">无未匹配数据</div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Unmatched A -->
        <div v-if="state.mergeResult.unmatchedA.length > 0">
          <div class="font-semibold text-sm text-slate-600 mb-1">
            仅在 {{ state.filenameA || '文件 A' }} 中
          </div>
          <div class="text-xs text-slate-400 mb-2">共 {{ state.mergeResult.unmatchedA.length }} 条</div>
          <div class="overflow-x-auto rounded-xl border border-slate-200 max-h-80">
            <table class="w-full text-sm border-collapse">
              <thead class="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th class="w-10 px-3 py-3">
                    <input type="checkbox"
                           :checked="allSelectedA"
                           @change="toggleAllA($event.target.checked)" />
                  </th>
                  <th v-for="col in state.mergeResult.colsA" :key="col"
                      class="px-4 py-3 text-left text-xs uppercase font-semibold text-slate-500 whitespace-nowrap">
                    {{ col }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, i) in state.mergeResult.unmatchedA" :key="i"
                    class="border-t border-slate-100 hover:bg-slate-50/60">
                  <td class="px-3 py-2.5">
                    <input type="checkbox" :value="i" v-model="state.unmatchedSelection.A" />
                  </td>
                  <td v-for="col in state.mergeResult.colsA" :key="col"
                      class="px-4 py-2.5 text-slate-700 whitespace-nowrap max-w-[200px] truncate">
                    {{ item._row[col] ?? '' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Unmatched B -->
        <div v-if="state.mergeResult.unmatchedB.length > 0">
          <div class="font-semibold text-sm text-slate-600 mb-1">
            仅在 {{ state.filenameB || '文件 B' }} 中
          </div>
          <div class="text-xs text-slate-400 mb-2">共 {{ state.mergeResult.unmatchedB.length }} 条</div>
          <div class="overflow-x-auto rounded-xl border border-slate-200 max-h-80">
            <table class="w-full text-sm border-collapse">
              <thead class="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <th class="w-10 px-3 py-3">
                    <input type="checkbox"
                           :checked="allSelectedB"
                           @change="toggleAllB($event.target.checked)" />
                  </th>
                  <th v-for="col in state.mergeResult.colsB" :key="col"
                      class="px-4 py-3 text-left text-xs uppercase font-semibold text-slate-500 whitespace-nowrap">
                    {{ col }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, i) in state.mergeResult.unmatchedB" :key="i"
                    class="border-t border-slate-100 hover:bg-slate-50/60">
                  <td class="px-3 py-2.5">
                    <input type="checkbox" :value="i" v-model="state.unmatchedSelection.B" />
                  </td>
                  <td v-for="col in state.mergeResult.colsB" :key="col"
                      class="px-4 py-2.5 text-slate-700 whitespace-nowrap max-w-[200px] truncate">
                    {{ item._row[col] ?? '' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: Conflicts -->
    <div v-show="state.ui.activeTab === 'conflicts'">
      <!-- Batch actions + search -->
      <div v-if="state.conflictKeys.length > 0"
           class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-sm text-slate-500 font-semibold">批量操作：</span>
          <button @click="resolveAllConflicts('all')"
                  class="px-3 py-1.5 text-xs border border-primary text-primary rounded-lg hover:bg-primary/5">
            全部保留全部
          </button>
          <button @click="resolveAllConflicts('first')"
                  class="px-3 py-1.5 text-xs border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
            全部仅保留首条
          </button>
        </div>
        <input type="text" v-model="state.ui.conflictSearch"
               placeholder="搜索冲突键值..." class="w-full" />
      </div>

      <div class="max-h-[600px] overflow-y-auto space-y-3">
        <div v-if="state.conflictKeys.length === 0"
             class="py-10 text-center text-slate-400 text-sm">没有重复键冲突</div>
        <div v-else-if="filteredConflictKeys.length === 0"
             class="py-10 text-center text-slate-400 text-sm">没有匹配的搜索结果</div>

        <div v-for="(key, ci) in filteredConflictKeys" :key="key"
             class="border border-slate-200 rounded-xl p-4 bg-white">
          <div class="flex items-center gap-2 flex-wrap mb-3">
            <span class="conflict-key-text font-semibold text-sm text-slate-700" data-testid="conflict-key-text">
              键 "{{ key }}"：{{ state.filenameA || '文件 A' }} {{ state.mergeResult.conflicts[key].rowsA.length }} 行，{{ state.filenameB || '文件 B' }} {{ state.mergeResult.conflicts[key].rowsB.length }} 行
            </span>
            <span v-if="state.conflictResolutions[key]" class="text-xs text-success font-medium">
              {{ { all: '✓ 保留全部', first: '✓ 仅保留首条', remove: '✓ 已移除' }[state.conflictResolutions[key]] }}
            </span>
          </div>

          <div class="flex gap-3 overflow-x-auto mb-3">
            <div class="flex-1 min-w-0">
              <div class="text-xs font-semibold text-primary mb-1">{{ state.filenameA || '文件 A' }}</div>
              <div class="overflow-x-auto max-h-40 border border-slate-200 rounded-lg">
                <table class="w-full text-xs border-collapse">
                  <thead class="bg-slate-50 sticky top-0">
                    <tr>
                      <th v-for="c in state.mergeResult.colsA" :key="c"
                          class="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap border-b border-slate-200">
                        {{ c }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, ri) in state.mergeResult.conflicts[key].rowsA" :key="ri"
                        class="border-b border-slate-100">
                      <td v-for="c in state.mergeResult.colsA" :key="c"
                          class="px-3 py-1.5 whitespace-nowrap text-slate-700">
                        {{ row[c] ?? '' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-xs font-semibold text-warning mb-1">{{ state.filenameB || '文件 B' }}</div>
              <div class="overflow-x-auto max-h-40 border border-slate-200 rounded-lg">
                <table class="w-full text-xs border-collapse">
                  <thead class="bg-slate-50 sticky top-0">
                    <tr>
                      <th v-for="c in state.mergeResult.colsB" :key="c"
                          class="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap border-b border-slate-200">
                        {{ c }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, ri) in state.mergeResult.conflicts[key].rowsB" :key="ri"
                        class="border-b border-slate-100">
                      <td v-for="c in state.mergeResult.colsB" :key="c"
                          class="px-3 py-1.5 whitespace-nowrap text-slate-700">
                        {{ row[c] ?? '' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <button @click="resolveConflict(ci, 'all')"
                    :class="[
                      'px-3 py-1.5 text-xs rounded-lg border transition-colors',
                      state.conflictResolutions[key] === 'all'
                        ? 'bg-primary border-primary text-white'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    ]">保留全部</button>
            <button @click="resolveConflict(ci, 'first')"
                    :class="[
                      'px-3 py-1.5 text-xs rounded-lg border transition-colors',
                      state.conflictResolutions[key] === 'first'
                        ? 'bg-primary border-primary text-white'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    ]">仅保留首条</button>
            <button @click="resolveConflict(ci, 'remove')"
                    :class="[
                      'px-3 py-1.5 text-xs rounded-lg border transition-colors',
                      state.conflictResolutions[key] === 'remove'
                        ? 'bg-danger border-danger text-white'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    ]">移除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Download section -->
    <div class="mt-6 pt-5 border-t border-slate-100">
      <div class="flex flex-wrap gap-4 mb-4">
        <label v-if="showSheetOutputOption" class="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" v-model="state.outputOptions.keepSheetOutput" />
          按工作表分页输出（多 Sheet 时有效）
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" v-model="state.outputOptions.extraSheetUnmatchedA" />
          保存未匹配 A 到独立工作表
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" v-model="state.outputOptions.extraSheetUnmatchedB" />
          保存未匹配 B 到独立工作表
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" v-model="state.outputOptions.extraSheetConflicts" />
          保存冲突数据到独立工作表
        </label>
      </div>
      <div class="flex items-center gap-3 flex-wrap">
        <button data-testid="btn-download-excel" @click="downloadExcel"
                class="px-5 py-2 rounded-lg bg-success hover:bg-success/80 text-white font-medium text-sm transition-colors">
          下载 Excel
        </button>
        <button data-testid="btn-download-csv"
                :disabled="csvDisabled"
                @click="downloadCSV"
                class="px-5 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium text-sm
                       hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          下载 CSV
        </button>
        <span v-if="csvDisabled" class="text-xs text-danger">
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

const unhandledConflictsCount = computed(() =>
  state.conflictKeys.filter(key => !state.conflictResolutions[key]).length
);

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

const filteredConflictKeys = computed(() => {
  const search = (state.ui.conflictSearch || '').toLowerCase();
  if (!search) return state.conflictKeys;
  return state.conflictKeys.filter(key => key.toLowerCase().includes(search));
});

const tabs = computed(() => [
  { id: 'matched', label: '匹配结果', badge: state.mergeResult?.matched.length ?? 0 },
  {
    id: 'unmatched',
    label: '未匹配数据',
    badge: (state.mergeResult?.unmatchedA.length ?? 0) + (state.mergeResult?.unmatchedB.length ?? 0),
  },
  { id: 'conflicts', label: '重复键冲突', badge: state.conflictKeys.length },
]);

const allSelectedA = computed(() => {
  const total = state.mergeResult?.unmatchedA.length ?? 0;
  return total > 0 && state.unmatchedSelection.A.length === total;
});

const allSelectedB = computed(() => {
  const total = state.mergeResult?.unmatchedB.length ?? 0;
  return total > 0 && state.unmatchedSelection.B.length === total;
});

function toggleAllA(checked) {
  state.unmatchedSelection.A = checked
    ? state.mergeResult.unmatchedA.map((_, i) => i)
    : [];
}

function toggleAllB(checked) {
  state.unmatchedSelection.B = checked
    ? state.mergeResult.unmatchedB.map((_, i) => i)
    : [];
}
</script>
