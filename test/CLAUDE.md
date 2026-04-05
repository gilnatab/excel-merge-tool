[根目录](../CLAUDE.md) > **test**

# test — 测试策略

## 三层测试体系

| 层级 | 命令 | 框架 | 覆盖范围 |
|------|------|------|----------|
| 单元测试 | `npm run test:unit` | Node.js 内置 `node:test` | `src/utils/excel.js` 所有导出纯函数 |
| 集成测试 | `npm run test:integration` | Node.js 内置 `node:test` | 使用 `.xlsx`/`.csv` fixture 文件的合并流程 |
| 构建回归测试 | `npm run test:build-single` | Node.js 内置 `node:test` + Vite CLI | `build:single` 输出完整性；确保单文件 HTML 内联的是已编译 CSS，而非原始 Tailwind 指令 |
| E2E 测试 | `npm run test:e2e` | Playwright (Chromium) | 完整 6 步向导流程，需要 `npm run dev` 在 5173 端口 |
| 全部 | `npm run test:all` | — | 依次运行以上三层 |

## Fixture 文件

位于 `test/fixtures/`，由 `test/fixtures/create-fixtures.js` 生成：

```bash
npm run fixtures
```

| 文件 | 说明 |
|------|------|
| `a.xlsx` / `b.xlsx` | 标准单 sheet 测试文件（Employees 5行 / Departments 4行） |
| `a.csv` / `b.csv` | CSV 格式等效文件 |
| `a_multi.xlsx` / `b_multi.xlsx` | 多 sheet 文件（A: Employees+Managers / B: Locations+Offices） |
| `a_multi_unlinked.xlsx` / `b_multi_unlinked.xlsx` | 多 sheet 文件，各 sheet 列头不同、无公共关联键，用于测试 unlinked 独立键配置模式 |
| `b_single_unlinked.xlsx` | 单 sheet 文件（DepartmentsByEmployee），与 `a_multi_unlinked` 配对，测试 file B 只有一个 sheet 时的键持久化 |
| `a_wide.xlsx` / `b_wide.xlsx` | 宽列文件，用于测试超过 5 列的列头展示 |
| `a_large.xlsx` / `b_large.xlsx` | 大数据量文件（1240 行），用于测试分页/跳页功能 |

## 文件说明

| 文件 | 职责 |
|------|------|
| `core.test.js` | 单元测试：`buildIndex`、`resolveColumnNames`、`mergeRow`、`buildUnmatchedRow`、`classifyMerge`、`sanitizeSheetName`、`buildFinalOutput` |
| `integration.test.js` | 集成测试：使用真实 xlsx/csv fixture 文件测试端到端解析与合并流程；含 multi-sheet unlinked 模式的 `combineSheetData` 验证 |
| `build-single.test.js` | 构建回归测试：执行 `vite.single.config.js` 构建，校验 `index.html` 中 CSS 已内联且 Tailwind 指令已完全编译 |
| `e2e/app.spec.js` | E2E 测试：Playwright 驱动浏览器完整走完 6 步向导，94 个测试用例覆盖 11 个测试套件 |

## E2E 测试套件索引

| 套件 | 内容 |
|------|------|
| Step 1: File Upload | 上传区显示、Next 禁用/启用、重新上传 |
| Step 2: Sheet Selection | Sheet 检测、行数、预览、分页（大文件）、取消勾选 |
| Step 3: Key Column | 自动选键、手动改键、宽列、联动切换；unlinked 模式键持久化、内联预览、下游合并验证 |
| Step 4: Merge Columns | 全选/全不选/搜索、合并按钮文案；unlinked 多 sheet 下全选/全不选/按 sheet 独立搜索/折叠 |
| Step 5: Merge Results | 统计卡、三视图、全屏、未匹配搜索/选择、冲突解决/批量/搜索 |
| Step 5: Export Settings | 折叠/展开、**浮层不撑高行高**（overlay 布局回归测试） |
| Step 6: Export | 摘要、折叠/展开、状态跨步骤持久化、**浮层不撑高行高**、Excel/CSV 下载、CSV 禁用规则、重置 |
| Navigation | 上一步/下一步、按钮文案、回退重置下游 |
| CSV file upload | CSV 文件完整流程 |
| Multi-sheet flow | 多 sheet 检测、keepSheetOutput 自动启用 |
| Reset flows | 中途重新上传、全局重置 |
| Complete E2E happy path | 6 步完整流程 + 下载验证 |

## 布局回归测试说明

`CollapsibleExportSettings` 展开时使用 `position:absolute` 浮层。两个套件各含一条回归测试：

1. 折叠面板，记录 `step5-top-row` / `step6-top-row` 的行高
2. 展开面板，断言行高未增大（`expandedHeight ≤ collapsedHeight + 2px`）
3. 断言面板底部超出行底边（`panelBottom > rowBottom`），确认为浮层而非内联元素
