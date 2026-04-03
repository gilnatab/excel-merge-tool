/**
 * E2E tests for Excel Merge Tool
 *
 * Covers the full 5-step wizard flow:
 *   Step 1 → upload a.xlsx + b.xlsx → click Next
 *   Step 2 → verify sheets detected → click Next
 *   Step 3 → verify key column → click Next
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

/** Upload a file via the hidden input inside the upload zone */
async function uploadFile(page, which, filePath) {
  void which;
  const fileInput = page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(filePath);
}

/** Wait for the file done card to appear */
async function waitForUploadDone(page, which) {
  await expect(
    page.getByTestId(`done-card-${which.toLowerCase()}`)
  ).toBeVisible({ timeout: 10_000 });
}

/** Upload both files and advance to step 2 */
async function uploadBothAndAdvance(page) {
  await uploadFile(page, 'A', FIXTURE_A);
  await waitForUploadDone(page, 'A');
  await uploadFile(page, 'B', FIXTURE_B);
  await waitForUploadDone(page, 'B');
  await page.getByTestId('btn-next').click();
}

/** Navigate through steps 2 and 3 to reach step 4 */
async function advanceToStep4(page) {
  await uploadBothAndAdvance(page);
  // Step 2 → Next
  await page.getByTestId('btn-next').click();
  // Step 3 → Next
  await page.getByTestId('btn-next').click();
}

/** Run the full merge flow and wait for results */
async function runMergeFlow(page) {
  await advanceToStep4(page);
  // Select all columns for A and B
  const selectAllBtns = page.getByRole('button', { name: '全选' });
  await selectAllBtns.first().click();
  await selectAllBtns.last().click();
  // Click merge
  await page.getByTestId('btn-merge').click();
  // Wait for matched tab to appear
  await expect(page.getByTestId('tab-matched')).toBeVisible({ timeout: 10_000 });
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
    await expect(page.getByTestId('done-card-a')).toContainText('a.xlsx');

    await uploadFile(page, 'B', FIXTURE_B);
    await waitForUploadDone(page, 'B');
    await expect(page.getByTestId('done-card-b')).toContainText('b.xlsx');
  });

  // ── Step 2: Sheet detection ───────────────────────────────────────────
  test('Step 2 — detects sheet names', async ({ page }) => {
    await uploadBothAndAdvance(page);

    await expect(page.locator('.sheet-name').filter({ hasText: 'Employees' })).toBeVisible();
    await expect(page.locator('.sheet-name').filter({ hasText: 'Departments' })).toBeVisible();
  });

  test('Step 2 — shows correct row counts', async ({ page }) => {
    await uploadBothAndAdvance(page);

    await expect(page.locator('text=5 行')).toBeVisible();
    await expect(page.locator('text=4 行')).toBeVisible();
  });

  // ── Step 3: Key column ────────────────────────────────────────────────
  test('Step 3 — key column auto-selects first header', async ({ page }) => {
    await uploadBothAndAdvance(page);
    await page.getByTestId('btn-next').click(); // go to step 3

    // Native <select> elements show the auto-selected value
    const selects = page.locator('select');
    await expect(selects.first()).toHaveValue('id', { timeout: 5_000 });
    await expect(selects.last()).toHaveValue('id');
  });

  // ── Step 4: Merge columns + run ───────────────────────────────────────
  test('Step 4 — click 全选 and run merge', async ({ page }) => {
    await advanceToStep4(page);

    const selectAllBtns = page.getByRole('button', { name: '全选' });
    await selectAllBtns.first().click();
    await selectAllBtns.last().click();

    await page.getByTestId('btn-merge').click();

    await expect(page.getByTestId('tab-matched')).toBeVisible({ timeout: 10_000 });
  });

  // ── Step 5: Results ───────────────────────────────────────────────────
  test('Step 5 — matched tab shows 2 rows', async ({ page }) => {
    await runMergeFlow(page);

    await expect(page.getByTestId('tab-matched')).toContainText('2');
  });

  test('Step 5 — unmatched tab shows 2 items', async ({ page }) => {
    await runMergeFlow(page);

    await expect(page.getByTestId('tab-unmatched')).toContainText('2');
  });

  test('Step 5 — conflicts tab shows badge for 1 conflict key', async ({ page }) => {
    await runMergeFlow(page);

    await page.getByTestId('tab-conflicts').click();
    await expect(page.locator('[data-testid="conflict-key-text"]').filter({ hasText: '"5"' })).toBeVisible();
  });

  test('Step 5 — matched result table contains Alice and Bob', async ({ page }) => {
    await runMergeFlow(page);

    await expect(page.locator('td').filter({ hasText: 'Alice' })).toBeVisible();
    await expect(page.locator('td').filter({ hasText: 'Bob' })).toBeVisible();
  });

  // ── Download Excel ────────────────────────────────────────────────────
  test('Step 5 — Excel download triggers file save', async ({ page }) => {
    await runMergeFlow(page);

    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 });
    await page.getByTestId('btn-download-excel').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  });

  // ── CSV download ──────────────────────────────────────────────────────
  test('Step 5 — CSV download triggers file save', async ({ page }) => {
    await runMergeFlow(page);

    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 });
    await page.getByTestId('btn-download-csv').click();
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

    await page.locator('input[type="file"]').first().setInputFiles(join(fixturesDir, 'b.csv'));
    await waitForUploadDone(page, 'B');

    // Advance to step 4
    await page.getByTestId('btn-next').click();
    await page.getByTestId('btn-next').click();
    await page.getByTestId('btn-next').click();

    await page.getByRole('button', { name: '全选' }).first().click();
    await page.getByRole('button', { name: '全选' }).last().click();
    await page.getByTestId('btn-merge').click();

    await expect(page.getByTestId('tab-matched')).toContainText('2', { timeout: 10_000 });
  });
});

// ── Reset flow ────────────────────────────────────────────────────────────

test.describe('File reset', () => {
  test('重新上传 button resets the upload slot', async ({ page }) => {
    await page.goto('/');

    await page.locator('input[type="file"]').first().setInputFiles(FIXTURE_A);
    await waitForUploadDone(page, 'A');

    await page.getByTestId('reupload-a').click();

    // Upload zone should reappear
    await expect(page.getByTestId('upload-zone-a')).toBeVisible();
  });
});
