<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 实时 PRD 动态同步规范 (Real-Time PRD Dynamic Sync Protocol)

- **核心原则**：在任何产品研发、功能迭代或方案设计交互中，**必须实时根据与用户的讨论、竞品调研、架构决策、体验反馈及已落地的代码演进，同步更新产品的 PRD 文档**（如 `PRD-Dayprint-NextGen.md`）。
- **执行要求**：
  1. **零滞后同步**：绝不让 PRD 与代码实际实现发生脱节或信息滞后；代码与文档同频交付。
  2. **全面覆盖**：凡涉及产品定位、业务流程、架构设计变更、术语重构、新增功能组件、交互逻辑调整及竞品分析结论，必须在对话推进中立即增补/修订对应 PRD 章节。
  3. **演进溯源**：对废弃、更名或重大调整的设计决策明确标注变更原因与升级路径，保持产品演进历史的完整可溯源性。

