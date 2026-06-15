# Keep or Let Go / 留不留 项目交接文档

## 当前状态

这是一个基于 Next.js App Router 的中文单件衣服留 / 不留决策工具。

当前 MVP 已跑通：

- 首页 `/`
- 判断页 `/decision-helper`
- 结果页 `/result`
- API `/api/evaluate`
- 图片上传与预览
- 图片转 base64 data URL
- Kimi 视觉判断
- 结构化 JSON 返回
- 结果页展示图片、图片观察、维度评分、留/不留理由、搭配方案、最终建议

## 当前关键文件

```text
app/page.tsx
app/globals.css

app/decision-helper/page.tsx
app/decision-helper/page.module.css

app/result/page.tsx
app/result/page.module.css

app/api/evaluate/route.ts