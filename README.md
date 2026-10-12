# 中台测试与质量保障

独立于中台实现项目的质量保障模拟：用契约检查、状态机不变量、API 集成检查、浏览器 E2E、故障注入和质量门禁，验证检索任务中台是否把可见行为、接口协议和状态一致性同时做好。

这是本地确定性 QA 夹具，不连接真实服务，不把“测试脚本跑完”当作质量结论；每个门禁都有可观察断言。

## 快速开始

```bash
npm install
npx playwright install chromium
npm test
npm run check
npm run reproduce
```

- `npm test`：运行正常路径门禁，并验证故障夹具能被检测器识别。
- `npm run check`：检查质量规则、报告、FIX 引用和敏感信息。
- `npm run reproduce`：运行一个可读的故障分类样例。

## 质量层

| 层 | 检查 | 失败证据 |
| --- | --- | --- |
| 契约 | 必填字段、类型、错误包络 | path/status/body |
| 状态机 | 合法迁移、非法迁移无副作用、终态保护 | before/after/audit |
| API | HTTP status、错误 code、故障模式 | request/response |
| 浏览器 | 用户可见状态、错误、按钮和 audit | locator/text |
| 门禁 | 失败项必须使进程非 0 | gate summary |

## 文档路径

- [`docs/quality-strategy.md`](docs/quality-strategy.md)：测试金字塔、门禁和隔离策略。
- [`docs/open-source-references.md`](docs/open-source-references.md)：Playwright、Pact、Testcontainers、k6 一手资料。
- [`docs/reproductions/README.md`](docs/reproductions/README.md)：故障注入与复现方式。
- [`docs/issue-reports/`](docs/issue-reports/)：质量问题报告。
- [`docs/repair-references.md`](docs/repair-references.md)：模拟修复引用。
- [`docs/regression-records/`](docs/regression-records/)：回归证据。
- [`work/wayfinder-map.md`](work/wayfinder-map.md)：任务模型和验收门。

## 许可证

本项目采用 MIT License。外部项目仅借鉴机制，不复制代码；各外部项目许可证以官方来源为准。
