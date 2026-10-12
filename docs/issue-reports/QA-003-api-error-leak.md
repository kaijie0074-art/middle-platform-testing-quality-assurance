# [QA-003] 500 响应泄露 stack 且错误门禁不拦截

- 状态：`Verified`
- 门禁：`api`
- 故障夹具：`api-500`

## 现象

详情接口返回 500，并把 stack 放进 JSON。只看 status 的测试会把它当成“正确失败”。

## 预期 / 实际

- 预期：错误检查确认稳定 code/message，并拒绝 stack 泄露。
- 实际：缺少错误体断言时，诊断信息和内部路径可能泄露。

## 模拟修复

- `FIX-QA-003`：检查 HTTP status、error.code/message，并扫描 error body 中的 stack。

## 回归

- `npm test`
- 负向探针：`api-500`
- 结果：`stack leaked in error response` 被识别。
