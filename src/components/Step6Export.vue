<template>
  <div class="max-w-5xl mx-auto w-full flex-1 min-h-0 overflow-y-auto">
    <div class="flex flex-col gap-6">
      <div data-testid="step6-top-row" class="flex flex-col gap-6 md:flex-row md:items-stretch">
        <div class="flex-1 min-w-0">
          <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 h-full">
            <div class="flex items-center gap-2 mb-5">
              <AppIcon name="grid_on" class="w-5 h-5 text-primary" />
              <span class="font-semibold text-on-surface">数据摘要</span>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="rounded-xl bg-surface-container-low p-4 text-center">
                <div class="text-2xl font-bold text-emerald-600">{{ state.mergeResult?.matched.length ?? 0 }}</div>
                <div class="text-xs text-on-surface-variant mt-1">已匹配行</div>
              </div>
              <div class="rounded-xl bg-surface-container-low p-4 text-center">
                <div class="text-2xl font-bold text-secondary">
                  {{ (state.mergeResult?.unmatchedA.length ?? 0) + (state.mergeResult?.unmatchedB.length ?? 0) }}
                </div>
                <div class="text-xs text-on-surface-variant mt-1">未匹配行</div>
              </div>
              <div class="rounded-xl bg-surface-container-low p-4 text-center">
                <div class="text-2xl font-bold text-on-surface">{{ state.conflictKeys.length }}</div>
                <div class="text-xs text-on-surface-variant mt-1">冲突组</div>
              </div>
              <div class="rounded-xl bg-surface-container-low p-4 text-center">
                <div class="text-2xl font-bold text-on-surface">{{ state.mergeResult?.outputCols.length ?? 0 }}</div>
                <div class="text-xs text-on-surface-variant mt-1">输出列数</div>
              </div>
            </div>
          </div>
        </div>

        <CollapsibleExportSettings
          panel-test-id="step6-export-settings-panel"
          collapsed-test-id="step6-export-settings-collapsed"
          collapse-button-test-id="btn-step6-collapse-export-settings"
          expand-button-test-id="btn-step6-expand-export-settings" />
      </div>

      <div class="flex-1 min-w-0 flex flex-col gap-6">
        <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6">
          <div class="flex items-center gap-2 mb-4">
            <AppIcon name="settings" class="w-5 h-5 text-on-surface-variant" />
            <span class="font-semibold text-on-surface">导出配置</span>
          </div>
          <ul class="flex flex-col gap-2">
            <li class="flex items-center gap-2 text-sm">
              <AppIcon :name="state.outputOptions.keepSheetOutput ? 'check' : 'close'"
                       :class="state.outputOptions.keepSheetOutput ? 'text-emerald-500' : 'text-on-surface-variant/40'"
                       class="w-4 h-4 shrink-0" />
              <span :class="state.outputOptions.keepSheetOutput ? 'text-on-surface' : 'text-on-surface-variant/60'">
                按工作表分页输出
              </span>
            </li>
            <li class="flex items-center gap-2 text-sm">
              <AppIcon :name="state.outputOptions.extraSheetUnmatchedA ? 'check' : 'close'"
                       :class="state.outputOptions.extraSheetUnmatchedA ? 'text-emerald-500' : 'text-on-surface-variant/40'"
                       class="w-4 h-4 shrink-0" />
              <span :class="state.outputOptions.extraSheetUnmatchedA ? 'text-on-surface' : 'text-on-surface-variant/60'">
                保存未匹配 A 到独立工作表
              </span>
            </li>
            <li class="flex items-center gap-2 text-sm">
              <AppIcon :name="state.outputOptions.extraSheetUnmatchedB ? 'check' : 'close'"
                       :class="state.outputOptions.extraSheetUnmatchedB ? 'text-emerald-500' : 'text-on-surface-variant/40'"
                       class="w-4 h-4 shrink-0" />
              <span :class="state.outputOptions.extraSheetUnmatchedB ? 'text-on-surface' : 'text-on-surface-variant/60'">
                保存未匹配 B 到独立工作表
              </span>
            </li>
            <li class="flex items-center gap-2 text-sm">
              <AppIcon :name="state.outputOptions.extraSheetConflicts ? 'check' : 'close'"
                       :class="state.outputOptions.extraSheetConflicts ? 'text-emerald-500' : 'text-on-surface-variant/40'"
                       class="w-4 h-4 shrink-0" />
              <span :class="state.outputOptions.extraSheetConflicts ? 'text-on-surface' : 'text-on-surface-variant/60'">
                保存冲突数据到独立工作表
              </span>
            </li>
          </ul>
        </div>

        <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6">
          <div class="flex items-center gap-2 mb-5">
            <AppIcon name="download" class="w-5 h-5 text-primary" />
            <span class="font-semibold text-on-surface">下载结果</span>
          </div>
          <div class="flex flex-wrap gap-3 mb-4">
            <button data-testid="btn-download-excel" @click="downloadExcel"
                    class="flex items-center gap-2 px-6 py-2.5 rounded-xl
                           bg-gradient-to-br from-primary-container to-primary text-on-primary
                           font-medium text-sm shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40">
              <AppIcon name="download" class="w-4 h-4" />
              下载 Excel (.xlsx)
            </button>
            <button data-testid="btn-download-csv"
                    :disabled="csvDisabled"
                    @click="downloadCSV"
                    class="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-outline-variant
                           text-on-surface-variant font-medium text-sm transition-colors
                           hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed">
              <AppIcon name="description" class="w-4 h-4" />
              下载 CSV (.csv)
            </button>
          </div>
          <p v-if="csvDisabled" class="text-xs text-error flex items-center gap-1.5">
            <AppIcon name="report" class="w-4 h-4 shrink-0" />
            已启用多 Sheet 输出，CSV 格式不支持多工作表。
          </p>
        </div>

        <div class="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-5">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-on-surface text-sm">处理另一个文件</p>
              <p class="text-xs text-on-surface-variant mt-0.5">将清除所有已上传的文件和合并结果</p>
            </div>
            <button @click="$emit('reset')"
                    class="flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant
                           text-on-surface-variant text-sm hover:bg-surface-container-low transition-colors">
              <AppIcon name="autorenew" class="w-4 h-4" />
              重新开始
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, computed } from 'vue';
import AppIcon from './AppIcon.vue';
import CollapsibleExportSettings from './CollapsibleExportSettings.vue';

defineEmits(['reset']);

const { state, downloadExcel, downloadCSV } = inject('appState');

const csvDisabled = computed(() => {
  const opts = state.outputOptions;
  return opts.keepSheetOutput || opts.extraSheetUnmatchedA || opts.extraSheetUnmatchedB || opts.extraSheetConflicts;
});
</script>
