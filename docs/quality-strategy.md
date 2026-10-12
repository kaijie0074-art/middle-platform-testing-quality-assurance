# 质量策略

## 测试目标

验证中台的用户可见行为、HTTP 契约、状态不变量和错误可诊断性，而不是验证实现细节或“断言没有抛异常”。

## 层级与门禁

1. **契约门禁**：`status`、`id`、`state`、`audit` 及错误包络存在且类型正确。
2. **状态门禁**：合法路径完整；非法 action 不改变 state/audit；终态拒绝新动作。
3. **API 门禁**：4xx/5xx 使用正确 HTTP status 和稳定 `error.code`；故障模式不会泄露堆栈。
4. **浏览器门禁**：从用户动作到页面反馈完整；每个用例新 context；只依赖本地目标。
5. **质量门禁**：任一必选检查失败时进程返回非 0，证据包含检查 ID、输入和实际值。

## 负向夹具

- `contract-missing-field`：响应删掉 `state`，契约检查必须失败。
- `contract-wrong-type`：响应把 `audit` 改成对象，类型检查必须失败。
- `invalid-transition-accepted`：非法 submit 返回 200 或改变状态，状态检查必须失败。
- `api-500`：详情接口 500，错误检查必须确认无堆栈泄露。
- `api-missing-code`：404 缺少 `error.code`，错误契约必须失败。
- `ui-no-error`：页面收到 409 但不显示反馈，E2E 检查必须失败。

## 隔离

每个 API 用例启动新 server/store；每个浏览器用例创建新 context；测试不依赖外部网络、时钟精度或随机数据。
