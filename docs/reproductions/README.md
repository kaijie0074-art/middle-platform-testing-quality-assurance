# 复现材料

## 正常质量套件

```bash
npm install
npx playwright install chromium
npm test
```

## 故障分类

```bash
npm run reproduce
```

它会启动本地 target fixture，依次运行正常契约、非法状态、API 错误和页面反馈探针，并输出 `evidence/latest-run.json`。

## 设计要求

- 负向场景不是“把测试改成失败后忽略”，而是断言检测器确实捕获预设缺陷。
- 同一检查必须能回答：输入是什么、观察到什么、为什么 pass/fail、对应 `QA-*` 哪一项。
- 不使用真实外部站点，不把网络波动混成产品缺陷。
