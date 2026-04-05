<template>
  <!-- item 1: my-auto centers content vertically in the flex-col parent when shorter than viewport -->
  <div class="max-w-4xl mx-auto w-full my-auto">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="which in ['A', 'B']" :key="which">
        <!-- item 2: both cards have min-h-[176px] so their sizes match after upload -->
        <div v-if="hasFile(which)"
             :data-testid="`done-card-${which.toLowerCase()}`"
             class="rounded-2xl p-5 bg-emerald-50 border-2 border-emerald-200 min-h-[176px] h-full
                    flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <div class="shrink-0 w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <AppIcon name="task_alt" class="w-5 h-5 text-emerald-600" />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-semibold text-emerald-700 mb-0.5">文件 {{ which }}</p>
              <p class="font-semibold text-on-surface truncate text-sm">
                {{ which === 'A' ? state.filenameA : state.filenameB }}
              </p>
              <p class="text-xs text-emerald-600 mt-0.5">已上传成功</p>
            </div>
          </div>
          <button :data-testid="`reupload-${which.toLowerCase()}`"
                  @click="onReset(which)"
                  class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-sm border border-outline-variant
                         rounded-lg hover:bg-surface-container-low text-on-surface-variant whitespace-nowrap">
            <AppIcon name="refresh" class="w-4 h-4" />
            重新上传
          </button>
        </div>

        <!-- Upload zone — same min-h as done card -->
        <div v-else
             :data-testid="`upload-zone-${which.toLowerCase()}`"
             :class="uploadZoneClass(which)"
             @click="triggerInput(which)"
             @dragover.prevent="dragState[which] = true"
             @dragleave.prevent="dragState[which] = false"
             @drop.prevent="onDrop(which, $event)">
          <input type="file" class="hidden"
                 :ref="el => fileInputs[which] = el"
                 accept=".xlsx,.xls,.csv"
                 @change="onFileChange(which, $event)" />
          <div class="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center mb-4
                      group-hover:scale-110 transition-transform">
            <AppIcon name="cloud_upload" class="w-6 h-6 text-primary" />
          </div>
          <p class="font-semibold text-on-surface mb-1">文件 {{ which }}</p>
          <p class="text-sm text-on-surface-variant">点击或拖拽上传</p>
          <p class="text-xs text-on-surface-variant/60 mt-1">.xlsx / .xls / .csv</p>
        </div>
      </div>
    </div>

    <!-- Info box -->
    <div class="mt-6 flex items-start gap-3 rounded-2xl bg-surface-container-low px-5 py-4 border border-outline-variant/30">
      <AppIcon name="info" class="w-5 h-5 text-primary shrink-0 mt-0.5" />
      <p class="text-sm text-on-surface-variant leading-relaxed">
        请上传两个需要合并的 Excel 或 CSV 文件。合并将根据两个文件中的公共关联列进行匹配，所有数据处理均在本地完成，不会上传至任何服务器。
      </p>
    </div>
  </div>
</template>

<script setup>
import { inject, reactive } from 'vue';
import AppIcon from './AppIcon.vue';

const { state, handleFileUpload, resetFile } = inject('appState');

const fileInputs = reactive({ A: null, B: null });
const dragState = reactive({ A: false, B: false });

function hasFile(which) {
  return which === 'A' ? !!state.workbookA : !!state.workbookB;
}

function uploadZoneClass(which) {
  const base = 'group border-2 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[176px] h-full';
  return dragState[which]
    ? `${base} border-primary bg-primary-fixed/30`
    : `${base} border-dashed border-primary-fixed hover:border-primary hover:bg-surface-container-low`;
}

function triggerInput(which) {
  fileInputs[which]?.click();
}

function processFile(which, file) {
  if (!file) return;
  handleFileUpload(which, file);
}

function onFileChange(which, event) {
  processFile(which, event.target.files[0]);
}

function onDrop(which, event) {
  dragState[which] = false;
  processFile(which, event.dataTransfer.files[0]);
}

function onReset(which) {
  if (fileInputs[which]) fileInputs[which].value = '';
  resetFile(which);
}
</script>
