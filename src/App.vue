<template>
  <div class="container">
    <h1>Excel 合并工具</h1>

    <div class="step" id="step1">
      <div class="step-header">
        <span class="step-num">1</span>
        <span class="step-title">上传文件</span>
      </div>
      <Step1Upload />
    </div>

    <div class="step" :class="{ disabled: !state.ui.activeSteps.includes(2) }" id="step2">
      <div class="step-header">
        <span class="step-num">2</span>
        <span class="step-title">选择工作表</span>
      </div>
      <Step2Sheets />
    </div>

    <div class="step" :class="{ disabled: !state.ui.activeSteps.includes(3) }" id="step3">
      <div class="step-header">
        <span class="step-num">3</span>
        <span class="step-title">选择关联列</span>
      </div>
      <Step3KeyCols />
    </div>

    <div class="step" :class="{ disabled: !state.ui.activeSteps.includes(4) }" id="step4">
      <div class="step-header">
        <span class="step-num">4</span>
        <span class="step-title">选择合并列</span>
      </div>
      <Step4MergeCols />
    </div>

    <div class="step" :class="{ disabled: !state.ui.activeSteps.includes(5) }" id="step5">
      <div class="step-header">
        <span class="step-num">5</span>
        <span class="step-title">结果处理</span>
      </div>
      <Step5Results />
    </div>
  </div>
</template>

<script setup>
import { provide } from 'vue';
import { useAppState } from './composables/useAppState.js';
import Step1Upload from './components/Step1Upload.vue';
import Step2Sheets from './components/Step2Sheets.vue';
import Step3KeyCols from './components/Step3KeyCols.vue';
import Step4MergeCols from './components/Step4MergeCols.vue';
import Step5Results from './components/Step5Results.vue';

const appState = useAppState();
provide('appState', appState);

const { state } = appState;
</script>
