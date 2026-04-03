<template>
  <NGrid :cols="{ xs: 1, m: 2 }" :x-gap="16" :y-gap="16" responsive="screen">
    <NGridItem v-for="which in ['A', 'B']" :key="which">
      <div v-if="hasFile(which)" class="file-done-card">
        <div style="flex: 1; min-width: 0;">
          <div class="file-done-label">文件 {{ which }}</div>
          <div class="file-done-name">{{ which === 'A' ? state.filenameA : state.filenameB }}</div>
          <div class="file-done-status">✓ 已上传</div>
        </div>
        <NButton size="small" @click="onReset(which)">重新上传</NButton>
      </div>

      <NUpload
        v-else
        :key="uploadKeys[which]"
        :custom-request="makeUploadRequest(which)"
        accept=".xlsx,.xls,.csv"
        :max="1"
        :show-file-list="false"
      >
        <NUploadDragger>
          <div class="upload-dragger-inner">
            <div class="upload-dragger-icon">☁️</div>
            <p class="upload-dragger-title">文件 {{ which }}</p>
            <p class="upload-dragger-hint">点击或拖拽上传 .xlsx / .xls / .csv</p>
          </div>
        </NUploadDragger>
      </NUpload>
    </NGridItem>
  </NGrid>
</template>

<script setup>
import { inject, reactive } from 'vue';
import { NGrid, NGridItem, NUpload, NUploadDragger, NButton } from 'naive-ui';

const { state, handleFileUpload, resetFile } = inject('appState');

const uploadKeys = reactive({ A: 0, B: 0 });

function hasFile(which) {
  return which === 'A' ? !!state.workbookA : !!state.workbookB;
}

function makeUploadRequest(which) {
  return ({ file, onFinish, onError }) => {
    try {
      handleFileUpload(which, file.file);
      onFinish();
    } catch {
      onError();
    }
  };
}

function onReset(which) {
  uploadKeys[which]++;
  resetFile(which);
}
</script>
