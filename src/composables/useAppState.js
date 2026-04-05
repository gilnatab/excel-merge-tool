import { reactive } from 'vue';
import * as XLSX from 'xlsx';
import {
  parseSheetWithOffset,
  detectHeaderHint,
  combineSheetData,
  classifyMerge,
  buildFinalOutput,
  buildConflictsSheet,
  sanitizeSheetName,
} from '../utils/excel.js';

function makeSheetConfig(name) {
  return {
    name,
    checked: true,
    headerRow: 1,
    headers: [],
    data: [],
    keyCol: '',
    selectedCols: [],
    previewOpen: false,
    headerHint: null,
  };
}

function makeSelection() {
  return {
    keyLinked: true,
    colsLinked: true,
    linkedKeyCol: '',
    linkedSelectedCols: [],
    colSearch: '',
    perSheetColSearch: {},
  };
}

function getCheckedSheetConfigs(configs) {
  return configs.filter(cfg => cfg.checked && cfg.headers.length > 0);
}

function getCommonHeaders(configs) {
  if (configs.length === 0) return [];
  return configs.slice(1).reduce(
    (common, cfg) => common.filter(header => cfg.headers.includes(header)),
    [...configs[0].headers]
  );
}

function getConfigsFor(which) {
  return which === 'A' ? state.sheetConfigsA : state.sheetConfigsB;
}

const state = reactive({
  workbookA: null,
  workbookB: null,
  filenameA: '',
  filenameB: '',
  sheetConfigsA: [],
  sheetConfigsB: [],
  selection: {
    A: makeSelection(),
    B: makeSelection(),
  },
  headersA: [],
  headersB: [],
  dataA: [],
  dataB: [],
  mergeResult: null,
  conflictResolutions: {},
  conflictKeys: [],
  unmatchedSelection: { A: [], B: [] },
  outputOptions: {
    keepSheetOutput: false,
    extraSheetUnmatchedA: false,
    extraSheetUnmatchedB: false,
    extraSheetConflicts: false,
  },
  ui: {
    activeView: 'matched',
    activeSteps: [1],
    processing: false,
    conflictSearch: '',
    exportSettingsCollapsed: false,
  },
});

// ── Step enable/disable ──

function enableStep(n) {
  if (!state.ui.activeSteps.includes(n)) state.ui.activeSteps.push(n);
}

function disableStep(n) {
  state.ui.activeSteps = state.ui.activeSteps.filter(s => s !== n);
}

// which: 'A' | 'B' | null (null = both sides)
function resetFromStep(n, which = null) {
  for (let i = n; i <= 6; i++) {
    if (i > 1) disableStep(i);
  }
  if (n <= 3) {
    if (which === 'A' || which === null) state.selection.A = makeSelection();
    if (which === 'B' || which === null) state.selection.B = makeSelection();
  }
  if (n <= 4) {
    if (which === 'A' || which === null) { state.headersA = []; state.dataA = []; }
    if (which === 'B' || which === null) { state.headersB = []; state.dataB = []; }
  }
  if (n <= 5) {
    state.mergeResult = null;
    state.conflictResolutions = {};
    state.conflictKeys = [];
    state.unmatchedSelection = { A: [], B: [] };
    state.ui.activeView = 'matched';
  }
}

// ── Sheet loading ──

function loadSheetConfigs(which) {
  const wb = which === 'A' ? state.workbookA : state.workbookB;
  const configs = wb.SheetNames.map(name => makeSheetConfig(name));
  if (which === 'A') state.sheetConfigsA = configs;
  else state.sheetConfigsB = configs;
  refreshSheetData(which);
}

function refreshSheetData(which) {
  const wb = which === 'A' ? state.workbookA : state.workbookB;
  const configs = which === 'A' ? state.sheetConfigsA : state.sheetConfigsB;
  const sel = state.selection[which];

  configs.forEach(cfg => {
    if (!cfg.checked) {
      return;
    }
    const sheet = wb.Sheets[cfg.name];
    const parsed = parseSheetWithOffset(sheet, cfg.headerRow);
    cfg.headers = parsed.headers;
    cfg.data = parsed.data;
    cfg.headerHint = detectHeaderHint(sheet, cfg.headerRow);
  });

  const checkedConfigs = getCheckedSheetConfigs(configs);
  const commonHeaders = getCommonHeaders(checkedConfigs);

  if (checkedConfigs.length > 0) {
    if (checkedConfigs.length > 1 && commonHeaders.length === 0) {
      sel.keyLinked = false;
      sel.colsLinked = false;
    }

    const linkedHeaderPool = commonHeaders.length > 0 ? commonHeaders : checkedConfigs[0].headers;
    if (!linkedHeaderPool.includes(sel.linkedKeyCol)) {
      sel.linkedKeyCol = linkedHeaderPool[0] || '';
    }
    sel.linkedSelectedCols = sel.linkedSelectedCols.filter(
      c => c !== sel.linkedKeyCol && linkedHeaderPool.includes(c)
    );

    checkedConfigs.forEach(cfg => {
      if (!cfg.keyCol || !cfg.headers.includes(cfg.keyCol)) {
        cfg.keyCol = cfg.headers[0] || '';
      }
    });
  } else {
    sel.linkedKeyCol = '';
    sel.linkedSelectedCols = [];
  }
}

function checkEnableSteps() {
  const hasA = state.sheetConfigsA.some(c => c.checked && c.headers.length > 0);
  const hasB = state.sheetConfigsB.some(c => c.checked && c.headers.length > 0);

  if (hasA && hasB) {
    enableStep(2);
    enableStep(3);
    enableStep(4);
  } else {
    disableStep(3);
    disableStep(4);
    disableStep(5);
  }
}

// ── File upload/reset ──

function handleFileUpload(which, file) {
  if (which === 'A') state.filenameA = file.name;
  else state.filenameB = file.name;

  const reader = new FileReader();
  reader.onload = e => {
    const data = new Uint8Array(e.target.result);
    const wb = XLSX.read(data, { type: 'array' });
    if (which === 'A') state.workbookA = wb;
    else state.workbookB = wb;
    resetFromStep(2, which);
    loadSheetConfigs(which);
    if (state.workbookA && state.workbookB) {
      enableStep(2);
      checkEnableSteps();
    }
  };
  reader.readAsArrayBuffer(file);
}

function resetFile(which) {
  if (which === 'A') {
    state.workbookA = null;
    state.filenameA = '';
    state.sheetConfigsA = [];
  } else {
    state.workbookB = null;
    state.filenameB = '';
    state.sheetConfigsB = [];
  }
  resetFromStep(2, which);
}

// ── Sheet config changes ──

function onSheetCheckChange(which, idx, checked) {
  const configs = which === 'A' ? state.sheetConfigsA : state.sheetConfigsB;
  configs[idx].checked = checked;
  if (!checked) configs[idx].previewOpen = false;
  resetFromStep(3);
  refreshSheetData(which);
  checkEnableSteps();
}

function onSheetStartRowChange(which, idx, value) {
  const configs = which === 'A' ? state.sheetConfigsA : state.sheetConfigsB;
  configs[idx].headerRow = Math.max(1, +value || 1);
  resetFromStep(3);
  refreshSheetData(which);
  checkEnableSteps();
}

// ── Key column changes ──

function onKeyColChange() {
  for (const which of ['A', 'B']) {
    const checkedConfigs = getCheckedSheetConfigs(getConfigsFor(which));
    const sel = state.selection[which];
    if (checkedConfigs.length === 1) {
      const [cfg] = checkedConfigs;
      const singleKey = cfg.keyCol || sel.linkedKeyCol || cfg.headers[0] || '';
      cfg.keyCol = singleKey;
      sel.linkedKeyCol = singleKey;
    }
    sel.linkedSelectedCols = sel.linkedSelectedCols.filter(c => c !== sel.linkedKeyCol);
  }
  resetFromStep(4);
  const hasA = state.sheetConfigsA.some(c => c.checked && c.headers.length > 0);
  const hasB = state.sheetConfigsB.some(c => c.checked && c.headers.length > 0);
  if (hasA && hasB) enableStep(4);
}

function toggleKeyLinked(which) {
  const sel = state.selection[which];
  sel.keyLinked = !sel.keyLinked;
  sel.colsLinked = sel.keyLinked;
  onKeyColChange();
}

// ── Merge column changes ──

function toggleColsLinked(which) {
  state.selection[which].colsLinked = !state.selection[which].colsLinked;
}

// ── Run merge ──

async function runMerge() {
  state.ui.processing = true;
  await new Promise(resolve => setTimeout(resolve, 50)); // Allow UI to update

  try {
    const { headers: hA, data: dA } = combineSheetData(state.sheetConfigsA, state.selection.A);
    const { headers: hB, data: dB } = combineSheetData(state.sheetConfigsB, state.selection.B);

    state.headersA = hA;
    state.headersB = hB;
    state.dataA = dA;
    state.dataB = dB;

    const result = classifyMerge(dA, dB, hA[0], hB[0], hA, hB);
    state.mergeResult = result;
    state.conflictResolutions = {};
    state.conflictKeys = Object.keys(result.conflicts);
    state.unmatchedSelection = { A: [], B: [] };

    const multiSheet = (
      state.sheetConfigsA.filter(c => c.checked).length > 1 ||
      state.sheetConfigsB.filter(c => c.checked).length > 1
    );
    state.outputOptions.keepSheetOutput = multiSheet;

    enableStep(5);
    enableStep(6);
    state.ui.activeView = 'matched';
  } finally {
    state.ui.processing = false;
  }
}

// ── Conflict resolution ──

function resolveConflict(ci, action) {
  if (ci < 0 || ci >= state.conflictKeys.length) return;
  const key = state.conflictKeys[ci];
  state.conflictResolutions[key] = action;
}

function resolveConflictByKey(key, action) {
  if (!state.conflictKeys.includes(key)) return;
  state.conflictResolutions[key] = action;
}

function resolveAllConflicts(action) {
  state.conflictKeys.forEach((_, ci) => resolveConflict(ci, action));
}

function resetAll() {
  state.workbookA = null;
  state.workbookB = null;
  state.filenameA = '';
  state.filenameB = '';
  state.sheetConfigsA = [];
  state.sheetConfigsB = [];
  state.selection.A = makeSelection();
  state.selection.B = makeSelection();
  state.headersA = [];
  state.headersB = [];
  state.dataA = [];
  state.dataB = [];
  state.mergeResult = null;
  state.conflictResolutions = {};
  state.conflictKeys = [];
  state.unmatchedSelection = { A: [], B: [] };
  state.outputOptions = { keepSheetOutput: false, extraSheetUnmatchedA: false, extraSheetUnmatchedB: false, extraSheetConflicts: false };
  state.ui.activeSteps = [1];
  state.ui.activeView = 'matched';
  state.ui.conflictSearch = '';
  state.ui.exportSettingsCollapsed = false;
}

// ── Download ──

function downloadExcel() {
  const rows = buildFinalOutput(
    state.mergeResult,
    state.unmatchedSelection,
    state.conflictResolutions,
    state.conflictKeys
  );
  if (rows.length === 0) { alert('没有数据可以下载'); return; }

  const wb = XLSX.utils.book_new();
  const r = state.mergeResult;
  const opts = state.outputOptions;

  if (opts.keepSheetOutput) {
    const groups = new Map();
    for (const row of rows) {
      const key = sanitizeSheetName(row.__sheet__ || '合并结果');
      if (!groups.has(key)) groups.set(key, []);
      const { __sheet__, ...clean } = row;
      groups.get(key).push(clean);
    }
    const usedNames = new Map();
    for (const [name, sheetRows] of groups) {
      const count = usedNames.get(name) ?? 0;
      const finalName = count === 0 ? name : name.slice(0, 28) + '_' + count;
      usedNames.set(name, count + 1);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheetRows), finalName);
    }
  } else {
    const cleanRows = rows.map(({ __sheet__, ...rest }) => rest);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cleanRows), '合并结果');
  }

  if (opts.extraSheetUnmatchedA && r.unmatchedA.length > 0) {
    const rowsA = r.unmatchedA.map(item => {
      const out = {};
      for (const c of r.colsA) out[c] = item._row[c] ?? '';
      return out;
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsA), '未匹配_A');
  }
  if (opts.extraSheetUnmatchedB && r.unmatchedB.length > 0) {
    const rowsB = r.unmatchedB.map(item => {
      const out = {};
      for (const c of r.colsB) out[c] = item._row[c] ?? '';
      return out;
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsB), '未匹配_B');
  }
  if (opts.extraSheetConflicts) {
    const conflictWs = buildConflictsSheet(r);
    if (conflictWs['!ref']) {
      XLSX.utils.book_append_sheet(wb, conflictWs, '冲突数据');
    }
  }

  XLSX.writeFile(wb, '合并结果.xlsx');
}

function downloadCSV() {
  const rows = buildFinalOutput(
    state.mergeResult,
    state.unmatchedSelection,
    state.conflictResolutions,
    state.conflictKeys
  );
  if (rows.length === 0) { alert('没有数据可以下载'); return; }
  const cleanRows = rows.map(({ __sheet__, ...rest }) => rest);
  const ws = XLSX.utils.json_to_sheet(cleanRows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '合并结果.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

export function useAppState() {
  return {
    state,
    handleFileUpload,
    resetFile,
    loadSheetConfigs,
    refreshSheetData,
    onSheetCheckChange,
    onSheetStartRowChange,
    onKeyColChange,
    toggleKeyLinked,
    toggleColsLinked,
    runMerge,
    resolveConflict,
    resolveConflictByKey,
    resolveAllConflicts,
    resetAll,
    downloadExcel,
    downloadCSV,
  };
}
