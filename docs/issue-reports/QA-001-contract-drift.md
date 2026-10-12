# [QA-001] RetrievalJob 响应契约漂移未被发现

- 状态：`Verified`
- 门禁：`contract`
- 故障夹具：`contract-missing-field`

## 现象

目标服务删掉 `state` 字段仍返回 201。页面或下游会在运行时才发现字段不存在。

## 预期 / 实际

- 预期：契约门禁报告 `missing state` 并阻止交付。
- 实际：只检查 HTTP 201 时，结构性缺失被放过。

## 模拟修复

- `FIX-QA-001`：检查必填字段、数组类型和合法 state。

## 回归

- `npm test`
- 负向探针：`contract-missing-field`
- 结果：证据中出现 `missing state`，门禁识别该缺陷。
