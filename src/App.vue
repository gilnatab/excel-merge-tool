<template>
  <div class="min-h-screen bg-slate-100 py-8 px-4">
    <!-- Processing overlay -->
    <div v-if="state.ui.processing"
         class="fixed inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="flex flex-col items-center gap-3 text-slate-600">
        <div class="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin"></div>
        <span class="text-sm font-medium">正在合并数据...</span>
      </div>
    </div>

    <div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-100
                flex flex-col" style="min-height: 80vh">

      <!-- Wizard Header -->
      <header class="p-6 border-b border-slate-100">
        <div class="relative flex items-center justify-between max-w-2xl mx-auto">
          <!-- connecting line background -->
          <div class="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 -z-0"></div>
          <!-- completed progress line -->
          <div class="absolute top-5 left-0 h-0.5 bg-primary -z-0 transition-all duration-300"
               :style="{ width: progressLineWidth }"></div>

          <div v-for="n in 5" :key="n" class="relative z-10 flex flex-col items-center gap-1.5">
            <div :class="stepCircleClass(n)">
              <span v-if="isCompleted(n)">✓</span>
              <span v-else>{{ n }}</span>
            </div>
            <span class="text-xs font-medium hidden sm:block"
                  :class="currentStep === n ? 'text-primary' : 'text-slate-400'">
              {{ stepLabels[n - 1] }}
            </span>
          </div>
        </div>
        <!-- Mobile: step counter -->
        <p class="sm:hidden text-center text-sm text-slate-500 mt-3">
          步骤 {{ currentStep }} / 5 — {{ stepLabels[currentStep - 1] }}
        </p>
      </header>

      <!-- Content Area -->
      <main class="flex-1 overflow-y-auto p-8">
        <transition name="fade" mode="out-in">
          <div :key="currentStep">
            <Step1Upload v-if="currentStep === 1" />
            <Step2Sheets v-else-if="currentStep === 2" />
            <Step3KeyCols v-else-if="currentStep === 3" />
            <Step4MergeCols v-else-if="currentStep === 4" />
            <Step5Results v-else-if="currentStep === 5" />
          </div>
        </transition>
      </main>

      <!-- Footer Nav -->
      <footer class="px-8 py-4 border-t border-slate-100 bg-slate-50/60
                     flex items-center justify-between flex-shrink-0">
        <button v-show="currentStep > 1" data-testid="btn-prev" @click="prevStep"
                class="px-6 py-2 rounded-lg border border-slate-200 text-slate-600
                       hover:bg-slate-100 font-medium text-sm transition-colors">
          ← 上一步
        </button>
        <div v-show="currentStep <= 1"></div>

        <div class="flex gap-3">
          <!-- Steps 1-3: Next -->
          <button v-if="currentStep < 4" data-testid="btn-next" @click="nextStep"
                  :disabled="!canGoNext"
                  class="px-8 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white
                         font-medium text-sm transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed">
            下一步 →
          </button>
          <!-- Step 4: Start Merge -->
          <button v-if="currentStep === 4" data-testid="btn-merge" @click="doRunMerge"
                  :disabled="state.ui.processing"
                  class="px-8 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white
                         font-bold text-sm shadow-lg shadow-primary/25 transition-all
                         disabled:opacity-40 disabled:cursor-not-allowed">
            开始合并
          </button>
          <!-- Step 5: Download shortcuts -->
          <template v-if="currentStep === 5 && state.mergeResult">
            <button @click="downloadExcel"
                    class="px-6 py-2 rounded-lg bg-success hover:bg-success/80 text-white
                           font-medium text-sm transition-colors">
              下载 Excel
            </button>
          </template>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, provide } from 'vue';
import { useAppState } from './composables/useAppState.js';
import Step1Upload from './components/Step1Upload.vue';
import Step2Sheets from './components/Step2Sheets.vue';
import Step3KeyCols from './components/Step3KeyCols.vue';
import Step4MergeCols from './components/Step4MergeCols.vue';
import Step5Results from './components/Step5Results.vue';

const appState = useAppState();
provide('appState', appState);
const { state, runMerge, downloadExcel } = appState;

const stepLabels = ['上传文件', '选择工作表', '关联列', '合并列', '结果处理'];
const currentStep = ref(1);

watch(() => [...state.ui.activeSteps], (steps) => {
  const max = Math.max(...steps);
  if (currentStep.value > max) currentStep.value = max;
});

const canGoNext = computed(() =>
  currentStep.value < 5 && state.ui.activeSteps.includes(currentStep.value + 1)
);

const progressLineWidth = computed(() =>
  `${((currentStep.value - 1) / 4) * 100}%`
);

function isCompleted(n) {
  return n < currentStep.value && state.ui.activeSteps.includes(n);
}

function stepCircleClass(n) {
  const base = 'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors';
  if (isCompleted(n))
    return `${base} bg-success border-success text-white`;
  if (n === currentStep.value)
    return `${base} bg-primary border-primary text-white`;
  if (state.ui.activeSteps.includes(n))
    return `${base} bg-white border-primary/40 text-primary/60`;
  return `${base} bg-slate-50 border-slate-200 text-slate-300`;
}

async function doRunMerge() {
  await runMerge();
  currentStep.value = 5;
}

function nextStep() {
  if (canGoNext.value) currentStep.value++;
}

function prevStep() {
  if (currentStep.value > 1) currentStep.value--;
}
</script>
