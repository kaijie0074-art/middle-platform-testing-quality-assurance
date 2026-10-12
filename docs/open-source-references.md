# 开源项目引用与边界

## Playwright

- 官方仓库：[microsoft/playwright](https://github.com/microsoft/playwright)，Apache License 2.0。
- 一手资料：[Best Practices](https://playwright.dev/docs/best-practices) 建议测试用户可见行为、隔离 context、优先 locator 和 web-first assertions；[Network](https://playwright.dev/docs/network) 支持观测/模拟请求。
- 借鉴：浏览器门禁只断言用户可观察结果，并让每个用例隔离。
- 边界：本项目只使用本地目标站，不声称覆盖真实浏览器矩阵。

## Pact JS

- 官方仓库：[pact-foundation/pact-js](https://github.com/pact-foundation/pact-js)；GitHub API 对仓库 license 的标注为 `Other`，README 展示 MIT badge，实际集成前必须重新核对仓库 LICENSE。
- 一手资料：[Consumer tests](https://docs.pact.io/implementation_guides/javascript/docs/consumer) 描述 consumer-driven contract：消费者写 interaction，生成契约，provider 回放验证。
- 借鉴：把接口期望写成可执行的 request/response interaction。
- 边界：本项目没有引入 Pact，也不复制其代码；使用原生断言实现最小确定性夹具。

## Testcontainers Node

- 官方仓库：[testcontainers/testcontainers-node](https://github.com/testcontainers/testcontainers-node)，MIT License。
- 一手资料：[Node Testcontainers](https://node.testcontainers.org/) 描述 disposable、隔离的容器依赖。
- 借鉴：测试目标应隔离、可抛弃、可重复。
- 边界：本项目的目标服务是进程内 fixture，不要求 Docker；不会把“未使用容器”伪装成容器级隔离。

## k6

- 官方仓库：[grafana/k6](https://github.com/grafana/k6)，AGPL-3.0。
- 一手资料：[Thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/) 将指标条件变成 pass/fail，阈值失败使测试进程失败。
- 借鉴：质量门禁必须有机械通过/失败边界。
- 边界：本项目没有引入 k6，也不复制其 AGPL 代码；这里只借鉴门禁思想。

## 许可证纪律

开源项目只作为设计依据和一手链接。任何未来依赖升级或代码复制都必须重新完成许可证、供应链和安全审查。
