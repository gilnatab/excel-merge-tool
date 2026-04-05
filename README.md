# Excel 合并工具

一个基于浏览器的 Excel 文件合并工具，通过 5 步向导完成两个 Excel 文件的关联合并。无需安装，支持离线单文件分发。

## 功能特点

- **文件上传** — 拖拽或点击上传，支持 `.xlsx` / `.xls` / `.csv`
- **多工作表** — 可选择单张或多张工作表合并，支持自定义表头起始行
- **关联列匹配** — 联动模式（所有工作表共用同一键列）或逐表模式（各表独立配置）
- **列选择** — 自由勾选需合并的列，支持搜索过滤，同样支持联动/逐表切换
- **结果处理** — 三个标签页：匹配数据、未匹配数据（可勾选纳入主输出）、冲突数据（N:M 重复，支持保留全部/保留首条/移除）
- **导出** — Excel (.xlsx) 多 sheet 输出，或 CSV（含 UTF-8 BOM 兼容中文）

## 快速开始

### 直接使用（离线单文件）

从 [Releases](../../releases) 下载 `index.html`，在浏览器中直接打开即可，无需网络或安装。

### 本地开发

```bash
npm install
npm run dev        # http://localhost:5173
```

### 构建

```bash
npm run build          # 多文件构建 → dist/
npm run build:single   # 单文件构建 → dist-single/index.html（所有资源内联）
```

## 自动发布

- 推送到默认分支（当前仓库是 `master`）后，GitHub Actions 会自动构建并部署最新站点到 GitHub Pages
- 推送形如 `v1.2.3` 的 tag 后，GitHub Actions 会自动创建 Release，并附带单文件版 `index.html`

## 测试

```bash
npm run test:unit         # 纯函数单元测试
npm run test:integration  # 集成测试（使用 xlsx/csv fixture 文件）
npm run test:build-single # 单文件构建回归测试（验证内联 CSS 已完整编译）
npm run test:e2e          # Playwright E2E（需先启动 dev server）
npm run test:all          # 依次运行全部测试
```

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Vue 3.5 (Composition API + `<script setup>`) |
| 样式 | Tailwind CSS v4 |
| Excel 读写 | SheetJS (xlsx 0.20.3) |
| 构建工具 | Vite 6 |
| 单文件打包 | vite-plugin-singlefile |
| 测试 | Node.js `node:test` + Playwright |

## License

MIT
