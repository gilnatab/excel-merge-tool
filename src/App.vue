<template>
  <div class="min-h-screen flex flex-col bg-surface font-sans">
    <!-- Processing overlay -->
    <div v-if="state.ui.processing"
         class="fixed inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="flex flex-col items-center gap-3 text-on-surface-variant">
        <div class="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin"></div>
        <span class="text-sm font-medium">正在合并数据...</span>
      </div>
    </div>

    <!-- Sticky header -->
    <header class="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-sm border-b border-outline-variant/30 px-6 py-4">
      <div class="max-w-5xl mx-auto flex flex-col gap-4">
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <AppIcon name="grid_on" class="w-6 h-6 text-primary" />
          <span class="font-semibold text-on-surface text-base">Excel 数据合并大师</span>
        </div>

        <!-- Step indicator -->
        <div class="flex items-center">
          <template v-for="n in 6" :key="n">
            <!-- Step node -->
            <div class="flex flex-col items-center gap-1">
              <div :class="stepCircleClass(n)">
                <AppIcon v-if="isCompleted(n)" name="check" class="w-4 h-4" />
                <span v-else class="text-sm font-semibold">{{ n }}</span>
              </div>
              <span class="text-xs font-medium hidden sm:block w-16 text-center leading-tight"
                    :class="currentStep === n ? 'text-primary' : isCompleted(n) ? 'text-emerald-600' : 'text-on-surface-variant/50'">
                {{ stepLabels[n - 1] }}
              </span>
            </div>
            <!-- Connector -->
            <div v-if="n < 6"
                 class="h-0.5 flex-1 mx-1 mb-4"
                 :class="isCompleted(n) ? 'bg-emerald-400' : 'bg-outline-variant/40'"></div>
          </template>
        </div>
      </div>
    </header>

    <!-- Scrollable content -->
    <main class="flex-1 overflow-y-auto px-6 py-8">
      <div class="max-w-5xl mx-auto">
        <transition name="fade" mode="out-in">
          <div :key="currentStep">
            <Step1Upload v-if="currentStep === 1" />
            <Step2Sheets v-else-if="currentStep === 2" />
            <Step3KeyCols v-else-if="currentStep === 3" />
            <Step4MergeCols v-else-if="currentStep === 4" />
            <Step5Results v-else-if="currentStep === 5" />
            <Step6Export v-else-if="currentStep === 6" @reset="onReset" />
          </div>
        </transition>
      </div>
    </main>

    <!-- Sticky footer -->
    <footer class="sticky bottom-0 z-40 bg-surface-container-lowest/95 backdrop-blur-sm border-t border-outline-variant/30 px-6 py-4">
      <div class="max-w-5xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button v-show="currentStep > 1" data-testid="btn-prev" @click="prevStep"
                  class="flex items-center gap-1.5 px-5 py-2 rounded-lg border border-outline-variant text-on-surface-variant
                         hover:bg-surface-container-low font-medium text-sm transition-colors">
            <AppIcon name="arrow_back" class="w-4 h-4" />
            上一步
          </button>
        </div>

        <div class="flex items-center gap-3">
          <!-- Steps 1–5: Next (not on step 6) -->
          <button v-if="currentStep < 6" data-testid="btn-next" @click="nextStep"
                  :disabled="!canGoNext || state.ui.processing"
                  class="flex items-center gap-1.5 px-8 py-2 rounded-lg
                         bg-gradient-to-br from-primary-container to-primary text-on-primary
                         font-medium text-sm shadow-lg shadow-primary/25 transition-all
                         disabled:opacity-40 disabled:cursor-not-allowed">
            {{ currentStep === 4 ? '开始合并' : '下一步' }}
            <AppIcon name="arrow_forward" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, watch, provide } from 'vue';
import { useAppState } from './composables/useAppState.js';
import AppIcon from './components/AppIcon.vue';
import Step1Upload from './components/Step1Upload.vue';
import Step2Sheets from './components/Step2Sheets.vue';
import Step3KeyCols from './components/Step3KeyCols.vue';
import Step4MergeCols from './components/Step4MergeCols.vue';
import Step5Results from './components/Step5Results.vue';
import Step6Export from './components/Step6Export.vue';

const appState = useAppState();
provide('appState', appState);
const { state, runMerge, resetAll } = appState;

const stepLabels = ['文件上传', '选择表单', '设置关联键', '设置合并列', '处理结果', '导出结果'];
const currentStep = ref(1);

watch(() => [...state.ui.activeSteps], (steps) => {
  const max = Math.max(...steps);
  if (currentStep.value > max) currentStep.value = max;
});

const canGoNext = computed(() => {
  if (currentStep.value >= 6) return false;
  // Step 4 "开始合并": enabled whenever step 4 is active (merge runs on click, then enables step 5)
  if (currentStep.value === 4) return state.ui.activeSteps.includes(4);
  return state.ui.activeSteps.includes(currentStep.value + 1);
});

function isCompleted(n) {
  return n < currentStep.value && state.ui.activeSteps.includes(n);
}

function stepCircleClass(n) {
  if (isCompleted(n))
    return 'w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white';
  if (n === currentStep.value)
    return 'w-8 h-8 rounded-full bg-gradient-to-br from-primary-container to-primary flex items-center justify-center text-white';
  if (state.ui.activeSteps.includes(n))
    return 'w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant/70 flex items-center justify-center';
  return 'w-8 h-8 rounded-full bg-surface-container text-on-surface-variant/40 flex items-center justify-center';
}

async function nextStep() {
  if (state.ui.processing) return;
  if (currentStep.value === 4) {
    await runMerge();
    currentStep.value = 5;
    return;
  }
  if (canGoNext.value) currentStep.value++;
}

function prevStep() {
  if (currentStep.value > 1) currentStep.value--;
}

function onReset() {
  resetAll();
  currentStep.value = 1;
}
</script>
