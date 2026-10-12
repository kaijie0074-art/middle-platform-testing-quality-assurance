# [QA-005] 用例共享 store 导致状态泄漏

- 状态：`Verified`
- 门禁：`isolation`
- 故障夹具：并行 target server

## 现象

如果测试复用全局 store，前一条用例创建的 job 会影响后一条的序号、详情或终态。

## 预期 / 实际

- 预期：每个 server/store/context 可独立销毁，测试顺序可交换。
- 实际：共享可变对象时，单测通过但套件顺序变化后失败。

## 模拟修复

- `FIX-QA-005`：每个 case 新建 target server/store；浏览器每个 case 新建 context/page。

## 回归

- `npm test`
- 断言：并行两个 target 的首个 job ID 不相同且状态互不影响。
