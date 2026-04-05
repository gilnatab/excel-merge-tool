<template>
  <div v-if="state.mergeResult" class="max-w-5xl mx-auto w-full flex-1 min-h-0 flex flex-col">
    <div data-testid="step5-top-row" class="mb-6 flex shrink-0 flex-col gap-6 md:flex-row md:items-stretch">
      <!-- Stat cards -->
      <div class="flex-1 min-w-0">
        <div class="grid grid-cols-3 gap-4 h-full">
          <button v-for="card in statCards" :key="card.view"
                  :data-testid="`tab-${card.view}`"
                  @click="state.ui.activeView = card.view"
                  :class="[
                    'rounded-2xl p-4 text-left transition-all border-2',
                    state.ui.activeView === card.view
                      ? 'border-primary bg-surface-container-low ring-2 ring-primary/20'
                      : 'border-outline-variant/40 bg-surface-container-lowest hover:border-outline-variant'
                  ]">
            <div class="flex items-center gap-2 mb-2">
              <AppIcon :name="card.icon" class="w-5 h-5" :class="card.iconClass" />
              <span class="text-xs font-medium text-on-surface-variant">{{ card.label }}</span>
            </div>
            <div class="text-2xl font-bold" :class="card.countClass">{{ card.count }}</div>
          </button>
        </div>
      </div>

      <CollapsibleExportSettings
        panel-test-id="step5-export-settings-panel"
        collapsed-test-id="step5-export-settings-collapsed"
        collapse-button-test-id="btn-step5-collapse-export-settings"
        expand-button-test-id="btn-step5-expand-export-settings" />
    </div>

    <!-- Main content -->
    <div class="flex-1 min-w-0 min-h-0 flex flex-col">
        <!-- Matched view -->
        <div v-if="state.ui.activeView === 'matched'" class="flex-1 min-h-0 flex flex-col">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-semibold text-on-surface">匹配结果</span>
            <button @click="showMatchedFullscreen = true"
                    aria-label="全屏查看"
                    data-testid="btn-step5-open-fullscreen-matched"
                    class="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors">
              <AppIcon name="open_in_full" class="w-4 h-4" />
              查看全部
            </button>
          </div>
          <div class="flex-1 min-h-0 min-w-0 flex">
            <InlinePreviewTable
              :rows="state.mergeResult.matched"
              :cols="outputColNames"
              empty-text="暂无匹配数据" />
          </div>
          <DataTable
            v-if="showMatchedFullscreen"
            :rows="state.mergeResult.matched"
            :cols="outputColNames"
            :fullscreen="true"
            title="匹配结果"
            @close="showMatchedFullscreen = false" />
        </div>

        <!-- Unmatched view -->
        <div v-else-if="state.ui.activeView === 'unmatched'" class="flex-1 min-h-0 flex flex-col">
          <div v-if="state.mergeResult.unmatchedA.length === 0 && state.mergeResult.unmatchedB.length === 0"
               class="py-10 text-center text-on-surface-variant/60 text-sm">无未匹配数据</div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 items-stretch">
            <!-- Unmatched A -->
            <div v-if="state.mergeResult.unmatchedA.length > 0"
                 class="min-h-0 flex flex-col">
              <div class="flex items-center justify-between mb-2">
                <div>
                  <div class="font-semibold text-sm text-on-surface">{{ state.filenameA || '文件 A' }}</div>
                  <div class="text-xs text-on-surface-variant/70">{{ state.mergeResult.unmatchedA.length }} 行未匹配</div>
                </div>
                <button @click="showUnmatchedAFullscreen = true"
                        aria-label="全屏查看"
                        data-testid="btn-step5-open-fullscreen-unmatched-a"
                        class="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors">
                  <AppIcon name="open_in_full" class="w-4 h-4" />
                  查看全部
                </button>
              </div>
              <div class="relative mb-2">
                <AppIcon name="search" class="w-4 h-4 text-on-surface-variant/50 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" v-model="unmatchedSearchA"
                       placeholder="搜索未匹配记录..."
                       class="w-full pl-9 pr-3 text-sm" />
              </div>
              <div class="text-xs text-on-surface-variant/60 mb-2">
                显示 {{ filteredUnmatchedA.length }} / {{ state.mergeResult.unmatchedA.length }} 条
              </div>
              <div class="flex-1 min-h-0 min-w-0 overflow-auto rounded-xl border border-outline-variant/40">
                <table class="w-full min-w-max text-sm border-collapse">
                  <thead class="bg-surface-container-low border-b border-outline-variant/40 sticky top-0">
                    <tr>
                      <th class="w-10 px-3 py-3">
                        <input type="checkbox" :checked="allSelectedA" @change="toggleAllA($event.target.checked)" />
                      </th>
                      <th v-for="col in state.mergeResult.colsA" :key="col"
                          class="px-4 py-3 text-left text-xs uppercase font-semibold text-on-surface-variant whitespace-nowrap">
                        {{ col }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="filteredUnmatchedA.length === 0">
                      <td :colspan="state.mergeResult.colsA.length + 1"
                          class="px-4 py-8 text-center text-sm text-on-surface-variant/60">
                        暂无匹配搜索结果
                      </td>
                    </tr>
                    <tr v-for="{ item, index } in filteredUnmatchedA" :key="index"
                        class="border-t border-outline-variant/20 hover:bg-surface-container-low/60">
                      <td class="px-3 py-2.5">
                        <input type="checkbox"
                               :checked="state.unmatchedSelection.A.includes(index)"
                               @change="toggleUnmatchedASelection(index, $event.target.checked)" />
                      </td>
                      <td v-for="col in state.mergeResult.colsA" :key="col"
                          class="px-4 py-2.5 text-on-surface whitespace-nowrap max-w-[200px] truncate">
                        {{ item._row[col] ?? '' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <DataTable
                v-if="showUnmatchedAFullscreen"
                :rows="unmatchedARows"
                :cols="state.mergeResult.colsA"
                :fullscreen="true"
                :title="state.filenameA || '文件 A 未匹配'"
                @close="showUnmatchedAFullscreen = false" />
            </div>

            <!-- Unmatched B -->
            <div v-if="state.mergeResult.unmatchedB.length > 0"
                 class="min-h-0 flex flex-col">
              <div class="flex items-center justify-between mb-2">
                <div>
                  <div class="font-semibold text-sm text-on-surface">{{ state.filenameB || '文件 B' }}</div>
                  <div class="text-xs text-on-surface-variant/70">{{ state.mergeResult.unmatchedB.length }} 行未匹配</div>
                </div>
                <button @click="showUnmatchedBFullscreen = true"
                        aria-label="全屏查看"
                        data-testid="btn-step5-open-fullscreen-unmatched-b"
                        class="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors">
                  <AppIcon name="open_in_full" class="w-4 h-4" />
                  查看全部
                </button>
              </div>
              <div class="relative mb-2">
                <AppIcon name="search" class="w-4 h-4 text-on-surface-variant/50 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" v-model="unmatchedSearchB"
                       placeholder="搜索未匹配记录..."
                       class="w-full pl-9 pr-3 text-sm" />
              </div>
              <div class="text-xs text-on-surface-variant/60 mb-2">
                显示 {{ filteredUnmatchedB.length }} / {{ state.mergeResult.unmatchedB.length }} 条
              </div>
              <div class="flex-1 min-h-0 min-w-0 overflow-auto rounded-xl border border-outline-variant/40">
                <table class="w-full min-w-max text-sm border-collapse">
                  <thead class="bg-surface-container-low border-b border-outline-variant/40 sticky top-0">
                    <tr>
                      <th class="w-10 px-3 py-3">
                        <input type="checkbox" :checked="allSelectedB" @change="toggleAllB($event.target.checked)" />
                      </th>
                      <th v-for="col in state.mergeResult.colsB" :key="col"
                          class="px-4 py-3 text-left text-xs uppercase font-semibold text-on-surface-variant whitespace-nowrap">
                        {{ col }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="filteredUnmatchedB.length === 0">
                      <td :colspan="state.mergeResult.colsB.length + 1"
                          class="px-4 py-8 text-center text-sm text-on-surface-variant/60">
                        暂无匹配搜索结果
                      </td>
                    </tr>
                    <tr v-for="{ item, index } in filteredUnmatchedB" :key="index"
                        class="border-t border-outline-variant/20 hover:bg-surface-container-low/60">
                      <td class="px-3 py-2.5">
                        <input type="checkbox"
                               :checked="state.unmatchedSelection.B.includes(index)"
                               @change="toggleUnmatchedBSelection(index, $event.target.checked)" />
                      </td>
                      <td v-for="col in state.mergeResult.colsB" :key="col"
                          class="px-4 py-2.5 text-on-surface whitespace-nowrap max-w-[200px] truncate">
                        {{ item._row[col] ?? '' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <DataTable
                v-if="showUnmatchedBFullscreen"
                :rows="unmatchedBRows"
                :cols="state.mergeResult.colsB"
                :fullscreen="true"
                :title="state.filenameB || '文件 B 未匹配'"
                @close="showUnmatchedBFullscreen = false" />
            </div>
          </div>
        </div>

        <!-- Conflicts view -->
        <div v-else-if="state.ui.activeView === 'conflicts'" class="flex-1 min-h-0 overflow-y-auto">
          <div v-if="state.conflictKeys.length === 0"
               class="py-10 text-center text-on-surface-variant/60 text-sm">没有重复键冲突</div>
          <template v-else>
            <!-- Batch actions + search -->
            <div class="flex items-center gap-3 flex-wrap mb-4">
              <span class="text-sm text-on-surface-variant font-medium">批量操作：</span>
              <button @click="resolveAllConflicts('all')"
                      class="px-3 py-1.5 text-xs border border-primary text-primary rounded-lg hover:bg-primary/5">
                全部保留全部
              </button>
              <button @click="resolveAllConflicts('first')"
                      class="px-3 py-1.5 text-xs border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container-low">
                全部仅保留首条
              </button>
              <button @click="resolveAllConflicts('remove')"
                      class="px-3 py-1.5 text-xs border border-error text-error rounded-lg hover:bg-error/5">
                全部移除
              </button>
              <div class="relative flex-1 min-w-40">
                <AppIcon name="search" class="w-4 h-4 text-on-surface-variant/50 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" v-model="state.ui.conflictSearch"
                       placeholder="搜索冲突键值..." class="w-full pl-9 text-sm" />
              </div>
            </div>

            <div class="space-y-3">
              <div v-if="filteredConflictKeys.length === 0"
                   class="py-10 text-center text-on-surface-variant/60 text-sm">没有匹配的搜索结果</div>

              <div v-for="key in filteredConflictKeys" :key="key"
                   :class="[
                     'rounded-2xl border overflow-hidden transition-all',
                     state.conflictResolutions[key]
                       ? 'border-outline-variant/40 bg-surface-container-lowest'
                       : 'border-error/40 bg-surface-container-lowest shadow-sm shadow-error/10 ring-1 ring-error/10'
                   ]">
                <!-- Header -->
                <div :class="[
                       'flex items-center gap-2 px-4 py-3 border-b',
                       state.conflictResolutions[key]
                         ? 'bg-surface-container-low border-outline-variant/30'
                         : 'bg-error/5 border-error/20'
                     ]">
                  <span class="conflict-key-text font-semibold text-sm text-on-surface" data-testid="conflict-key-text">
                    键 "{{ key }}"
                  </span>
                  <span class="text-xs text-on-surface-variant">
                    {{ state.filenameA || '文件 A' }} {{ state.mergeResult.conflicts[key].rowsA.length }} 行 ·
                    {{ state.filenameB || '文件 B' }} {{ state.mergeResult.conflicts[key].rowsB.length }} 行
                  </span>
                  <span v-if="!state.conflictResolutions[key]"
                        data-testid="badge-conflict-pending"
                        class="ml-auto inline-flex items-center rounded-full bg-error/10 px-2.5 py-1 text-xs font-semibold text-error">
                    待处理
                  </span>
                  <span v-if="state.conflictResolutions[key]"
                        class="ml-auto text-xs text-emerald-600 font-medium">
                    {{ { all: '已保留全部', first: '仅保留首条', remove: '已移除' }[state.conflictResolutions[key]] }}
                  </span>
                </div>
                <!-- Action buttons -->
                <div class="flex gap-2 px-4 py-3 border-b border-outline-variant/20">
                  <button @click="resolveConflictByKey(key, 'all')"
                          :class="[
                            'px-3 py-1.5 text-xs rounded-lg border transition-colors',
                            state.conflictResolutions[key] === 'all'
                              ? 'bg-primary border-primary text-on-primary'
                              : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                          ]">保留全部</button>
                  <button @click="resolveConflictByKey(key, 'first')"
                          :class="[
                            'px-3 py-1.5 text-xs rounded-lg border transition-colors',
                            state.conflictResolutions[key] === 'first'
                              ? 'bg-primary border-primary text-on-primary'
                              : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                          ]">仅保留首条</button>
                  <button @click="resolveConflictByKey(key, 'remove')"
                          :class="[
                            'px-3 py-1.5 text-xs rounded-lg border transition-colors',
                            state.conflictResolutions[key] === 'remove'
                              ? 'bg-error border-error text-on-primary'
                              : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                          ]">移除</button>
                </div>
                <!-- Data tables (side by side) -->
                <div class="grid grid-cols-2 gap-0 divide-x divide-outline-variant/20">
                  <div class="p-3 overflow-x-auto max-h-40 overflow-y-auto">
                    <div class="text-xs font-semibold text-primary mb-1">{{ state.filenameA || '文件 A' }}</div>
                    <table class="w-full text-xs border-collapse">
                      <thead><tr>
                        <th v-for="c in state.mergeResult.colsA" :key="c"
                            class="px-2 py-1.5 text-left font-semibold text-on-surface-variant whitespace-nowrap border-b border-outline-variant/30">
                          {{ c }}
                        </th>
                      </tr></thead>
                      <tbody>
                        <tr v-for="(row, ri) in state.mergeResult.conflicts[key].rowsA" :key="ri"
                            class="border-b border-outline-variant/20">
                          <td v-for="c in state.mergeResult.colsA" :key="c"
                              class="px-2 py-1 whitespace-nowrap text-on-surface">{{ row[c] ?? '' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div class="p-3 overflow-x-auto max-h-40 overflow-y-auto">
                    <div class="text-xs font-semibold text-tertiary mb-1">{{ state.filenameB || '文件 B' }}</div>
                    <table class="w-full text-xs border-collapse">
                      <thead><tr>
                        <th v-for="c in state.mergeResult.colsB" :key="c"
                            class="px-2 py-1.5 text-left font-semibold text-on-surface-variant whitespace-nowrap border-b border-outline-variant/30">
                          {{ c }}
                        </th>
                      </tr></thead>
                      <tbody>
                        <tr v-for="(row, ri) in state.mergeResult.conflicts[key].rowsB" :key="ri"
                            class="border-b border-outline-variant/20">
                          <td v-for="c in state.mergeResult.colsB" :key="c"
                              class="px-2 py-1 whitespace-nowrap text-on-surface">{{ row[c] ?? '' }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
    </div>
  </div>
</template>

<script setup>
import { inject, computed, ref } from 'vue';
import DataTable from './DataTable.vue';
import AppIcon from './AppIcon.vue';
import CollapsibleExportSettings from './CollapsibleExportSettings.vue';
import InlinePreviewTable from './InlinePreviewTable.vue';

const { state, resolveConflictByKey, resolveAllConflicts } = inject('appState');

const showMatchedFullscreen = ref(false);
const showUnmatchedAFullscreen = ref(false);
const showUnmatchedBFullscreen = ref(false);
const unmatchedSearchA = ref('');
const unmatchedSearchB = ref('');

const outputColNames = computed(() =>
  state.mergeResult ? state.mergeResult.outputCols.map(c => c.name) : []
);

const unhandledConflictsCount = computed(() =>
  state.conflictKeys.filter(key => !state.conflictResolutions[key]).length
);

const statCards = computed(() => [
  {
    view: 'matched',
    label: '已匹配',
    count: state.mergeResult?.matched.length ?? 0,
    icon: 'check',
    iconClass: 'text-emerald-500',
    countClass: 'text-emerald-600',
  },
  {
    view: 'unmatched',
    label: '未匹配',
    count: (state.mergeResult?.unmatchedA.length ?? 0) + (state.mergeResult?.unmatchedB.length ?? 0),
    icon: 'filter_list',
    iconClass: 'text-secondary',
    countClass: 'text-secondary',
  },
  {
    view: 'conflicts',
    label: '存在冲突',
    count: state.conflictKeys.length,
    icon: 'report',
    iconClass: unhandledConflictsCount.value > 0 ? 'text-error' : 'text-on-surface-variant',
    countClass: unhandledConflictsCount.value > 0 ? 'text-error' : 'text-on-surface',
  },
]);

const filteredConflictKeys = computed(() => {
  const search = (state.ui.conflictSearch || '').toLowerCase();
  if (!search) return state.conflictKeys;
  return state.conflictKeys.filter(key => key.toLowerCase().includes(search));
});

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

function matchesUnmatchedItem(item, cols, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return cols.some(col => String(item._row[col] ?? '').toLowerCase().includes(normalized));
}

function toggleUnmatchedASelection(index, checked) {
  if (checked) {
    if (!state.unmatchedSelection.A.includes(index)) {
      state.unmatchedSelection.A = [...state.unmatchedSelection.A, index];
    }
    return;
  }

  state.unmatchedSelection.A = state.unmatchedSelection.A.filter(i => i !== index);
}

function toggleUnmatchedBSelection(index, checked) {
  if (checked) {
    if (!state.unmatchedSelection.B.includes(index)) {
      state.unmatchedSelection.B = [...state.unmatchedSelection.B, index];
    }
    return;
  }

  state.unmatchedSelection.B = state.unmatchedSelection.B.filter(i => i !== index);
}

const unmatchedARows = computed(() =>
  state.mergeResult?.unmatchedA.map(item => {
    const row = {};
    for (const c of state.mergeResult.colsA) row[c] = item._row[c] ?? '';
    return row;
  }) ?? []
);

const filteredUnmatchedA = computed(() =>
  state.mergeResult?.unmatchedA
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => matchesUnmatchedItem(item, state.mergeResult.colsA, unmatchedSearchA.value)) ?? []
);

const unmatchedBRows = computed(() =>
  state.mergeResult?.unmatchedB.map(item => {
    const row = {};
    for (const c of state.mergeResult.colsB) row[c] = item._row[c] ?? '';
    return row;
  }) ?? []
);

const filteredUnmatchedB = computed(() =>
  state.mergeResult?.unmatchedB
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => matchesUnmatchedItem(item, state.mergeResult.colsB, unmatchedSearchB.value)) ?? []
);
</script>
