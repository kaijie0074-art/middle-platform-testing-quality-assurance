# 模拟修复引用

`FIX-QA-*` 是本项目内部引用，不是外部项目真实 commit。

| 修复 ID | 报告 | 目标 | 修复动作 | 门禁 |
| --- | --- | --- | --- | --- |
| FIX-QA-001 | QA-001 | 契约 | 必填字段和类型检查；响应漂移即失败 | `contract-gate` |
| FIX-QA-002 | QA-002 | 状态机 | 非法迁移必须返回 409 且不改变 state/audit | `state-gate` |
| FIX-QA-003 | QA-003 | API 错误 | 检查 HTTP status、稳定 code、无 stack | `api-gate` |
| FIX-QA-004 | QA-004 | UI 反馈 | 409/500 必须出现用户可见 error | `browser-gate` |
| FIX-QA-005 | QA-005 | 隔离 | 每个 case 新 server/store/context | `isolation-gate` |
| FIX-QA-006 | QA-006 | 质量门禁 | 必选检查失败返回非 0 并保存 evidence | `quality-gate` |

报告只有在“正常路径通过 + 负向夹具被正确识别”同时满足时标记 `Verified`。
