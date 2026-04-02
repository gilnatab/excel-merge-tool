<template>
  <div class="upload-row">
    <div
      v-for="which in ['A', 'B']"
      :key="which"
      class="upload-area"
      :class="{ 'has-file': which === 'A' ? !!state.workbookA : !!state.workbookB, dragover: dragover[which] }"
      @click="triggerInput(which)"
      @dragover.prevent="dragover[which] = true"
      @dragleave="dragover[which] = false"
      @drop.prevent="onDrop($event, which)"
    >
      <input
        :ref="el => inputRefs[which] = el"
        type="file"
        accept=".xlsx,.xls,.csv"
        @change="onFileChange($event, which)"
      >
      <span class="upload-label">文件 {{ which }}</span>
      <span class="upload-hint">点击或拖拽上传 (.xlsx, .xls, .csv)</span>
      <div class="upload-filename">{{ which === 'A' ? filenameA : filenameB }}</div>
      <button
        class="btn btn-sm btn-secondary reload-btn"
        @click.stop="onReset(which)"
      >重新上传</button>
    </div>
  </div>
</template>

<script setup>
import { inject, reactive, ref } from 'vue';

const { state, handleFileUpload, resetFile } = inject('appState');

const filenameA = ref('');
const filenameB = ref('');
const dragover = reactive({ A: false, B: false });
const inputRefs = reactive({ A: null, B: null });

function triggerInput(which) {
  inputRefs[which]?.click();
}

function onFileChange(e, which) {
  const file = e.target.files[0];
  if (!file) return;
  if (which === 'A') filenameA.value = file.name;
  else filenameB.value = file.name;
  handleFileUpload(which, file);
}

function onDrop(e, which) {
  dragover[which] = false;
  const file = e.dataTransfer.files[0];
  if (!file) return;
  if (which === 'A') filenameA.value = file.name;
  else filenameB.value = file.name;
  handleFileUpload(which, file);
}

function onReset(which) {
  if (which === 'A') filenameA.value = '';
  else filenameB.value = '';
  if (inputRefs[which]) inputRefs[which].value = '';
  resetFile(which);
}
</script>
