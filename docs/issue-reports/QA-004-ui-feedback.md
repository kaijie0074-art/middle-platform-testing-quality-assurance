# [QA-004] 页面收到错误但没有用户可见反馈

- 状态：`Verified`
- 门禁：`browser`
- 故障夹具：`ui-no-error`

## 现象

页面对非法 submit 收到 409，但 catch 分支不更新 message，用户看到的仍是 ready。

## 预期 / 实际

- 预期：用户可见区域显示 `INVALID_TRANSITION` 或等价可定位信息。
- 实际：页面静默失败，用户无法知道下一步。

## 模拟修复

- `FIX-QA-004`：E2E 以 locator 断言错误文字，而不是只断言请求返回。

## 回归

- `npm test`
- 负向探针：`ui-no-error`
- 结果：消息仍为 ready 时门禁失败；本套件确认能识别。
