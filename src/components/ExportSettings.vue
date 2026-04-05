<template>
  <div class="bg-surface-container-low rounded-2xl p-4">
    <div class="flex items-center gap-2 mb-4">
      <AppIcon name="settings" class="w-4 h-4 text-on-surface-variant" />
      <span class="text-sm font-semibold text-on-surface">导出设置</span>
    </div>

    <div class="flex flex-col gap-3">
      <label class="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" v-model="state.outputOptions.keepSheetOutput" class="mt-0.5" />
        <div>
          <p class="text-sm text-on-surface font-medium">按工作表分页输出</p>
          <p class="text-xs text-on-surface-variant/70">多工作表时有效</p>
        </div>
      </label>
      <label class="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" v-model="state.outputOptions.extraSheetUnmatchedA" class="mt-0.5" />
        <div>
          <p class="text-sm text-on-surface font-medium">保存未匹配 A</p>
          <p class="text-xs text-on-surface-variant/70">输出到独立工作表</p>
        </div>
      </label>
      <label class="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" v-model="state.outputOptions.extraSheetUnmatchedB" class="mt-0.5" />
        <div>
          <p class="text-sm text-on-surface font-medium">保存未匹配 B</p>
          <p class="text-xs text-on-surface-variant/70">输出到独立工作表</p>
        </div>
      </label>
      <label class="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" v-model="state.outputOptions.extraSheetConflicts" class="mt-0.5" />
        <div>
          <p class="text-sm text-on-surface font-medium">保存冲突数据</p>
          <p class="text-xs text-on-surface-variant/70">输出到独立工作表</p>
        </div>
      </label>
    </div>

    <div v-if="csvDisabled"
         class="mt-4 flex items-start gap-2 bg-error/5 border border-error/20 rounded-xl p-3">
      <AppIcon name="report" class="w-4 h-4 text-error shrink-0 mt-0.5" />
      <p class="text-xs text-error leading-relaxed">已启用多 Sheet 输出，CSV 格式不支持多工作表，下载 CSV 已禁用。</p>
    </div>
  </div>
</template>

<script setup>
import { inject, computed } from 'vue';
import AppIcon from './AppIcon.vue';

const { state } = inject('appState');

const csvDisabled = computed(() => {
  const opts = state.outputOptions;
  return opts.keepSheetOutput || opts.extraSheetUnmatchedA || opts.extraSheetUnmatchedB || opts.extraSheetConflicts;
});
</script>
