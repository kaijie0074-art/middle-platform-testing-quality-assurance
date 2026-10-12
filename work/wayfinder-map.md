# 中台测试与质量保障：Wayfinder Map

> 状态：已完成，远程 main 已创建并推送
> 建立日期：2026-10-12
> 项目中文名：中台测试与质量保障
> 仓库目标：`middle-platform-testing-quality-assurance`

## Destination

交付一套独立、可执行的质量保障样例：对检索任务中台执行契约测试、状态机测试、浏览器 E2E、异常注入和质量门禁，并输出可审计回归证据。

## Notes

- 测试层级：schema/contract → domain transition → API integration → browser E2E → quality gate。
- 参考基线：Playwright trace/web-first assertions、Pact consumer-driven contract、Testcontainers 隔离依赖、k6 thresholds。
- 质量门禁必须检查行为、边界、错误优先级和状态不变性，不能只检查“没有抛异常”。

## Decisions so far

- 质量项目独立携带 target fixture，不依赖第二个仓库才能运行。
- 以 Node 内置 assert + Playwright 实现最小可运行测试，避免把测试框架安装成功误当质量保障。
- 将失败场景作为可重复 fault modes，并为每种失败给出缺陷报告和修复引用。

## Acceptance gates

- [x] `npm test` 运行契约、状态机、API、E2E 和质量门禁。
- [x] 六个失败模式可重复注入，并有 issue report、repro、FIX、regression。
- [x] 质量门禁能在分类、状态不变性、响应契约和 UI 反馈错误时识别缺陷。
- [x] Public GitHub 仓库无真实凭据和用户数据，文档解释测试边界。

## Evidence

- `npm test`：PASS，11 个 QA checks；6 个 seeded defects detected。
- `npm run check`：PASS，6 个问题报告、27 个文件扫描。
- `npm run reproduce`：PASS，正常 contract、illegal transition 和 missing-job error 探针无失败。
- Chromium 156.0.8078.4 完成正常页面流程；`ui-no-error` 负向夹具被检测。
- Remote：`https://github.com/kaijie0074-art/middle-platform-testing-quality-assurance`

## Not yet specified

- 真实数据库/队列依赖：本轮用 fixture 替代，后续可接 Testcontainers。
- 负载基准：本轮只保留 k6 threshold 设计引用，不运行生产规模压测。

## Out of scope

- 生产环境发布门禁、真实性能 SLA、渗透测试和合规认证。
- 代替业务验收或声称所有浏览器/设备已覆盖。
