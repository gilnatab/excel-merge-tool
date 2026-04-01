# Excel 合并工具

## 架构
- 单 HTML 文件（`index.html`），无构建步骤
- 所有 HTML/CSS/JS 内联
- 外部依赖：SheetJS CDN（xlsx-0.20.3）
- 界面语言：中文

## 状态驱动的 5 步向导
1. 上传文件（A 和 B）
2. 选择工作表 + 起始行 + 可选全表合并
3. 选择关联列（键列）— **联动/独立模式切换**（联动模式所有工作表共用一个选择；独立模式各表单独配置）
4. 选择合并列（含搜索过滤）— 同样支持联动/独立模式切换
5. 结果处理：**3 个 Tab** — 匹配结果（1:1 连接）、未匹配数据（复选框选择是否纳入主输出）、重复键冲突（N:M 重复，支持保留全部/仅保留首条/移除）→ 下载为 **Excel (.xlsx) 或 CSV**

## 下载选项（第 5 步）
- **按工作表分页输出**：仅在勾选了多个工作表时显示；默认开启；按 `__sheet__` 字段将主输出分组到各 sheet
- **保存未匹配 A / 未匹配 B / 冲突数据 到独立工作表**：三个独立复选框；各自在 Excel 输出中追加额外 sheet（`未匹配_A`、`未匹配_B`、`冲突数据`）；`冲突数据` sheet 对 `_键值` 列按冲突组合并单元格（`!merges`）
- **CSV 下载**在任意分 sheet 选项启用时禁用（旁边显示原因文字）；由 `updateCsvState()` 统一控制

## 关键函数
| 函数 | 职责 |
|---|---|
| `parseSheetWithOffset(sheet, startRow)` | 按指定起始行（1-indexed）解析工作表 |
| `combineSheetData(which)` | 将所有勾选工作表的列取并集；为每行附加 `__sheet__` 来源标记 |
| `classifyMerge(...)` | 将数据分类为 matched / unmatchedA / unmatchedB / conflicts |
| `mergeRow(rowA, rowB, ...)` | 生成一条合并输出行；从 rowA 传递 `__sheet__` |
| `buildUnmatchedRow(row, ...)` | 生成未匹配数据的输出行；传递 `__sheet__` |
| `buildFinalOutput()` | 组装主输出：匹配行 + 已勾选的未匹配行 + 已解决的冲突行 |
| `resolveConflict(ci, action)` | 设置单个冲突组的处理方式（all/first/remove） |
| `resolveAllConflicts(action)` | 批量设置所有冲突组的处理方式 |
| `buildConflictsSheet(r)` | 返回带 `!merges` 的 SheetJS worksheet，用于 `冲突数据` sheet |
| `updateCsvState()` | 根据所有分 sheet 相关复选框状态禁用/启用 CSV 按钮并显示原因 |
| `sanitizeSheetName(name)` | 去除 Excel sheet 名非法字符；截断至 31 字符 |

## 编码规范
- HTML 内容使用 `escHtml()`，属性值使用 `escAttr()`（XSS 防护）
- 动态 DOM ID 使用数字索引（`data-ci` 属性）——禁止将原始键值用作 ID
- 内联 `onclick` 处理器只使用数字索引
- 键比较：`String(value).trim()`；键为空/缺失的行视为未匹配
- 解析时过滤全空白行
- 多表合并通过 `combineSheetData()` 对列取并集
- 内部追踪字段 `__sheet__` 在写入 Excel/CSV 前必须去除
- CSV 下载包含 UTF-8 BOM（中文兼容）
- 列名冲突时加前缀 `A_` / `B_`
