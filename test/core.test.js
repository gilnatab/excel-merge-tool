import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildIndex,
  resolveColumnNames,
  mergeRow,
  buildUnmatchedRow,
  classifyMerge,
  sanitizeSheetName,
} from '../src/utils/excel.js';

// escAttr is no longer a production function (Vue templates auto-escape);
// kept inline here to preserve existing test coverage.
function escAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('buildIndex', () => {
  test('indexes rows by key column', () => {
    const data = [
      { id: '1', val: 'a' },
      { id: '2', val: 'b' },
      { id: '3', val: 'c' },
    ];
    const { idx, emptyKeyRows } = buildIndex(data, 'id');
    assert.equal(idx.size, 3);
    assert.deepEqual(idx.get('1'), [{ id: '1', val: 'a' }]);
    assert.equal(emptyKeyRows.length, 0);
  });

  test('groups duplicate keys together', () => {
    const data = [
      { id: '1', val: 'a' },
      { id: '1', val: 'b' },
      { id: '2', val: 'c' },
    ];
    const { idx } = buildIndex(data, 'id');
    assert.equal(idx.get('1').length, 2);
    assert.equal(idx.get('2').length, 1);
  });

  test('puts empty-key rows into emptyKeyRows', () => {
    const data = [
      { id: '', val: 'empty' },
      { id: null, val: 'null' },
      { id: '   ', val: 'whitespace' },
      { id: '1', val: 'normal' },
    ];
    const { idx, emptyKeyRows } = buildIndex(data, 'id');
    assert.equal(emptyKeyRows.length, 3);
    assert.equal(idx.size, 1);
    assert.equal(idx.get('1').length, 1);
  });

  test('trims whitespace from keys', () => {
    const data = [
      { id: '  1  ', val: 'a' },
      { id: '1', val: 'b' },
    ];
    const { idx } = buildIndex(data, 'id');
    assert.equal(idx.size, 1);
    assert.equal(idx.get('1').length, 2);
  });

  test('handles missing key column gracefully', () => {
    const data = [{ name: 'no id here' }];
    const { idx, emptyKeyRows } = buildIndex(data, 'id');
    assert.equal(idx.size, 0);
    assert.equal(emptyKeyRows.length, 1);
  });
});

describe('resolveColumnNames', () => {
  test('key column comes first with source=key', () => {
    const result = resolveColumnNames(['id', 'name'], ['id', 'city'], 'id', 'id');
    assert.equal(result[0].name, 'id');
    assert.equal(result[0].source, 'key');
  });

  test('non-conflicting columns have no prefix', () => {
    const result = resolveColumnNames(['id', 'name'], ['id', 'city'], 'id', 'id');
    const names = result.map(c => c.name);
    assert.ok(names.includes('name'));
    assert.ok(names.includes('city'));
    assert.ok(!names.includes('A_name'));
    assert.ok(!names.includes('B_city'));
  });

  test('conflicting non-key columns get A_ / B_ prefix', () => {
    const result = resolveColumnNames(['id', 'score'], ['id', 'score'], 'id', 'id');
    const names = result.map(c => c.name);
    assert.ok(names.includes('A_score'));
    assert.ok(names.includes('B_score'));
    assert.ok(!names.includes('score'));
  });

  test('different key column names — key uses A name', () => {
    const result = resolveColumnNames(['code', 'val'], ['ref', 'desc'], 'code', 'ref');
    assert.equal(result[0].name, 'code');
    assert.equal(result[0].source, 'key');
  });

  test('returns correct source metadata', () => {
    const result = resolveColumnNames(['id', 'a'], ['id', 'b'], 'id', 'id');
    const colA = result.find(c => c.name === 'a');
    const colB = result.find(c => c.name === 'b');
    assert.equal(colA.source, 'A');
    assert.equal(colB.source, 'B');
    assert.equal(colA.original, 'a');
    assert.equal(colB.original, 'b');
  });
});

describe('mergeRow', () => {
  const outputCols = [
    { name: 'id', source: 'key' },
    { name: 'name', source: 'A', original: 'name' },
    { name: 'city', source: 'B', original: 'city' },
  ];

  test('merges key from A and data from both sides', () => {
    const rowA = { id: '1', name: 'Alice', __sheet__: 'S1' };
    const rowB = { id: '1', city: 'NYC' };
    const out = mergeRow(rowA, rowB, outputCols, 'id', 'id');
    assert.equal(out.id, '1');
    assert.equal(out.name, 'Alice');
    assert.equal(out.city, 'NYC');
  });

  test('carries __sheet__ from rowA', () => {
    const rowA = { id: '1', name: 'Alice', __sheet__: 'MySheet' };
    const rowB = { id: '1', city: 'LA', __sheet__: 'Other' };
    const out = mergeRow(rowA, rowB, outputCols, 'id', 'id');
    assert.equal(out.__sheet__, 'MySheet');
  });

  test('uses empty string for missing fields', () => {
    const rowA = { id: '1', __sheet__: '' };
    const rowB = { id: '1' };
    const out = mergeRow(rowA, rowB, outputCols, 'id', 'id');
    assert.equal(out.name, '');
    assert.equal(out.city, '');
  });
});

describe('buildUnmatchedRow', () => {
  const outputCols = [
    { name: 'id', source: 'key' },
    { name: 'name', source: 'A', original: 'name' },
    { name: 'city', source: 'B', original: 'city' },
  ];

  test('unmatched A row: fills A columns, blanks B columns', () => {
    const row = { id: '5', name: 'Bob', __sheet__: 'S1' };
    const out = buildUnmatchedRow(row, 'A', outputCols, 'id', 'id', '5');
    assert.equal(out.id, '5');
    assert.equal(out.name, 'Bob');
    assert.equal(out.city, '');
  });

  test('unmatched B row: fills B columns, blanks A columns', () => {
    const row = { id: '7', city: 'Paris', __sheet__: 'S2' };
    const out = buildUnmatchedRow(row, 'B', outputCols, 'id', 'id', '7');
    assert.equal(out.id, '7');
    assert.equal(out.name, '');
    assert.equal(out.city, 'Paris');
  });

  test('carries __sheet__ from the row', () => {
    const row = { id: '3', name: 'X', __sheet__: 'Tab2' };
    const out = buildUnmatchedRow(row, 'A', outputCols, 'id', 'id', '3');
    assert.equal(out.__sheet__, 'Tab2');
  });
});

describe('classifyMerge', () => {
  const colsA = ['id', 'name', 'score'];
  const colsB = ['id', 'city'];

  function makeDataA(rows) {
    return rows.map(([id, name, score]) => ({ id, name, score: score ?? '', __sheet__: 'A' }));
  }
  function makeDataB(rows) {
    return rows.map(([id, city]) => ({ id, city: city ?? '', __sheet__: 'B' }));
  }

  test('1:1 match produces matched records', () => {
    const dataA = makeDataA([['1', 'Alice', 90], ['2', 'Bob', 80]]);
    const dataB = makeDataB([['1', 'NYC'], ['2', 'LA']]);
    const r = classifyMerge(dataA, dataB, 'id', 'id', colsA, colsB);
    assert.equal(r.matched.length, 2);
    assert.equal(r.unmatchedA.length, 0);
    assert.equal(r.unmatchedB.length, 0);
    assert.equal(Object.keys(r.conflicts).length, 0);
  });

  test('row only in A goes to unmatchedA', () => {
    const dataA = makeDataA([['1', 'Alice', 90], ['3', 'Charlie', 70]]);
    const dataB = makeDataB([['1', 'NYC']]);
    const r = classifyMerge(dataA, dataB, 'id', 'id', colsA, colsB);
    assert.equal(r.matched.length, 1);
    assert.equal(r.unmatchedA.length, 1);
    assert.equal(r.unmatchedA[0]._key, '3');
  });

  test('row only in B goes to unmatchedB', () => {
    const dataA = makeDataA([['1', 'Alice', 90]]);
    const dataB = makeDataB([['1', 'NYC'], ['4', 'Tokyo']]);
    const r = classifyMerge(dataA, dataB, 'id', 'id', colsA, colsB);
    assert.equal(r.unmatchedB.length, 1);
    assert.equal(r.unmatchedB[0]._key, '4');
  });

  test('N:M key goes to conflicts', () => {
    const dataA = makeDataA([['1', 'Alice', 90], ['1', 'Alice2', 85]]);
    const dataB = makeDataB([['1', 'NYC']]);
    const r = classifyMerge(dataA, dataB, 'id', 'id', colsA, colsB);
    assert.equal(r.matched.length, 0);
    assert.ok('1' in r.conflicts);
    assert.equal(r.conflicts['1'].rowsA.length, 2);
    assert.equal(r.conflicts['1'].rowsB.length, 1);
  });

  test('empty-key rows go to unmatched', () => {
    const dataA = makeDataA([['', 'NoKey', 0], ['1', 'Alice', 90]]);
    const dataB = makeDataB([['1', 'NYC'], ['', 'NoKeyB']]);
    const r = classifyMerge(dataA, dataB, 'id', 'id', colsA, colsB);
    assert.equal(r.unmatchedA.some(x => x._key === ''), true);
    assert.equal(r.unmatchedB.some(x => x._key === ''), true);
    assert.equal(r.matched.length, 1);
  });

  test('column conflicts get A_/B_ prefix in outputCols', () => {
    const dataA = [{ id: '1', score: 10, __sheet__: 'A' }];
    const dataB = [{ id: '1', score: 20, __sheet__: 'B' }];
    const r = classifyMerge(dataA, dataB, 'id', 'id', ['id', 'score'], ['id', 'score']);
    const colNames = r.outputCols.map(c => c.name);
    assert.ok(colNames.includes('A_score'));
    assert.ok(colNames.includes('B_score'));
    assert.equal(r.matched[0]['A_score'], 10);
    assert.equal(r.matched[0]['B_score'], 20);
  });

  test('empty datasets produce empty results', () => {
    const r = classifyMerge([], [], 'id', 'id', ['id'], ['id']);
    assert.equal(r.matched.length, 0);
    assert.equal(r.unmatchedA.length, 0);
    assert.equal(r.unmatchedB.length, 0);
    assert.equal(Object.keys(r.conflicts).length, 0);
  });
});

describe('sanitizeSheetName', () => {
  test('removes illegal Excel sheet name characters', () => {
    assert.equal(sanitizeSheetName('a/b\\c?d*e[f]g:h'), 'a_b_c_d_e_f_g_h');
  });

  test('truncates to 31 characters', () => {
    const long = 'a'.repeat(40);
    assert.equal(sanitizeSheetName(long).length, 31);
  });

  test('returns fallback for empty string', () => {
    assert.equal(sanitizeSheetName(''), '合并结果');
  });

  test('passes clean names through unchanged', () => {
    assert.equal(sanitizeSheetName('Sheet1'), 'Sheet1');
    assert.equal(sanitizeSheetName('合并结果'), '合并结果');
  });
});

describe('escAttr', () => {
  test('escapes ampersand', () => {
    assert.equal(escAttr('a&b'), 'a&amp;b');
  });

  test('escapes double quotes', () => {
    assert.equal(escAttr('"hello"'), '&quot;hello&quot;');
  });

  test('escapes single quotes', () => {
    assert.equal(escAttr("it's"), 'it&#39;s');
  });

  test('escapes < and >', () => {
    assert.equal(escAttr('<script>'), '&lt;script&gt;');
  });

  test('escapes all special chars in one string', () => {
    assert.equal(escAttr('<a href="x&y">it\'s</a>'), '&lt;a href=&quot;x&amp;y&quot;&gt;it&#39;s&lt;/a&gt;');
  });

  test('converts non-string values to string', () => {
    assert.equal(escAttr(42), '42');
    assert.equal(escAttr(null), 'null');
  });
});
