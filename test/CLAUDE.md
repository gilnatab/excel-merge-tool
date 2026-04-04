[根目录](../CLAUDE.md) > **test**

# test — 测试策略

## 三层测试体系

| 层级 | 命令 | 框架 | 覆盖范围 |
|------|------|------|----------|
| 单元测试 | `npm run test:unit` | Node.js 内置 `node:test` | `src/utils/excel.js` 所有导出纯函数 |
| 集成测试 | `npm run test:integration` | Node.js 内置 `node:test` | 使用 `.xlsx`/`.csv` fixture 文件的合并流程 |
| E2E 测试 | `npm run test:e2e` | Playwright (Chromium) | 完整向导流程，需要 `npm run dev` 在 5173 端口 |
| 全部 | `npm run test:all` | — | 依次运行以上三层 |

## Fixture 文件

位于 `test/fixtures/`（`a.xlsx`、`b.xlsx`、`a.csv`、`b.csv`），由 `test/fixtures/create-fixtures.js` 生成：

```bash
npm run fixtures
```

## 文件说明

| 文件 | 职责 |
|------|------|
| `core.test.js` | 单元测试：`buildIndex`、`resolveColumnNames`、`mergeRow`、`buildUnmatchedRow`、`classifyMerge`、`sanitizeSheetName`、`buildFinalOutput` |
| `integration.test.js` | 集成测试：使用真实 xlsx/csv fixture 文件测试端到端解析与合并流程 |
| `e2e/app.spec.js` | E2E 测试：Playwright 驱动浏览器完整走完 5 步向导 |
