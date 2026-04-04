# DESIGN.md — 架构决策记录

本文记录项目中非显而易见的设计选择及其原因，供后续开发参考。

---

## 1. 状态管理：provide/inject 而非 Pinia

**决策**：全局状态集中在 `useAppState.js` 的单例 `reactive({})` 中，通过 `provide/inject` 注入子组件。

**原因**：
- 项目状态图简单且单向（5 个步骤串行推进），不存在跨路由共享或持久化需求
- Pinia/Vuex 引入了额外的 store 注册、action/mutation 分层，对这个规模的项目是过度设计
- 单例 composable 本身就是 Pinia store 的轻量替代，且对 Composition API 更自然

**代价**：无法使用 Vue Devtools 的 Pinia 时间旅行调试。可接受，因为状态变更路径是可预测的。

---

## 2. 双构建路径：dev 模式 + 单文件发布

**决策**：保留两条并行构建路径（`vite.config.js` 和 `vite.single.config.js`）。

**原因**：
- 工具的核心价值是"零安装离线使用"——单文件 HTML 是最低摩擦的分发方式（发邮件、放网盘均可）
- Vue SFC + Vite 开发体验（HMR、类型提示）优于在单 HTML 中内联所有代码
- `vite-plugin-singlefile` 在构建时将所有 JS/CSS 内联，两种需求互不干扰

**关键配置**：`vite.single.config.js` 中 `assetsInlineLimit: 100_000_000` 确保无任何资源以外链形式输出。

---

## 3. 纯函数层：utils/excel.js 与 composable 分离

**决策**：所有数据处理逻辑（解析、分类、合并、输出构建）放在 `src/utils/excel.js` 中作为无副作用的纯函数，composable 只负责调用和管理状态。

**原因**：
- 纯函数可在 Node.js 环境直接单元测试，无需 DOM 或 Vue 运行时
- 将业务逻辑与 Vue 响应式系统解耦，降低迁移成本
- `classifyMerge`、`buildFinalOutput` 等函数逻辑复杂，独立测试比 E2E 更快速、更精准

---

## 4. 冲突默认策略：保留首条（first）

**决策**：`buildFinalOutput` 对未显式设置处理方式的冲突键，默认采用 `'first'`（保留首条匹配）。

**原因**：
- 静默丢弃数据（如默认 `remove`）是更危险的失败模式，用户可能不知道数据丢失
- "保留全部"（Cartesian product）会导致行数爆炸，可能在大文件时压垮浏览器
- 冲突 Tab 徽标保持红色高亮，确保用户知道有未处理的冲突

**权衡**：默认 `first` 可能掩盖重复数据问题，靠 UI 上的冲突数量提示来缓解。

---

## 5. 键列保留策略

**决策**：当 `keyColA !== keyColB` 时，`resolveColumnNames` 将 `keyColB` 作为普通列保留在输出中（而不是丢弃或重命名为 `B_Key`）。

**原因**：
- 用户常常合并的两个文件中同一概念有不同列名（如 "ID" 和 "订单号"）
- 在结果中同时看到两个键列，便于用户验证连接是否正确
- 若与 A 侧列名冲突，已有前缀机制（`A_` / `B_`）自动处理

---

## 6. UI 框架：Tailwind v4 取代 NaiveUI

**决策**：移除 NaiveUI 组件库，改用 Tailwind CSS v4 + 原生 HTML 表单元素。

**原因**：
- NaiveUI 的 `<n-select>`、`<n-checkbox>` 等组件引入了大量运行时 JS，显著增加单文件构建体积
- 原生表单元素（`<select>`、`<input type="checkbox">`）在 Tailwind `accent-color` + `@layer base` 下视觉效果足够，且零运行时开销
- Tailwind v4 通过 `@tailwindcss/vite` 插件直接集成，无需额外配置文件

**代价**：需要自行实现 Tab 组件和数据表格，已封装在 `DataTable.vue` 中。
