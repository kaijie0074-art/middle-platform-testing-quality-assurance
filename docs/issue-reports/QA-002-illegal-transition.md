# [QA-002] 非法状态迁移被 API 接受

- 状态：`Verified`
- 门禁：`state`
- 故障夹具：`invalid-transition-accepted`

## 现象

draft 任务直接 submit，故障目标返回 200 并变成 queued，绕过 validate。

## 预期 / 实际

- 预期：状态门禁对比 before/after，发现 200、state 改变和 audit 副作用。
- 实际：只断言请求完成时，非法路径无法被识别。

## 模拟修复

- `FIX-QA-002`：断言非法 action 的 HTTP status、state 和 audit 三个不变量。

## 回归

- `npm test`
- 负向探针：`invalid-transition-accepted`
- 结果：`QA-002-negative` 被标记 detected。
