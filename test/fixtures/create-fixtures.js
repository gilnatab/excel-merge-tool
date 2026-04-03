/**
 * Creates test fixture files: a.xlsx, b.xlsx, a.csv, b.csv
 * Run: node test/fixtures/create-fixtures.js
 *
 * Test data design:
 *   Rows 1+2  → 1:1 match  (id=1: Alice/NYC, id=2: Bob/LA)
 *   Row  3    → unmatched A (id=3: Charlie – no matching B row)
 *   Row  4    → unmatched B (id=4: Tokyo   – no matching A row)
 *   Rows 5a+5b→ conflict    (id=5: two A rows, one B row → N:M)
 */
import * as XLSX from 'xlsx';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── File A: employees ──────────────────────────────────────────────────
const dataA = [
  { id: '1', name: 'Alice',   score: 90 },
  { id: '2', name: 'Bob',     score: 80 },
  { id: '3', name: 'Charlie', score: 70 },  // unmatched A
  { id: '5', name: 'Dup1',    score: 95 },  // conflict row 1
  { id: '5', name: 'Dup2',    score: 92 },  // conflict row 2
];

// ── File B: locations ──────────────────────────────────────────────────
const dataB = [
  { id: '1', city: 'NYC',    dept: 'Engineering' },
  { id: '2', city: 'LA',     dept: 'Marketing'   },
  { id: '4', city: 'Tokyo',  dept: 'Finance'     },  // unmatched B
  { id: '5', city: 'Boston', dept: 'HR'          },  // conflict match
];

mkdirSync(__dirname, { recursive: true });

// xlsx ─────────────────────────────────────────────────────────────────
function makeWorkbook(data, sheetName) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return wb;
}

function writeXlsx(wb, filePath) {
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  writeFileSync(filePath, buf);
}

writeXlsx(makeWorkbook(dataA, 'Employees'),   join(__dirname, 'a.xlsx'));
writeXlsx(makeWorkbook(dataB, 'Departments'), join(__dirname, 'b.xlsx'));

// csv ──────────────────────────────────────────────────────────────────
const BOM = '\uFEFF';
writeFileSync(join(__dirname, 'a.csv'), BOM + XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dataA)));
writeFileSync(join(__dirname, 'b.csv'), BOM + XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dataB)));

console.log('Test fixtures created in test/fixtures/');
