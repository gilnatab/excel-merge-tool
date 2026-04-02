import * as XLSX from 'xlsx';

// ── Sheet parsing ──

export function parseSheetWithOffset(sheet, startRow) {
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const headerIdx = Math.max(0, startRow - 1);
  if (headerIdx >= raw.length) return { headers: [], data: [] };
  const rawHeaders = raw[headerIdx];
  const headers = [];
  const colIndices = [];
  for (let j = 0; j < rawHeaders.length; j++) {
    const h = String(rawHeaders[j]).trim();
    if (h !== '') { headers.push(h); colIndices.push(j); }
  }
  const data = [];
  for (let i = headerIdx + 1; i < raw.length; i++) {
    const row = {};
    for (let k = 0; k < headers.length; k++) {
      const j = colIndices[k];
      row[headers[k]] = raw[i] && raw[i][j] !== undefined ? raw[i][j] : '';
    }
    const isEmpty = headers.every(h => String(row[h]).trim() === '');
    if (!isEmpty) data.push(row);
  }
  return { headers, data };
}

export function detectHeaderHint(sheet, headerRow) {
  if (headerRow !== 1) return null;
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (raw.length < 2) return null;

  const countNonEmpty = row => (row || []).filter(c => String(c).trim() !== '').length;
  const row1Count = countNonEmpty(raw[0]);

  const merges = sheet['!merges'] || [];
  const hasMergedTitle = merges.some(m => m.s.r === 0 && (m.e.c - m.s.c) > 0);

  let bestRow = -1;
  for (let i = 1; i < Math.min(raw.length, 5); i++) {
    const cnt = countNonEmpty(raw[i]);
    if (cnt >= 3 && cnt > row1Count * 2) { bestRow = i + 1; break; }
  }

  if (hasMergedTitle || bestRow > 0) {
    return { suggestedRow: bestRow > 0 ? bestRow : 2 };
  }
  return null;
}

// ── Core merge logic ──

export function classifyMerge(dataA, dataB, keyColA, keyColB, colsA, colsB) {
  const { idx: indexA, emptyKeyRows: emptyA } = buildIndex(dataA, keyColA);
  const { idx: indexB, emptyKeyRows: emptyB } = buildIndex(dataB, keyColB);

  const outputCols = resolveColumnNames(colsA, colsB, keyColA, keyColB);

  const matched = [];
  const unmatchedA = [];
  const unmatchedB = [];
  const conflicts = {};

  for (const r of emptyA) unmatchedA.push({ _key: '', _row: r });
  for (const r of emptyB) unmatchedB.push({ _key: '', _row: r });

  const allKeys = new Set([...indexA.keys(), ...indexB.keys()]);

  for (const key of allKeys) {
    const rowsA = indexA.get(key) || [];
    const rowsB = indexB.get(key) || [];

    if (rowsA.length === 0) {
      for (const r of rowsB) unmatchedB.push({ _key: key, _row: r });
    } else if (rowsB.length === 0) {
      for (const r of rowsA) unmatchedA.push({ _key: key, _row: r });
    } else if (rowsA.length === 1 && rowsB.length === 1) {
      matched.push(mergeRow(rowsA[0], rowsB[0], outputCols, keyColA, keyColB));
    } else {
      conflicts[key] = { rowsA, rowsB };
    }
  }

  return { matched, unmatchedA, unmatchedB, conflicts, outputCols, colsA, colsB, keyColA, keyColB };
}

export function buildIndex(data, keyCol) {
  const idx = new Map();
  const emptyKeyRows = [];
  for (const row of data) {
    const key = String(row[keyCol] ?? '').trim();
    if (key === '') { emptyKeyRows.push(row); continue; }
    if (!idx.has(key)) idx.set(key, []);
    idx.get(key).push(row);
  }
  return { idx, emptyKeyRows };
}

export function resolveColumnNames(colsA, colsB, keyColA, keyColB) {
  const result = [];
  const usedNames = new Set();

  result.push({ name: keyColA, source: 'key' });
  usedNames.add(keyColA);

  const nonKeyA = colsA.filter(c => c !== keyColA);
  const nonKeyB = colsB.filter(c => c !== keyColB);
  const bNameSet = new Set(nonKeyB);

  for (const col of nonKeyA) {
    let name = bNameSet.has(col) ? 'A_' + col : col;
    let suffix = 2;
    const base = name;
    while (usedNames.has(name)) { name = base + '_' + suffix++; }
    result.push({ name, source: 'A', original: col });
    usedNames.add(name);
  }

  for (const col of nonKeyB) {
    let name = nonKeyA.includes(col) ? 'B_' + col : col;
    let suffix = 2;
    const base = name;
    while (usedNames.has(name)) { name = base + '_' + suffix++; }
    result.push({ name, source: 'B', original: col });
    usedNames.add(name);
  }

  return result;
}

export function mergeRow(rowA, rowB, outputCols, keyColA, keyColB) {
  const out = {};
  out.__sheet__ = rowA.__sheet__ || '';
  for (const col of outputCols) {
    if (col.source === 'key') {
      out[col.name] = rowA[keyColA];
    } else if (col.source === 'A') {
      out[col.name] = rowA[col.original] ?? '';
    } else {
      out[col.name] = rowB[col.original] ?? '';
    }
  }
  return out;
}

export function buildUnmatchedRow(row, which, outputCols, keyColA, keyColB, keyValue) {
  const out = {};
  out.__sheet__ = row.__sheet__ || '';
  for (const col of outputCols) {
    if (col.source === 'key') {
      out[col.name] = keyValue;
    } else if (col.source === which) {
      out[col.name] = row[col.original] ?? '';
    } else {
      out[col.name] = '';
    }
  }
  return out;
}

// ── combineSheetData — pure, reads state not DOM ──

export function combineSheetData(sheetConfigs, selection) {
  const checkedConfigs = [];
  const checkedIndices = [];

  sheetConfigs.forEach((cfg, idx) => {
    if (cfg.checked && cfg.headers.length > 0) {
      checkedConfigs.push(cfg);
      checkedIndices.push(idx);
    }
  });

  if (checkedConfigs.length === 0) return { headers: [], data: [] };

  const multi = checkedConfigs.length > 1;
  const keyLinked = !multi || selection.keyLinked;
  const colsLinked = !multi || selection.colsLinked;

  // Resolve key col for each sheet
  if (keyLinked) {
    const linkedKey = selection.linkedKeyCol || checkedConfigs[0].headers[0] || '';
    checkedConfigs.forEach(cfg => { cfg.keyCol = linkedKey; });
  } else {
    checkedConfigs.forEach(cfg => {
      if (!cfg.keyCol || !cfg.headers.includes(cfg.keyCol)) {
        cfg.keyCol = cfg.headers[0] || '';
      }
    });
  }

  // Resolve selected cols for each sheet — normalize against current headers to remove stale names
  if (colsLinked) {
    const rawLinked = selection.linkedSelectedCols.length > 0
      ? selection.linkedSelectedCols
      : checkedConfigs[0].headers.slice();
    // Normalize against first checked sheet's actual headers
    const validLinked = rawLinked.filter(c => checkedConfigs[0].headers.includes(c));
    const linked = validLinked.length > 0 ? validLinked : checkedConfigs[0].headers.slice();
    checkedConfigs.forEach(cfg => { cfg.selectedCols = linked; });
  } else {
    checkedConfigs.forEach(cfg => {
      const normalized = (cfg.selectedCols || []).filter(c => cfg.headers.includes(c));
      cfg.selectedCols = normalized.length > 0 ? normalized : cfg.headers.slice();
      // Ensure keyCol is always selected
      if (cfg.keyCol && !cfg.selectedCols.includes(cfg.keyCol)) {
        cfg.selectedCols = [cfg.keyCol, ...cfg.selectedCols];
      }
    });
  }

  const commonKeyName = checkedConfigs[0].keyCol;

  const nonKeyCols = [];
  const nonKeySet = new Set();
  for (const cfg of checkedConfigs) {
    for (const col of cfg.selectedCols) {
      if (col === cfg.keyCol || col === commonKeyName) continue;
      if (!nonKeySet.has(col)) { nonKeySet.add(col); nonKeyCols.push(col); }
    }
  }

  const combinedHeaders = [commonKeyName, ...nonKeyCols];
  const combinedData = [];

  for (const cfg of checkedConfigs) {
    for (const row of cfg.data) {
      const out = { __sheet__: cfg.name };
      out[commonKeyName] = row[cfg.keyCol] ?? '';
      for (const col of nonKeyCols) {
        out[col] = (cfg.selectedCols.includes(col) && Object.prototype.hasOwnProperty.call(row, col))
          ? row[col] ?? ''
          : '';
      }
      combinedData.push(out);
    }
  }

  return { headers: combinedHeaders, data: combinedData };
}

// ── buildFinalOutput — pure, reads state not DOM ──

export function buildFinalOutput(mergeResult, unmatchedSelection, conflictResolutions, conflictKeys) {
  const r = mergeResult;
  const rows = [...r.matched];

  for (const idx of (unmatchedSelection.A || [])) {
    const item = r.unmatchedA[idx];
    if (item) rows.push(buildUnmatchedRow(item._row, 'A', r.outputCols, r.keyColA, r.keyColB, item._key));
  }

  for (const idx of (unmatchedSelection.B || [])) {
    const item = r.unmatchedB[idx];
    if (item) rows.push(buildUnmatchedRow(item._row, 'B', r.outputCols, r.keyColA, r.keyColB, item._key));
  }

  for (const [key, action] of Object.entries(conflictResolutions)) {
    const group = r.conflicts[key];
    if (!group || action === 'remove') continue;

    const allRows = [];
    for (const rowA of group.rowsA) {
      for (const rowB of group.rowsB) {
        allRows.push(mergeRow(rowA, rowB, r.outputCols, r.keyColA, r.keyColB));
      }
    }

    if (action === 'all') {
      rows.push(...allRows);
    } else if (action === 'first' && allRows.length > 0) {
      rows.push(allRows[0]);
    }
  }

  return rows;
}

// ── Excel output helpers ──

export function buildConflictsSheet(r) {
  const rows = [];
  const merges = [];
  let rowIdx = 1;

  for (const [key, group] of Object.entries(r.conflicts)) {
    const groupSize = group.rowsA.length + group.rowsB.length;
    const groupStart = rowIdx;

    for (const row of group.rowsA) {
      const out = { _键值: key, _来源文件: '文件A' };
      for (const c of r.colsA) out[c] = row[c] ?? '';
      rows.push(out);
      rowIdx++;
    }
    for (const row of group.rowsB) {
      const out = { _键值: key, _来源文件: '文件B' };
      for (const c of r.colsB) out[c] = row[c] ?? '';
      rows.push(out);
      rowIdx++;
    }

    if (groupSize > 1) {
      merges.push({ s: { r: groupStart, c: 0 }, e: { r: groupStart + groupSize - 1, c: 0 } });
    }
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  if (merges.length > 0) ws['!merges'] = merges;
  return ws;
}

export function sanitizeSheetName(name) {
  return String(name).replace(/[\/\\?*[\]:]/g, '_').slice(0, 31) || '合并结果';
}
