/**
 * Creates test fixture files:
 *   a.xlsx, b.xlsx, a.csv, b.csv  - standard single-sheet fixtures
 *   a_multi.xlsx, b_multi.xlsx    - multi-sheet fixtures for keepSheetOutput tests
 *   a_wide.xlsx, b_wide.xlsx      - wide-column fixtures for preview regression tests
 *   a_large.xlsx, b_large.xlsx    - multi-page fixtures for fullscreen pagination tests
 *
 * Run: node test/fixtures/create-fixtures.js
 *
 * Standard test data design:
 *   Rows 1+2  → 1:1 match  (id=1: Alice/NYC, id=2: Bob/LA)
 *   Row  3    → unmatched A (id=3: Charlie – no matching B row)
 *   Row  4    → unmatched B (id=4: Tokyo   – no matching A row)
 *   Rows 5a+5b→ conflict    (id=5: two A rows, one B row → N:M)
 *
 * Multi-sheet design (a_multi / b_multi):
 *   a_multi.xlsx: "Employees" (id=1..3) + "Managers" (id=10..11)
 *   b_multi.xlsx: "Locations" (id=1..4) + "Offices"  (id=10..12)
 *   — both sheets share id key, enabling keepSheetOutput test
 */
import * as XLSX from 'xlsx';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Standard fixtures ─────────────────────────────────────────────────────

const dataA = [
  { id: '1', name: 'Alice',   score: 90 },
  { id: '2', name: 'Bob',     score: 80 },
  { id: '3', name: 'Charlie', score: 70 },  // unmatched A
  { id: '5', name: 'Dup1',    score: 95 },  // conflict row 1
  { id: '5', name: 'Dup2',    score: 92 },  // conflict row 2
];

const dataB = [
  { id: '1', city: 'NYC',    dept: 'Engineering' },
  { id: '2', city: 'LA',     dept: 'Marketing'   },
  { id: '4', city: 'Tokyo',  dept: 'Finance'     },  // unmatched B
  { id: '5', city: 'Boston', dept: 'HR'          },  // conflict match
];

const dataA_wide = [
  { id: '1', name: 'Alice',   score: 90, team: 'Alpha', level: 'L3', region: 'East' },
  { id: '2', name: 'Bob',     score: 80, team: 'Beta',  level: 'L2', region: 'West' },
  { id: '3', name: 'Charlie', score: 70, team: 'Gamma', level: 'L1', region: 'South' },
];

const dataB_wide = [
  { id: '1', city: 'NYC',   dept: 'Engineering', country: 'US', building: 'HQ',    status: 'Active' },
  { id: '2', city: 'LA',    dept: 'Marketing',   country: 'US', building: 'Annex', status: 'Active' },
  { id: '4', city: 'Tokyo', dept: 'Finance',     country: 'JP', building: 'Tower', status: 'Pending' },
];

const dataA_large = Array.from({ length: 1240 }, (_, idx) => ({
  id: String(idx + 1),
  name: `Employee ${idx + 1}`,
  score: 60 + (idx % 41),
}));

const dataB_large = Array.from({ length: 1240 }, (_, idx) => ({
  id: String(idx + 1),
  city: `City ${idx + 1}`,
  dept: `Dept ${idx % 12}`,
}));

// ── Multi-sheet fixtures ──────────────────────────────────────────────────

const dataA_employees = [
  { id: '1', name: 'Alice', score: 90 },
  { id: '2', name: 'Bob',   score: 80 },
  { id: '3', name: 'Carol', score: 75 },
];
const dataA_managers = [
  { id: '10', name: 'Dave',  dept: 'Engineering' },
  { id: '11', name: 'Eve',   dept: 'Marketing'   },
];

const dataB_locations = [
  { id: '1', city: 'NYC' },
  { id: '2', city: 'LA'  },
  { id: '4', city: 'Tokyo' },  // unmatched
];
const dataB_offices = [
  { id: '10', office: 'HQ'     },
  { id: '11', office: 'Branch' },
  { id: '12', office: 'Remote' }, // unmatched
];

// ── Helpers ───────────────────────────────────────────────────────────────

function makeWorkbook(sheets) {
  const wb = XLSX.utils.book_new();
  for (const { data, name } of sheets) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), name);
  }
  return wb;
}

function writeXlsx(wb, filePath) {
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  writeFileSync(filePath, buf);
}

mkdirSync(__dirname, { recursive: true });

// Standard
writeXlsx(makeWorkbook([{ data: dataA, name: 'Employees'   }]), join(__dirname, 'a.xlsx'));
writeXlsx(makeWorkbook([{ data: dataB, name: 'Departments' }]), join(__dirname, 'b.xlsx'));

// Multi-sheet
writeXlsx(
  makeWorkbook([
    { data: dataA_employees, name: 'Employees' },
    { data: dataA_managers,  name: 'Managers'  },
  ]),
  join(__dirname, 'a_multi.xlsx')
);
writeXlsx(
  makeWorkbook([
    { data: dataB_locations, name: 'Locations' },
    { data: dataB_offices,   name: 'Offices'   },
  ]),
  join(__dirname, 'b_multi.xlsx')
);

// Wide-column regression fixtures
writeXlsx(makeWorkbook([{ data: dataA_wide, name: 'WideEmployees'   }]), join(__dirname, 'a_wide.xlsx'));
writeXlsx(makeWorkbook([{ data: dataB_wide, name: 'WideDepartments' }]), join(__dirname, 'b_wide.xlsx'));

// Fullscreen pagination fixtures
writeXlsx(makeWorkbook([{ data: dataA_large, name: 'LargeEmployees'   }]), join(__dirname, 'a_large.xlsx'));
writeXlsx(makeWorkbook([{ data: dataB_large, name: 'LargeDepartments' }]), join(__dirname, 'b_large.xlsx'));

// CSV (standard data only)
const BOM = '\uFEFF';
writeFileSync(join(__dirname, 'a.csv'), BOM + XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dataA)));
writeFileSync(join(__dirname, 'b.csv'), BOM + XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(dataB)));

console.log('Test fixtures created in test/fixtures/');
