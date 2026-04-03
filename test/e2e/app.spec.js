/**
 * E2E tests for Excel Merge Tool
 *
 * Covers the full 5-step wizard flow:
 *   Step 1 → upload a.xlsx + b.xlsx
 *   Step 2 → verify sheets are detected
 *   Step 3 → verify/select 'id' as key column
 *   Step 4 → select all merge columns → click 开始合并
 *   Step 5 → verify matched (2), unmatched (2), conflict (1)
 *          → download Excel and CSV
 *
 * Run: npx playwright test
 */
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '..', 'fixtures');

const FIXTURE_A = join(fixturesDir, 'a.xlsx');
const FIXTURE_B = join(fixturesDir, 'b.xlsx');

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Upload a file to the NUpload dragger for slot A or B.
 *
 * After slot A is uploaded its NUpload is replaced by the done-card,
 * so only one <input type="file"> remains in the DOM (slot B's).
 * Strategy: always target the FIRST visible file input — callers must
 * upload A and wait for its done-card before uploading B.
 */
async function uploadFile(page, which, filePath) {
  // NaiveUI NUpload renders a hidden <input type="file"> inside the trigger.
  // Use .first() — there is always exactly one remaining slot.
  void which; // kept for readability at call sites
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(filePath);
}

/** Wait for the file-done card to appear (upload success indicator) */
async function waitForUploadDone(page, which) {
  await expect(
    page.locator('.file-done-label').filter({ hasText: `文件 ${which}` })
  ).toBeVisible({ timeout: 10_000 });
}

/** Select a value from a NaiveUI NSelect dropdown */
async function selectOption(page, selector, value) {
  await page.locator(selector).click();
  // NaiveUI appends dropdown options to document body as .n-base-select-option
  await page.locator(`.n-base-select-option[data-value="${value}"]`).click();
}

// ── Tests ────────────────────────────────────────────────────────────────

test.describe('Full wizard flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // ── Step 1: Upload ────────────────────────────────────────────────────
  test('Step 1 — uploads both files successfully', async ({ page }) => {
    await uploadFile(page, 'A', FIXTURE_A);
    await waitForUploadDone(page, 'A');
    await expect(page.locator('.file-done-name').first()).toContainText('a.xlsx');

    await uploadFile(page, 'B', FIXTURE_B);
    await waitForUploadDone(page, 'B');
    await expect(page.locator('.file-done-name').last()).toContainText('b.xlsx');
  });

  // ── Step 2: Sheet detection ───────────────────────────────────────────
  test('Step 2 — detects sheet names', async ({ page }) => {
    await uploadFile(page, 'A', FIXTURE_A);
    await waitForUploadDone(page, 'A');
    await uploadFile(page, 'B', FIXTURE_B);
    await waitForUploadDone(page, 'B');

    // Sheet names from fixtures
    await expect(page.locator('.sheet-name').filter({ hasText: 'Employees' })).toBeVisible();
    await expect(page.locator('.sheet-name').filter({ hasText: 'Departments' })).toBeVisible();
  });

  test('Step 2 — shows correct row counts', async ({ page }) => {
    await uploadFile(page, 'A', FIXTURE_A);
    await waitForUploadDone(page, 'A');
    await uploadFile(page, 'B', FIXTURE_B);
    await waitForUploadDone(page, 'B');

    // Sheet items show row count in ".sheet-row-count" spans
    // a.xlsx has 5 rows, b.xlsx has 4 rows
    await expect(page.locator('.sheet-row-count').filter({ hasText: '5 行' })).toBeVisible();
    await expect(page.locator('.sheet-row-count').filter({ hasText: '4 行' })).toBeVisible();
  });

  // ── Step 3: Key column ────────────────────────────────────────────────
  test('Step 3 — key column auto-selects first header', async ({ page }) => {
    await uploadFile(page, 'A', FIXTURE_A);
    await waitForUploadDone(page, 'A');
    await uploadFile(page, 'B', FIXTURE_B);
    await waitForUploadDone(page, 'B');

    // NSelect for key col shows the auto-selected value — both should be 'id'
    const selects = page.locator('#step3 .n-base-selection-label');
    await expect(selects.first()).toContainText('id', { timeout: 5_000 });
    await expect(selects.last()).toContainText('id');
  });

  // ── Step 4: Merge columns + run ───────────────────────────────────────
  test('Step 4 — click 全选 and run merge', async ({ page }) => {
    await uploadFile(page, 'A', FIXTURE_A);
    await waitForUploadDone(page, 'A');
    await uploadFile(page, 'B', FIXTURE_B);
    await waitForUploadDone(page, 'B');

    // Click 全选 for file A and B in step 4
    const selectAllBtns = page.locator('#step4').getByText('全选');
    await selectAllBtns.first().click();
    await selectAllBtns.last().click();

    // Click 开始合并
    await page.getByRole('button', { name: '开始合并' }).click();

    // Wait for step 5 to appear (mergeResult set → tabs visible)
    await expect(page.locator('.n-tabs')).toBeVisible({ timeout: 10_000 });
  });

  // ── Step 5: Results ───────────────────────────────────────────────────
  test('Step 5 — matched tab shows 2 rows', async ({ page }) => {
    await uploadFile(page, 'A', FIXTURE_A);
    await waitForUploadDone(page, 'A');
    await uploadFile(page, 'B', FIXTURE_B);
    await waitForUploadDone(page, 'B');

    await page.locator('#step4').getByText('全选').first().click();
    await page.locator('#step4').getByText('全选').last().click();
    await page.getByRole('button', { name: '开始合并' }).click();
    await expect(page.locator('.n-tabs')).toBeVisible({ timeout: 10_000 });

    // The matched tab label includes the count
    await expect(page.locator('.n-tabs-tab').filter({ hasText: '匹配结果 (2)' })).toBeVisible();
  });

  test('Step 5 — unmatched tab shows 2 items', async ({ page }) => {
    await uploadFile(page, 'A', FIXTURE_A);
    await waitForUploadDone(page, 'A');
    await uploadFile(page, 'B', FIXTURE_B);
    await waitForUploadDone(page, 'B');

    await page.locator('#step4').getByText('全选').first().click();
    await page.locator('#step4').getByText('全选').last().click();
    await page.getByRole('button', { name: '开始合并' }).click();
    await expect(page.locator('.n-tabs')).toBeVisible({ timeout: 10_000 });

    // Tab label: 未匹配数据 (2)  → 1 unmatched A + 1 unmatched B
    await expect(page.locator('.n-tabs-tab').filter({ hasText: '未匹配数据 (2)' })).toBeVisible();
  });

  test('Step 5 — conflicts tab shows badge for 1 conflict key', async ({ page }) => {
    await uploadFile(page, 'A', FIXTURE_A);
    await waitForUploadDone(page, 'A');
    await uploadFile(page, 'B', FIXTURE_B);
    await waitForUploadDone(page, 'B');

    await page.locator('#step4').getByText('全选').first().click();
    await page.locator('#step4').getByText('全选').last().click();
    await page.getByRole('button', { name: '开始合并' }).click();
    await expect(page.locator('.n-tabs')).toBeVisible({ timeout: 10_000 });

    // Click conflicts tab to activate it
    await page.locator('.n-tabs-tab').filter({ hasText: '重复键冲突' }).click();

    // The conflict key '5' should be visible — class is .conflict-key-text, text contains 键 "5"
    await expect(page.locator('.conflict-key-text').filter({ hasText: '"5"' })).toBeVisible();
  });

  test('Step 5 — matched result table contains Alice and Bob', async ({ page }) => {
    await uploadFile(page, 'A', FIXTURE_A);
    await waitForUploadDone(page, 'A');
    await uploadFile(page, 'B', FIXTURE_B);
    await waitForUploadDone(page, 'B');

    await page.locator('#step4').getByText('全选').first().click();
    await page.locator('#step4').getByText('全选').last().click();
    await page.getByRole('button', { name: '开始合并' }).click();
    await expect(page.locator('.n-tabs')).toBeVisible({ timeout: 10_000 });

    // Matched tab is active by default
    await expect(page.locator('td').filter({ hasText: 'Alice' })).toBeVisible();
    await expect(page.locator('td').filter({ hasText: 'Bob' })).toBeVisible();
  });

  // ── Download Excel ────────────────────────────────────────────────────
  test('Step 5 — Excel download triggers file save', async ({ page }) => {
    await uploadFile(page, 'A', FIXTURE_A);
    await waitForUploadDone(page, 'A');
    await uploadFile(page, 'B', FIXTURE_B);
    await waitForUploadDone(page, 'B');

    await page.locator('#step4').getByText('全选').first().click();
    await page.locator('#step4').getByText('全选').last().click();
    await page.getByRole('button', { name: '开始合并' }).click();
    await expect(page.locator('.n-tabs')).toBeVisible({ timeout: 10_000 });

    // Listen for download event before clicking
    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 });
    await page.getByRole('button', { name: /下载.*Excel/i }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  });

  // ── CSV download ──────────────────────────────────────────────────────
  test('Step 5 — CSV download triggers file save', async ({ page }) => {
    await uploadFile(page, 'A', FIXTURE_A);
    await waitForUploadDone(page, 'A');
    await uploadFile(page, 'B', FIXTURE_B);
    await waitForUploadDone(page, 'B');

    await page.locator('#step4').getByText('全选').first().click();
    await page.locator('#step4').getByText('全选').last().click();
    await page.getByRole('button', { name: '开始合并' }).click();
    await expect(page.locator('.n-tabs')).toBeVisible({ timeout: 10_000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 });
    await page.getByRole('button', { name: /下载.*CSV/i }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });
});

// ── CSV upload flow ───────────────────────────────────────────────────────

test.describe('CSV file upload', () => {
  test('CSV files upload and produce merge results', async ({ page }) => {
    await page.goto('/');

    await page.locator('input[type="file"]').first().setInputFiles(join(fixturesDir, 'a.csv'));
    await waitForUploadDone(page, 'A');

    // After A's dragger is replaced by done-card, B's input is now the only one
    await page.locator('input[type="file"]').first().setInputFiles(join(fixturesDir, 'b.csv'));
    await waitForUploadDone(page, 'B');

    await page.locator('#step4').getByText('全选').first().click();
    await page.locator('#step4').getByText('全选').last().click();
    await page.getByRole('button', { name: '开始合并' }).click();

    await expect(page.locator('.n-tabs-tab').filter({ hasText: '匹配结果 (2)' })).toBeVisible({ timeout: 10_000 });
  });
});

// ── Reset flow ────────────────────────────────────────────────────────────

test.describe('File reset', () => {
  test('重新上传 button resets the upload slot', async ({ page }) => {
    await page.goto('/');

    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE_A);
    await waitForUploadDone(page, 'A');

    // Click 重新上传
    await page.getByRole('button', { name: '重新上传' }).first().click();

    // The upload dragger should reappear (upload slot cleared)
    await expect(page.locator('.n-upload-dragger').first()).toBeVisible();
  });
});
