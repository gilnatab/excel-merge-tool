<template>
  <NConfigProvider :locale="zhCN" :date-locale="dateZhCN" :theme-overrides="themeOverrides">
    <div class="app-wrapper">
      <header class="app-header">
        <div class="app-header-inner">
          <div class="app-logo">📊</div>
          <span class="app-title">Excel 合并工具</span>
        </div>
      </header>

      <div class="app-steps-bar">
        <div class="container">
          <NSteps :current="currentStep" size="small" :on-update:current="handleStepChange">
            <NStep title="上传文件" />
            <NStep title="选择工作表" />
            <NStep title="关联列" />
            <NStep title="合并列" />
            <NStep title="结果处理" />
          </NSteps>
        </div>
      </div>

      <main class="app-main">
        <NSpin :show="state.ui.processing" description="正在合并数据...">
          <div class="container">
            <div class="step-section" id="step1">
              <NCard :content-style="cardContent">
                <template #header>
                  <div class="step-card-header">
                    <span class="step-badge">1</span>
                    上传文件
                  </div>
                </template>
                <Step1Upload />
              </NCard>
            </div>

            <div
              class="step-section"
              :class="{ 'step-disabled': !state.ui.activeSteps.includes(2) }"
              id="step2"
            >
              <NCard :content-style="cardContent">
                <template #header>
                  <div class="step-card-header">
                    <span class="step-badge">2</span>
                    选择工作表
                  </div>
                </template>
                <Step2Sheets />
              </NCard>
            </div>

            <div
              class="step-section"
              :class="{ 'step-disabled': !state.ui.activeSteps.includes(3) }"
              id="step3"
            >
              <NCard :content-style="cardContent">
                <template #header>
                  <div class="step-card-header">
                    <span class="step-badge">3</span>
                    选择关联列
                  </div>
                </template>
                <Step3KeyCols />
              </NCard>
            </div>

            <div
              class="step-section"
              :class="{ 'step-disabled': !state.ui.activeSteps.includes(4) }"
              id="step4"
            >
              <NCard :content-style="cardContent">
                <template #header>
                  <div class="step-card-header">
                    <span class="step-badge">4</span>
                    选择合并列
                  </div>
                </template>
                <Step4MergeCols />
              </NCard>
            </div>

            <div
              class="step-section"
              :class="{ 'step-disabled': !state.ui.activeSteps.includes(5) }"
              id="step5"
            >
              <NCard :content-style="cardContent">
                <template #header>
                  <div class="step-card-header">
                    <span class="step-badge">5</span>
                    结果处理
                  </div>
                </template>
                <Step5Results />
              </NCard>
            </div>
          </div>
        </NSpin>
      </main>
    </div>
  </NConfigProvider>
</template>

<script setup>
import { provide, computed } from 'vue';
import { NConfigProvider, NSteps, NStep, NCard, NSpin } from 'naive-ui';
import { zhCN, dateZhCN } from 'naive-ui';
import { useAppState } from './composables/useAppState.js';
import Step1Upload from './components/Step1Upload.vue';
import Step2Sheets from './components/Step2Sheets.vue';
import Step3KeyCols from './components/Step3KeyCols.vue';
import Step4MergeCols from './components/Step4MergeCols.vue';
import Step5Results from './components/Step5Results.vue';

const appState = useAppState();
provide('appState', appState);
const { state } = appState;

const themeOverrides = {
  common: {
    primaryColor: '#4361EE',
    primaryColorHover: '#3A56D4',
    primaryColorPressed: '#3050C0',
    primaryColorSuppl: '#6B84F2',
    borderRadius: '8px',
    borderRadiusSmall: '6px',
  },
  Card: { borderRadius: '12px' },
  Button: { borderRadiusMedium: '8px', borderRadiusSmall: '6px' },
};

const cardContent = 'padding: 20px 24px;';

const currentStep = computed(() => Math.max(...state.ui.activeSteps));

function handleStepChange(step) {
  const el = document.getElementById(`step${step}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
</script>

<style scoped>
:deep(.n-step) {
  cursor: pointer;
}
</style>
