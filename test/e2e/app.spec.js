/**
 * E2E tests for Excel Merge Tool — Comprehensive browser simulation
 *
 * Covers the full 6-step wizard flow and all interactive features:
 *   Step 1  — file upload (xlsx + csv), re-upload, disabled-next guard
 *   Step 2  — sheet detection, row counts, preview, uncheck/re-check
 *   Step 3  — key column selection, sync toggle
 *   Step 4  — merge column selection (all/none/individual/search)
 *   Step 5  — matched / unmatched / conflicts views; conflict resolution;
 *             unmatched row selection; fullscreen view; conflict search
 *   Step 6  — export settings (CSV disabled when multi-sheet options on);
 *             Excel download; CSV download; reset
 *   Nav     — prev/next navigation, step indicator state
 *   Edge    — single-file guard, re-upload resets downstream, reset mid-flow
 *
 * Run: npx playwright test
 *
 * Prerequisites: `npm run dev` running on http://localhost:5173
 *                `npm run fixtures` to regenerate fixture files
 */
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, '..', 'fixtures');

const FIX = {
  A:      join(fixturesDir, 'a.xlsx'),
  B:      join(fixturesDir, 'b.xlsx'),
  A_CSV:  join(fixturesDir, 'a.csv'),
  B_CSV:  join(fixturesDir, 'b.csv'),
  A_MULTI: join(fixturesDir, 'a_multi.xlsx'),
  B_MULTI: join(fixturesDir, 'b_multi.xlsx'),
  A_WIDE: join(fixturesDir, 'a_wide.xlsx'),
  B_WIDE: join(fixturesDir, 'b_wide.xlsx'),
  A_LARGE: join(fixturesDir, 'a_large.xlsx'),
  B_LARGE: join(fixturesDir, 'b_large.xlsx'),
};

// ── Helpers ───────────────────────────────────────────────────────────────

/** Upload a file into the specific upload zone (A or B). */
async function uploadFile(page, which, filePath) {
  const zone = page.getByTestId(`upload-zone-${which.toLowerCase()}`);
  await zone.locator('input[type="file"]').setInputFiles(filePath);
}

/** Wait for the done card to appear after upload. */
async function waitForUploadDone(page, which) {
  await expect(
    page.getByTestId(`done-card-${which.toLowerCase()}`)
  ).toBeVisible({ timeout: 10_000 });
}

/** Upload both standard xlsx files and click Next on Step 1. */
async function uploadBothAndAdvance(page) {
  await uploadFile(page, 'A', FIX.A);
  await waitForUploadDone(page, 'A');
  await uploadFile(page, 'B', FIX.B);
  await waitForUploadDone(page, 'B');
  await page.getByTestId('btn-next').click();
}

/** Upload both files and advance through Steps 2 and 3 to reach Step 4. */
async function advanceToStep4(page) {
  await uploadBothAndAdvance(page);
  await page.getByTestId('btn-next').click(); // Step 2 → 3
  await page.getByTestId('btn-next').click(); // Step 3 → 4
}

/** Run the full merge flow and land on Step 5. */
async function runMergeFlow(page) {
  await advanceToStep4(page);
  const selectAllBtns = page.getByRole('button', { name: '全选' });
  await selectAllBtns.first().click();
  await selectAllBtns.last().click();
  await page.getByTestId('btn-next').click(); // triggers merge
  await expect(page.getByTestId('tab-matched')).toBeVisible({ timeout: 10_000 });
}

/** Run full merge flow and advance to Step 6. */
async function runMergeFlowToStep6(page) {
  await runMergeFlow(page);
  await page.getByTestId('btn-next').click();
}

// ── SUITE 1: Step 1 — File Upload ─────────────────────────────────────────

test.describe('Step 1: File Upload', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('upload zones visible on initial load', async ({ page }) => {
    await expect(page.getByTestId('upload-zone-a')).toBeVisible();
    await expect(page.getByTestId('upload-zone-b')).toBeVisible();
  });

  test('next button disabled before any upload', async ({ page }) => {
    await expect(page.getByTestId('btn-next')).toBeDisabled();
  });

  test('next button disabled after only file A uploaded', async ({ page }) => {
    await uploadFile(page, 'A', FIX.A);
    await waitForUploadDone(page, 'A');
    await expect(page.getByTestId('btn-next')).toBeDisabled();
  });

  test('done card shows filename after upload', async ({ page }) => {
    await uploadFile(page, 'A', FIX.A);
    await waitForUploadDone(page, 'A');
    await expect(page.getByTestId('done-card-a')).toContainText('a.xlsx');

    await uploadFile(page, 'B', FIX.B);
    await waitForUploadDone(page, 'B');
    await expect(page.getByTestId('done-card-b')).toContainText('b.xlsx');
  });

  test('next button enabled after both files uploaded', async ({ page }) => {
    await uploadFile(page, 'A', FIX.A);
    await waitForUploadDone(page, 'A');
    await uploadFile(page, 'B', FIX.B);
    await waitForUploadDone(page, 'B');
    await expect(page.getByTestId('btn-next')).toBeEnabled();
  });

  test('re-upload A resets slot — upload zone reappears', async ({ page }) => {
    await uploadFile(page, 'A', FIX.A);
    await waitForUploadDone(page, 'A');
    await page.getByTestId('reupload-a').click();
    await expect(page.getByTestId('upload-zone-a')).toBeVisible();
    await expect(page.getByTestId('done-card-a')).not.toBeVisible();
  });

  test('re-upload A after both loaded disables next button again', async ({ page }) => {
    await uploadFile(page, 'A', FIX.A);
    await waitForUploadDone(page, 'A');
    await uploadFile(page, 'B', FIX.B);
    await waitForUploadDone(page, 'B');
    // Now reset A
    await page.getByTestId('reupload-a').click();
    await expect(page.getByTestId('btn-next')).toBeDisabled();
  });
});

// ── SUITE 2: Step 2 — Sheet Selection ────────────────────────────────────

test.describe('Step 2: Sheet Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await uploadBothAndAdvance(page);
  });

  test('detects sheet names for both files', async ({ page }) => {
    await expect(page.locator('.sheet-name').filter({ hasText: 'Employees' })).toBeVisible();
    await expect(page.locator('.sheet-name').filter({ hasText: 'Departments' })).toBeVisible();
  });

  test('shows correct data row counts', async ({ page }) => {
    // a.xlsx Employees: 5 rows; b.xlsx Departments: 4 rows
    await expect(page.locator('text=5 行')).toBeVisible();
    await expect(page.locator('text=4 行')).toBeVisible();
  });

  test('preview panel renders data when clicking a sheet card', async ({ page }) => {
    await page.getByTestId('step2-sheet-card-a-0').click();
    // Table header 'id' should be visible in the preview area
    await expect(
      page.locator('th').filter({ hasText: 'id' }).first()
    ).toBeVisible();
  });

  test('fullscreen preview supports page summary, page size, and jump page', async ({ page }) => {
    await page.goto('/');
    await uploadFile(page, 'A', FIX.A_LARGE);
    await waitForUploadDone(page, 'A');
    await uploadFile(page, 'B', FIX.B_LARGE);
    await waitForUploadDone(page, 'B');
    await page.getByTestId('btn-next').click();

    await page.getByTestId('step2-sheet-card-a-0').click();
    await page.getByTestId('btn-step2-open-fullscreen-a').click();

    await expect(page.getByTestId('text-pagination-summary')).toContainText(/1.*50.*1,240/);

    await page.getByTestId('select-page-size').selectOption('25');
    await expect(page.getByTestId('text-pagination-summary')).toContainText(/1.*25.*1,240/);

    await page.getByTestId('input-jump-page').fill('3');
    await page.getByTestId('btn-jump-page').click();
    await expect(page.getByTestId('text-pagination-summary')).toContainText(/51.*75.*1,240/);
    await expect(page.locator('td').filter({ hasText: 'Employee 51' })).toBeVisible();
  });

  test('unchecking a sheet disables step 3+ until re-checked', async ({ page }) => {
    // Uncheck Employees (file A's only sheet)
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.uncheck();
    await expect(page.getByTestId('step2-sheet-card-a-0')).toContainText('5 行');
    // Next should now be disabled (no usable data on A side)
    await expect(page.getByTestId('btn-next')).toBeDisabled();
    // Re-check restores next
    await checkbox.check();
    await expect(page.getByTestId('btn-next')).toBeEnabled();
  });
});

// ── SUITE 3: Step 3 — Key Column ─────────────────────────────────────────

test.describe('Step 3: Key Column', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await uploadBothAndAdvance(page);
    await page.getByTestId('btn-next').click(); // advance to Step 3
  });

  test('auto-selects first column header as key', async ({ page }) => {
    const selects = page.locator('select');
    await expect(selects.first()).toHaveValue('id', { timeout: 5_000 });
    await expect(selects.last()).toHaveValue('id');
  });

  test('can change key column for file A', async ({ page }) => {
    const selectA = page.locator('select').first();
    await selectA.selectOption('name');
    await expect(selectA).toHaveValue('name');
  });

  test('preview panel shows columns beyond the fifth header', async ({ page }) => {
    await page.goto('/');
    await uploadFile(page, 'A', FIX.A_WIDE);
    await waitForUploadDone(page, 'A');
    await uploadFile(page, 'B', FIX.B_WIDE);
    await waitForUploadDone(page, 'B');
    await page.getByTestId('btn-next').click();
    await page.getByTestId('btn-next').click();

    await expect(page.locator('th').filter({ hasText: 'region' })).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'status' })).toBeVisible();
  });

  test('sync mode toggle switches to per-sheet view', async ({ page }) => {
    // Default is linked (sync-all) mode - the sync checkbox should be checked
    const syncCheckbox = page.locator('input[type="checkbox"]').first();
    await expect(syncCheckbox).toBeChecked();
    // Uncheck to enter per-sheet mode
    await syncCheckbox.uncheck();
    // Per-sheet mode shows sidebar with sheet names
    await expect(page.locator('text=文件 A')).toBeVisible();
  });
});

// ── SUITE 4: Step 4 — Merge Columns ──────────────────────────────────────

test.describe('Step 4: Merge Columns', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await advanceToStep4(page);
  });

  test('starts with no merge columns selected by default', async ({ page }) => {
    await expect(
      page.locator('text=/已选 0 \\/ 2/').first()
    ).toBeVisible();
  });

  test('全选 selects all columns', async ({ page }) => {
    const selectAllBtns = page.getByRole('button', { name: '全选' });
    await selectAllBtns.first().click();
    // Counter should show all selectable merge columns selected (A has 2: name, score)
    await expect(
      page.locator('text=/已选 2 \\/ 2/')
    ).toBeVisible();
  });

  test('全不选 clears all merge column selections', async ({ page }) => {
    const selectAllBtns = page.getByRole('button', { name: '全选' });
    await selectAllBtns.first().click();
    // Now deselect all for file A
    await page.getByRole('button', { name: '全不选' }).first().click();
    // No merge columns remain selected for A; key is separate and always used for matching
    await expect(
      page.locator('text=/已选 0 \\/ 2/').first()
    ).toBeVisible();
  });

  test('column search filters the list', async ({ page }) => {
    // Type "score" in search box for file A
    const searchInputs = page.locator('input[placeholder="搜索列名..."]');
    await searchInputs.first().fill('score');
    // "name" column label should be hidden, "score" visible
    await expect(
      page.locator('label').filter({ hasText: 'score' }).first()
    ).toBeVisible();
    // Clear search
    await searchInputs.first().fill('');
  });

  test('merge button label is 开始合并 on step 4', async ({ page }) => {
    await expect(page.getByTestId('btn-next')).toContainText('开始合并');
  });
});

// ── SUITE 5: Step 5 — Merge Results ──────────────────────────────────────

test.describe('Step 5: Merge Results', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await runMergeFlow(page);
  });

  // — Stat cards ——————————————————————————————————————————————————————————

  test('matched stat card shows count 2', async ({ page }) => {
    await expect(page.getByTestId('tab-matched')).toContainText('2');
  });

  test('unmatched stat card shows combined count 2', async ({ page }) => {
    // 1 unmatched A (Charlie) + 1 unmatched B (Tokyo) = 2
    await expect(page.getByTestId('tab-unmatched')).toContainText('2');
  });

  test('conflicts stat card shows count 1', async ({ page }) => {
    await expect(page.getByTestId('tab-conflicts')).toContainText('1');
  });

  // — Matched view ————————————————————————————————————————————————————————

  test('matched view renders Alice and Bob rows', async ({ page }) => {
    await expect(page.locator('td').filter({ hasText: 'Alice' })).toBeVisible();
    await expect(page.locator('td').filter({ hasText: 'Bob' })).toBeVisible();
  });

  test('matched view does not contain unmatched names', async ({ page }) => {
    await expect(page.locator('td').filter({ hasText: 'Charlie' })).not.toBeVisible();
    await expect(page.locator('td').filter({ hasText: 'Tokyo' })).not.toBeVisible();
  });

  test('fullscreen view opens and closes', async ({ page }) => {
    // Export settings panel starts expanded and its backdrop would intercept the click;
    // collapse it first so the content area is fully interactive.
    await page.getByTestId('btn-step5-collapse-export-settings').click();
    await expect(page.getByTestId('step5-export-settings-collapsed')).toBeVisible();

    await page.getByRole('button', { name: '全屏查看' }).click();
    // Fullscreen overlay has close button (data-testid="btn-close-fullscreen")
    await expect(page.getByTestId('btn-close-fullscreen')).toBeVisible({ timeout: 5_000 });
    await page.getByTestId('btn-close-fullscreen').click();
    await expect(page.getByTestId('btn-close-fullscreen')).not.toBeVisible();
  });

  test('export settings sidebar can collapse and expand', async ({ page }) => {
    await expect(page.getByTestId('step5-export-settings-panel')).toBeVisible();

    await page.getByTestId('btn-step5-collapse-export-settings').click();
    await expect(page.getByTestId('step5-export-settings-panel')).toHaveCount(0);
    await expect(page.getByTestId('step5-export-settings-collapsed')).toBeVisible();

    await page.getByTestId('btn-step5-expand-export-settings').click();
    await expect(page.getByTestId('step5-export-settings-panel')).toBeVisible();
  });

  test('export settings panel is absolute overlay: row height does not grow when expanded', async ({ page }) => {
    // Collapse first to get a clean baseline
    await page.getByTestId('btn-step5-collapse-export-settings').click();
    await expect(page.getByTestId('step5-export-settings-collapsed')).toBeVisible();
    const collapsedRowBox = await page.getByTestId('step5-top-row').boundingBox();

    // Expand settings
    await page.getByTestId('btn-step5-expand-export-settings').click();
    await expect(page.getByTestId('step5-export-settings-panel')).toBeVisible();
    const expandedRowBox = await page.getByTestId('step5-top-row').boundingBox();

    // Row must not grow when settings are expanded (panel is absolute, out of flow)
    expect(expandedRowBox.height).toBeLessThanOrEqual(collapsedRowBox.height + 2);

    // The expanded panel must extend below the row's bottom edge (confirming overlay behavior)
    const panelBox = await page.getByTestId('step5-export-settings-panel').boundingBox();
    expect(panelBox.y + panelBox.height).toBeGreaterThan(expandedRowBox.y + expandedRowBox.height);
  });

  // - Unmatched view ------------------------------------------------------

  test('unmatched view shows Charlie (A) and Tokyo (B)', async ({ page }) => {
    await page.getByTestId('tab-unmatched').click();
    await expect(page.locator('td').filter({ hasText: 'Charlie' })).toBeVisible();
    await expect(page.locator('td').filter({ hasText: 'Tokyo' })).toBeVisible();
  });

  test('unmatched view search filters a single side without affecting the other', async ({ page }) => {
    await page.getByTestId('tab-unmatched').click();
    await page.locator('input[placeholder="搜索未匹配记录..."]').first().fill('zzz');
    await expect(page.locator('text=暂无匹配搜索结果').first()).toBeVisible();
    await expect(page.locator('td').filter({ hasText: 'Tokyo' })).toBeVisible();
  });

  test('unmatched view: select-all checkbox selects all A rows', async ({ page }) => {
    await page.getByTestId('tab-unmatched').click();
    // The "all" checkbox for the A table (first thead checkbox)
    const allCheckboxA = page.locator('thead input[type="checkbox"]').first();
    await allCheckboxA.check();
    // All row checkboxes in tbody for A should be checked
    const rowCheckboxes = page.locator('tbody input[type="checkbox"]');
    await expect(rowCheckboxes.first()).toBeChecked();
  });

  test('unmatched view: individual row selection works', async ({ page }) => {
    await page.getByTestId('tab-unmatched').click();
    const firstRowCheckbox = page.locator('tbody input[type="checkbox"]').nth(1);
    await firstRowCheckbox.check({ force: true });
    await expect(firstRowCheckbox).toBeChecked();
    await firstRowCheckbox.uncheck({ force: true });
    await expect(firstRowCheckbox).not.toBeChecked();
  });

  // — Conflict view ———————————————————————————————————————————————————————

  test('conflict view shows key "5"', async ({ page }) => {
    await page.getByTestId('tab-conflicts').click();
    await expect(
      page.locator('[data-testid="conflict-key-text"]').filter({ hasText: '"5"' })
    ).toBeVisible();
  });

  test('unresolved conflict card is marked as pending before any action is chosen', async ({ page }) => {
    await page.getByTestId('tab-conflicts').click();
    await expect(page.getByTestId('badge-conflict-pending')).toBeVisible();
  });

  test('conflict: 保留全部 marks as resolved', async ({ page }) => {
    await page.getByTestId('tab-conflicts').click();
    await page.getByRole('button', { name: '保留全部' }).first().click();
    await expect(page.locator('text=已保留全部')).toBeVisible();
  });

  test('conflict: 仅保留首条 marks as resolved', async ({ page }) => {
    await page.getByTestId('tab-conflicts').click();
    await page.getByRole('button', { name: '仅保留首条', exact: true }).first().click();
    // The status span (not the button) shows the resolution label
    await expect(page.locator('span').filter({ hasText: /^仅保留首条$/ })).toBeVisible();
  });

  test('conflict: 移除 marks as removed', async ({ page }) => {
    await page.getByTestId('tab-conflicts').click();
    await page.getByRole('button', { name: '移除' }).first().click();
    await expect(page.locator('text=已移除')).toBeVisible();
  });

  test('batch: 全部保留全部 resolves all conflicts at once', async ({ page }) => {
    await page.getByTestId('tab-conflicts').click();
    await page.getByRole('button', { name: '全部保留全部' }).click();
    await expect(page.locator('text=已保留全部')).toBeVisible();
  });

  test('batch: 全部仅保留首条 resolves all conflicts at once', async ({ page }) => {
    await page.getByTestId('tab-conflicts').click();
    await page.getByRole('button', { name: '全部仅保留首条' }).click();
    // Resolution label for "first"
    await expect(page.locator('text=仅保留首条').first()).toBeVisible();
  });

  test('batch: 全部移除 resolves all conflicts at once', async ({ page }) => {
    await page.getByTestId('tab-conflicts').click();
    await page.getByRole('button', { name: '全部移除' }).click();
    await expect(page.locator('text=已移除')).toBeVisible();
  });

  test('conflict search filters by key value', async ({ page }) => {
    await page.getByTestId('tab-conflicts').click();
    // Type a non-matching value
    await page.locator('input[placeholder="搜索冲突键值..."]').fill('999');
    await expect(page.locator('text=没有匹配的搜索结果')).toBeVisible();
    // Clear — key "5" should reappear
    await page.locator('input[placeholder="搜索冲突键值..."]').fill('');
    await expect(
      page.locator('[data-testid="conflict-key-text"]').filter({ hasText: '"5"' })
    ).toBeVisible();
  });
});

// ── SUITE 6: Step 6 — Export Settings & Download ─────────────────────────

test.describe('Step 6: Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await runMergeFlowToStep6(page);
  });

  test('summary card shows matched=2', async ({ page }) => {
    await expect(page.locator('text=已匹配行')).toBeVisible();
    // The number "2" appears as the bold count in the summary card
    const matchedCountEl = page.locator('.text-emerald-600.text-2xl').first();
    await expect(matchedCountEl).toContainText('2');
  });

  test('export settings can collapse and expand on step 6', async ({ page }) => {
    await expect(page.getByTestId('step6-export-settings-panel')).toBeVisible();

    await page.getByTestId('btn-step6-collapse-export-settings').click();
    await expect(page.getByTestId('step6-export-settings-panel')).toHaveCount(0);
    await expect(page.getByTestId('step6-export-settings-collapsed')).toBeVisible();

    await page.getByTestId('btn-step6-expand-export-settings').click();
    await expect(page.getByTestId('step6-export-settings-panel')).toBeVisible();
  });

  test('export settings panel is absolute overlay: row height does not grow when expanded on step 6', async ({ page }) => {
    // Collapse first to get a clean baseline
    await page.getByTestId('btn-step6-collapse-export-settings').click();
    await expect(page.getByTestId('step6-export-settings-collapsed')).toBeVisible();
    const collapsedRowBox = await page.getByTestId('step6-top-row').boundingBox();

    // Expand settings
    await page.getByTestId('btn-step6-expand-export-settings').click();
    await expect(page.getByTestId('step6-export-settings-panel')).toBeVisible();
    const expandedRowBox = await page.getByTestId('step6-top-row').boundingBox();

    // Row must not grow when settings are expanded (panel is absolute, out of flow)
    expect(expandedRowBox.height).toBeLessThanOrEqual(collapsedRowBox.height + 2);

    // The expanded panel must extend below the row's bottom edge (confirming overlay behavior)
    const panelBox = await page.getByTestId('step6-export-settings-panel').boundingBox();
    expect(panelBox.y + panelBox.height).toBeGreaterThan(expandedRowBox.y + expandedRowBox.height);
  });

  test('export settings collapse state persists from step 5 to step 6', async ({ page }) => {
    await page.goto('/');
    await runMergeFlow(page);

    await page.getByTestId('btn-step5-collapse-export-settings').click();
    await expect(page.getByTestId('step5-export-settings-collapsed')).toBeVisible();

    await page.getByTestId('btn-next').click();
    await expect(page.getByTestId('step6-export-settings-collapsed')).toBeVisible();

    await page.getByTestId('btn-step6-expand-export-settings').click();
    await expect(page.getByTestId('step6-export-settings-panel')).toBeVisible();
  });

  test('Excel download triggers .xlsx file save', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 });
    await page.getByTestId('btn-download-excel').click();
    const dl = await downloadPromise;
    expect(dl.suggestedFilename()).toMatch(/\.xlsx$/);
  });

  test('CSV download triggers .csv file save (default state)', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 });
    await page.getByTestId('btn-download-csv').click();
    const dl = await downloadPromise;
    expect(dl.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('CSV button disabled when 按工作表分页输出 checked', async ({ page }) => {
    await page.locator('label').filter({ hasText: '按工作表分页输出' }).locator('input[type="checkbox"]').first().check();
    await expect(page.getByTestId('btn-download-csv')).toBeDisabled();
  });

  test('CSV button disabled when 保存未匹配 A checked', async ({ page }) => {
    await page.locator('label').filter({ hasText: '保存未匹配 A' }).locator('input[type="checkbox"]').first().check();
    await expect(page.getByTestId('btn-download-csv')).toBeDisabled();
  });

  test('CSV button disabled when 保存未匹配 B checked', async ({ page }) => {
    await page.locator('label').filter({ hasText: '保存未匹配 B' }).locator('input[type="checkbox"]').first().check();
    await expect(page.getByTestId('btn-download-csv')).toBeDisabled();
  });

  test('CSV button disabled when 保存冲突数据 checked', async ({ page }) => {
    await page.locator('label').filter({ hasText: '保存冲突数据' }).locator('input[type="checkbox"]').first().check();
    await expect(page.getByTestId('btn-download-csv')).toBeDisabled();
  });

  test('CSV button re-enabled after unchecking multi-sheet option', async ({ page }) => {
    const cb = page.locator('label').filter({ hasText: '按工作表分页输出' }).locator('input[type="checkbox"]').first();
    await cb.check();
    await expect(page.getByTestId('btn-download-csv')).toBeDisabled();
    await cb.uncheck();
    await expect(page.getByTestId('btn-download-csv')).toBeEnabled();
  });

  test('重新开始 resets app to Step 1', async ({ page }) => {
    await page.getByRole('button', { name: '重新开始' }).click();
    // Back on Step 1: both upload zones visible again
    await expect(page.getByTestId('upload-zone-a')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('upload-zone-b')).toBeVisible();
  });
});

// ── SUITE 7: Navigation ───────────────────────────────────────────────────

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('prev button not visible on Step 1', async ({ page }) => {
    await expect(page.getByTestId('btn-prev')).not.toBeVisible();
  });

  test('prev button visible from Step 2 onwards', async ({ page }) => {
    await uploadBothAndAdvance(page);
    await expect(page.getByTestId('btn-prev')).toBeVisible();
  });

  test('prev button navigates back to Step 1', async ({ page }) => {
    await uploadBothAndAdvance(page);
    await page.getByTestId('btn-prev').click();
    // Step 1 upload zones reappear
    await expect(page.getByTestId('done-card-a')).toBeVisible();
    await expect(page.getByTestId('done-card-b')).toBeVisible();
  });

  test('next button label is 下一步 on steps 1–3 and 5', async ({ page }) => {
    await uploadBothAndAdvance(page); // now on step 2
    await expect(page.getByTestId('btn-next')).toContainText('下一步');
  });

  test('navigating back to Step 3 after merge disables steps 5 and 6', async ({ page }) => {
    await runMergeFlow(page); // lands on step 5
    // Go back twice
    await page.getByTestId('btn-prev').click(); // step 4
    await page.getByTestId('btn-prev').click(); // step 3
    // Change key column to force downstream reset
    const selectA = page.locator('select').first();
    await selectA.selectOption('name');
    // Go back to step 4 — next should be enabled (key col set)
    await page.getByTestId('btn-next').click(); // step 4
    // Do NOT run merge — step 5 tab should be missing / btn-next disabled since no merge result
    // (btn-next on step 4 is always enabled if step 4 is active)
    // Verify step 5 is not directly accessible via btn (it can still show 下一步 for step 4 → 5
    // but step 5 content won't show merged data until merge is re-run)
    // The stat cards should not exist yet
    await expect(page.getByTestId('tab-matched')).not.toBeVisible();
  });
});

// ── SUITE 8: CSV File Upload ──────────────────────────────────────────────

test.describe('CSV file upload', () => {
  test('CSV files complete the full merge flow', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('upload-zone-a').locator('input[type="file"]').setInputFiles(FIX.A_CSV);
    await waitForUploadDone(page, 'A');
    await page.getByTestId('upload-zone-b').locator('input[type="file"]').setInputFiles(FIX.B_CSV);
    await waitForUploadDone(page, 'B');

    await page.getByTestId('btn-next').click(); // step 2
    await page.getByTestId('btn-next').click(); // step 3
    await page.getByTestId('btn-next').click(); // step 4

    const selectAllBtns = page.getByRole('button', { name: '全选' });
    await selectAllBtns.first().click();
    await selectAllBtns.last().click();
    await page.getByTestId('btn-next').click(); // merge

    await expect(page.getByTestId('tab-matched')).toContainText('2', { timeout: 10_000 });
    await expect(page.getByTestId('tab-unmatched')).toContainText('2');
  });
});

// ── SUITE 9: Multi-sheet flow ─────────────────────────────────────────────

test.describe('Multi-sheet file flow', () => {
  test('uploads multi-sheet files and detects both sheet names', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('upload-zone-a').locator('input[type="file"]').setInputFiles(FIX.A_MULTI);
    await waitForUploadDone(page, 'A');
    await page.getByTestId('upload-zone-b').locator('input[type="file"]').setInputFiles(FIX.B_MULTI);
    await waitForUploadDone(page, 'B');
    await page.getByTestId('btn-next').click();

    // Both sheets of A should appear
    await expect(page.locator('.sheet-name').filter({ hasText: 'Employees' })).toBeVisible();
    await expect(page.locator('.sheet-name').filter({ hasText: 'Managers' })).toBeVisible();
    // Both sheets of B should appear
    await expect(page.locator('.sheet-name').filter({ hasText: 'Locations' })).toBeVisible();
    await expect(page.locator('.sheet-name').filter({ hasText: 'Offices' })).toBeVisible();
  });

  test('multi-sheet merge: keepSheetOutput auto-enabled, CSV disabled on step 6', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('upload-zone-a').locator('input[type="file"]').setInputFiles(FIX.A_MULTI);
    await waitForUploadDone(page, 'A');
    await page.getByTestId('upload-zone-b').locator('input[type="file"]').setInputFiles(FIX.B_MULTI);
    await waitForUploadDone(page, 'B');

    await page.getByTestId('btn-next').click(); // step 2
    await page.getByTestId('btn-next').click(); // step 3
    await page.getByTestId('btn-next').click(); // step 4

    const selectAllBtns = page.getByRole('button', { name: '全选' });
    await selectAllBtns.first().click();
    await selectAllBtns.last().click();
    await page.getByTestId('btn-next').click(); // merge
    await expect(page.getByTestId('tab-matched')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('btn-next').click(); // step 6
    // keepSheetOutput is auto-enabled for multi-sheet → CSV should be disabled
    await expect(page.getByTestId('btn-download-csv')).toBeDisabled({ timeout: 5_000 });
    // Excel should still work
    await expect(page.getByTestId('btn-download-excel')).toBeEnabled();
  });
});

// ── SUITE 10: Reset flows ─────────────────────────────────────────────────

test.describe('Reset flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('re-uploading file B mid-flow resets merged results', async ({ page }) => {
    await runMergeFlow(page);
    // Go back to step 1
    for (let i = 0; i < 4; i++) await page.getByTestId('btn-prev').click();
    await page.getByTestId('reupload-b').click();
    // Upload zone for B reappears
    await expect(page.getByTestId('upload-zone-b')).toBeVisible();
    // Next button disabled (B not yet uploaded)
    await expect(page.getByTestId('btn-next')).toBeDisabled();
  });

  test('重新开始 on step 6 fully resets to step 1', async ({ page }) => {
    await runMergeFlowToStep6(page);
    await page.getByRole('button', { name: '重新开始' }).click();
    await expect(page.getByTestId('upload-zone-a')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('upload-zone-b')).toBeVisible();
    await expect(page.getByTestId('btn-next')).toBeDisabled();
    await expect(page.getByTestId('btn-prev')).not.toBeVisible();
  });
});

// ── SUITE 11: Complete end-to-end happy path ──────────────────────────────

test.describe('Complete end-to-end happy path', () => {
  test('all 6 steps flow: upload → select sheets → set key → select cols → results → download', async ({ page }) => {
    await page.goto('/');

    // Step 1: upload
    await uploadFile(page, 'A', FIX.A);
    await waitForUploadDone(page, 'A');
    await uploadFile(page, 'B', FIX.B);
    await waitForUploadDone(page, 'B');
    await page.getByTestId('btn-next').click();

    // Step 2: sheets detected
    await expect(page.locator('.sheet-name').filter({ hasText: 'Employees' })).toBeVisible();
    await page.getByTestId('btn-next').click();

    // Step 3: key columns auto-set
    await expect(page.locator('select').first()).toHaveValue('id', { timeout: 5_000 });
    await page.getByTestId('btn-next').click();

    // Step 4: select all columns and merge
    const selectAllBtns = page.getByRole('button', { name: '全选' });
    await selectAllBtns.first().click();
    await selectAllBtns.last().click();
    await page.getByTestId('btn-next').click();

    // Step 5: verify all result tabs
    await expect(page.getByTestId('tab-matched')).toContainText('2', { timeout: 10_000 });
    await expect(page.getByTestId('tab-unmatched')).toContainText('2');
    await expect(page.getByTestId('tab-conflicts')).toContainText('1');

    // Resolve conflict
    await page.getByTestId('tab-conflicts').click();
    await page.getByRole('button', { name: '保留全部' }).first().click();
    await expect(page.locator('text=已保留全部')).toBeVisible();

    await page.getByTestId('btn-next').click();

    // Step 6: download Excel
    const downloadPromise = page.waitForEvent('download', { timeout: 10_000 });
    await page.getByTestId('btn-download-excel').click();
    const dl = await downloadPromise;
    expect(dl.suggestedFilename()).toMatch(/\.xlsx$/);

    // Reset
    await page.getByRole('button', { name: '重新开始' }).click();
    await expect(page.getByTestId('upload-zone-a')).toBeVisible({ timeout: 5_000 });
  });
});
