<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div v-for="which in ['A', 'B']" :key="which">
      <!-- Done card -->
      <div v-if="hasFile(which)"
           :data-testid="`done-card-${which.toLowerCase()}`"
           class="border-2 border-success/40 rounded-xl p-5 bg-success/5
                  flex items-center justify-between gap-4">
        <div class="min-w-0">
          <p class="text-xs font-semibold text-slate-500 mb-1">文件 {{ which }}</p>
          <p class="font-semibold text-slate-800 truncate">
            {{ which === 'A' ? state.filenameA : state.filenameB }}
          </p>
          <p class="text-xs text-success mt-0.5">✓ 已上传</p>
        </div>
        <button :data-testid="`reupload-${which.toLowerCase()}`"
                @click="onReset(which)"
                class="px-3 py-1.5 text-sm border border-slate-200 rounded-lg
                       hover:bg-slate-50 text-slate-600 whitespace-nowrap flex-shrink-0">
          重新上传
        </button>
      </div>

      <!-- Upload zone -->
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
        <div class="text-4xl mb-3">☁️</div>
        <p class="font-semibold text-slate-700">文件 {{ which }}</p>
        <p class="text-sm text-slate-400 mt-1">点击或拖拽上传 .xlsx / .xls / .csv</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, reactive } from 'vue';

const { state, handleFileUpload, resetFile } = inject('appState');

const fileInputs = reactive({ A: null, B: null });
const dragState = reactive({ A: false, B: false });

function hasFile(which) {
  return which === 'A' ? !!state.workbookA : !!state.workbookB;
}

function uploadZoneClass(which) {
  const base = 'border-2 rounded-xl p-8 text-center cursor-pointer transition-colors';
  return dragState[which]
    ? `${base} border-primary bg-primary/5`
    : `${base} border-dashed border-slate-300 hover:border-primary hover:bg-slate-50`;
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
