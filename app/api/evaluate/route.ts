import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RequestBody = {
  intent?: string;
  itemType?: string;
  priceFeeling?: string;
  concern?: string;
  feeling?: string;
  similarItems?: string;
  scenario?: string;
  note?: string;
  imageName?: string;
  imageDataUrl?: string;
};

type KimiResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
};

function getIntentGuide(intent?: string) {
  if (intent?.includes("怎么搭")) {
    return `
当前判断目的：这件应该怎么搭。
输出重点：直接回答“怎么搭更好看”，不要把主结论写成留不留、退不退、值得留下。
headline 应该像一个搭配方向或风格结论，例如“适合走轻法式约会感”“适合做通勤里的温柔亮点”。
finalNote 必须给出具体穿法建议，不要以“建议留下/建议放手”作为核心。
stylingPlans 是最重要的部分，必须具体到上衣/下装/鞋包/颜色/避雷。
keepReasons 应理解为“这件单品适合拿来搭配的优势”。
riskReasons 应理解为“搭配时容易出错的地方”。
decision.label 只表示搭配可行度，不表示留不留：
- 建议放手 = 不建议硬搭，单品本身限制很大
- 再观察 = 需要明显调整才好搭
- 有条件留下 = 有搭配空间，但需要控制场景和单品
- 值得留下 = 很好搭，搭配方向明确
`;
  }

  if (intent?.includes("适不适合")) {
    return `
当前判断目的：这件适不适合我。
输出重点：判断颜色、版型、比例、风格、气质和使用场景是否适合用户。
不要把主结论写成“今天穿合不合适”，也不要把主结论写成“留不留”。
headline 应该是适配判断，例如“版型适合，但风格需要场景支撑”。
finalNote 应围绕“适不适合你、什么条件下适合、怎么调整更适合”。
keepReasons 应理解为“适合用户的地方”。
riskReasons 应理解为“不适合或需要注意的地方”。
decision.label 只表示适配度：
- 建议放手 = 不太适合
- 再观察 = 需要再观察
- 有条件留下 = 有条件适合
- 值得留下 = 很适合你
`;
  }

  return `
当前判断目的：要不要留下 / 退掉。
输出重点：判断这件衣服是否值得继续占据衣橱位置，或是否应该退掉/放手。
需要重点考虑保留价值、闲置风险、重复度、价格感受、打理成本和使用场景。
headline 应该直接给出留不留倾向，例如“有亮点，但闲置风险偏高”。
finalNote 应给出明确保留/退掉/再观察建议。
keepReasons 表示值得留下的理由。
riskReasons 表示不留或退掉的风险理由。
decision.label 表示留不留倾向：
- 建议放手 = 更建议退掉/放手
- 再观察 = 暂时不做决定
- 有条件留下 = 满足特定条件才值得留
- 值得留下 = 明确值得保留
`;
}

function buildPrompt(body: RequestBody, compact = false) {
  const lengthRule = compact
  ? "每个字符串字段不超过 28 个中文字符。只写短句，不写完整长段落。"
  : "每个字符串字段不超过 45 个中文字符。不要写长段落。";

  return `
你是「留不留」中文衣橱决策助手。请根据用户上传的衣服图片和表单信息，完成一次“单件衣服判断”。

用户信息：
判断目的：${body.intent || "未填写"}
单品类型：${body.itemType || "未填写"}
纠结点：${body.concern || "未填写"}
第一感受：${body.feeling || "未填写"}
类似单品：${body.similarItems || "未填写"}
可能使用场景：${body.scenario || "未填写"}
价格感受：${body.priceFeeling || "未填写"}
补充说明：${body.note || "无"}

${getIntentGuide(body.intent)}

图片一致性检查要求：
1. 你必须先判断图片主体和用户选择的“单品类型”是否匹配。
2. 如果用户选择的是上衣、裤子、半裙、连衣裙、外套，但图片主体明显是另一种衣服，可以自动校正，继续判断，并在 imageCheck.warning 中说明。
3. 如果用户选择的是鞋子或包包，但图片中没有清楚看到对应单品，targetItemVisible 必须为 false，warning 必须提示用户重新上传能看清目标单品的图片，或修改单品类型。
4. 如果 targetItemVisible 为 false，仍然必须返回完整 JSON 结构，但其他判断字段可以简短说明“目标单品不可见，无法可靠判断”。
5. 如果图片主体清楚但用户选错类型，targetItemVisible 为 true，visibleMainItem 填图片主体，isTypeMatched 填 false。

通用判断要求：
1. 必须结合图片本身，不要只评价表单。
2. 重点看颜色、版型、比例、长度、材质、褶皱、穿着门槛。
3. 如果是上身图，可以评价肩线、腰线、视觉重心、显高显瘦。
4. 如果图片信息有限，要直接说明，但不要拒绝判断。
5. 不要为了安慰用户强行给高分或强行建议留下。
6. ${lengthRule}
7. 只输出合法 JSON，不要 markdown，不要解释，不要代码块。
8. score 只能是 1、2、3、4、5。
9. 不要所有评分都给 5。
10. 如果场景窄，实穿频率不应高于 3。
11. 如果用户担心不好搭，搭配难度不应高于 3，除非图片显示非常百搭。
12. 如果衣橱里很多类似单品，衣橱补充不应高。
13. 如果某些用户信息是“未填写”，不要抱怨信息不足；主要依据图片、判断目的和单品类型给出判断。
14. 价格感受只作为用户心理负担和性价比感知的参考，不要直接判断商品真实定价是否合理。
15. 如果价格感受是“有点贵”或“明显不值”，需要在闲置风险、保留价值或最终建议里体现。
16. 如果价格感受是“不考虑价格”或“不记得价格”，不要过度讨论价格。
17. 判断目的为“这件应该怎么搭”时，finalNote、headline、stylingPlans 都必须优先回答搭配，不要写成留不留建议。
18. 判断目的为“这件适不适合我”时，finalNote、headline 必须优先回答适配度，不要写成退不退建议。
19. ratings 最多返回 3 条，优先保留：版型比例、颜色适配、实穿/搭配相关。
20. keepReasons 最多返回 1 条。
21. riskReasons 最多返回 1 条。
22. stylingPlans 只返回 1 套最推荐方案。
23. replacementAdvice 的 suggestions 最多返回 2 条。
24. finalNote 不超过 45 个中文字符。

严格返回这个 JSON 结构，字段名不能改：

{
  "imageCheck": {
    "visibleMainItem": "图片中最清楚的主单品",
    "selectedItemType": "用户选择的单品类型",
    "isTypeMatched": true,
    "targetItemVisible": true,
    "warning": "如果类型不匹配或目标单品不可见，在这里用一句话说明；如果完全匹配，写空字符串"
  },
  "decision": {
    "label": "建议放手",
    "headline": "一句明确判断",
    "reason": "简短解释"
  },
  "uiSummary": {
    "retentionValue": "中",
    "idleRisk": "中",
    "stylingDifficulty": "中",
    "bestScenario": "最适合场景"
  },
  "visualAnalysis": {
    "color": "颜色观察",
    "silhouette": "版型轮廓观察",
    "proportion": "比例效果观察",
    "fabricAndDetails": "材质细节观察"
  },
  "ratings": [
    {
      "label": "版型比例",
      "score": 4,
      "note": "评分理由"
    },
    {
      "label": "颜色适配",
      "score": 4,
      "note": "评分理由"
    },
    {
      "label": "搭配难度",
      "score": 3,
      "note": "评分理由"
    },
    {
      "label": "实穿频率",
      "score": 2,
      "note": "评分理由"
    },
    {
      "label": "衣橱补充",
      "score": 4,
      "note": "评分理由"
    }
  ],
  "keepReasons": [
    {
      "title": "理由标题",
      "detail": "具体理由"
    },
    {
      "title": "理由标题",
      "detail": "具体理由"
    }
  ],
  "riskReasons": [
    {
      "title": "风险标题",
      "detail": "具体风险"
    },
    {
      "title": "风险标题",
      "detail": "具体风险"
    }
  ],
  "stylingPlans": [
    {
      "scenario": "场景一",
      "outfit": "具体穿搭",
      "shoesAndBag": "鞋包方向",
      "colorDirection": "颜色方向",
      "avoid": "避免什么",
      "whyItWorks": "为什么有效"
    },
    {
      "scenario": "场景二",
      "outfit": "具体穿搭",
      "shoesAndBag": "鞋包方向",
      "colorDirection": "颜色方向",
      "avoid": "避免什么",
      "whyItWorks": "为什么有效"
    }
  ],
  "replacementAdvice": {
    "title": "替代购买方向",
    "suggestions": [
      "具体建议一",
      "具体建议二",
      "具体建议三"
    ]
  },
  "finalNote": "最后简短建议"
}

imageCheck.visibleMainItem 应使用中文短词，例如：上衣、裤子、半裙、连衣裙、外套、鞋子、包包、看不清。
imageCheck.selectedItemType 必须等于用户选择的单品类型。
imageCheck.isTypeMatched 和 imageCheck.targetItemVisible 必须是布尔值 true 或 false。
label 必须从这四个里选一个：建议放手、再观察、有条件留下、值得留下。
retentionValue、idleRisk、stylingDifficulty 必须从这三个里选一个：低、中、高。
`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasValidResultShape(value: unknown) {
  if (!isObject(value)) return false;

  return (
    isObject(value.imageCheck) &&
    isObject(value.decision) &&
    isObject(value.uiSummary) &&
    isObject(value.visualAnalysis) &&
    Array.isArray(value.ratings) &&
    Array.isArray(value.keepReasons) &&
    Array.isArray(value.riskReasons) &&
    Array.isArray(value.stylingPlans) &&
    isObject(value.replacementAdvice) &&
    typeof value.finalNote === "string"
  );
}

function cleanKimiContent(content: string) {
  return content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractJsonObject(content: string) {
  const cleaned = cleanKimiContent(content);
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return cleaned;
  }

  return cleaned.slice(start, end + 1);
}

async function callKimi(body: RequestBody, compact = false) {
  const apiKey = process.env.MOONSHOT_API_KEY;
  const model = process.env.KIMI_MODEL || "moonshot-v1-8k";
  const baseUrl = (
    process.env.KIMI_BASE_URL || "https://api.moonshot.cn/v1"
  ).replace(/\/$/, "");

  if (!apiKey) {
    throw new Error("没有读取到 MOONSHOT_API_KEY。请检查 .env.local，并重启 npm run dev。");
  }

  const kimiResponse = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      thinking: { type: "disabled" },
      messages: [
        {
          role: "system",
          content:
            "你是「留不留」中文衣橱决策助手。你必须只输出一个合法 JSON 对象，不要输出 markdown，不要解释。必须先做图片一致性检查，并让输出重点匹配用户的判断目的。",
        },
        {
          role: "user",
          content: body.imageDataUrl
            ? [
                {
                  type: "text",
                  text: buildPrompt(body, compact),
                },
                {
                  type: "image_url",
                  image_url: {
                    url: body.imageDataUrl,
                  },
                },
              ]
            : buildPrompt(body, compact),
        },
      ],
      temperature: 0.6,
      max_tokens: compact ? 900 : 1600,
    }),
  });

  const rawResponse = await kimiResponse.text();

  let kimiData: KimiResponse;

  try {
    kimiData = JSON.parse(rawResponse) as KimiResponse;
  } catch {
    console.error("Kimi returned invalid raw response:", rawResponse);
    throw new Error("Kimi 返回了无法解析的响应。");
  }

  if (!kimiResponse.ok) {
    const errorMessage =
      kimiData.error?.message ||
      `Kimi API 请求失败，状态码：${kimiResponse.status}`;

    console.error("Kimi API error:", kimiData.error || rawResponse);
    throw new Error(`Kimi API 请求失败：${errorMessage}`);
  }

  const content = kimiData.choices?.[0]?.message?.content;

  if (!content) {
    console.error(
      "Kimi returned no content full response:",
      JSON.stringify(kimiData, null, 2)
    );

    throw new Error("Kimi 没有返回有效的判断内容。");
  }

  return content;
}

function tryParseAndValidate(jsonText: string) {
  try {
    const parsed = JSON.parse(jsonText);

    if (!hasValidResultShape(parsed)) {
      console.error("Kimi result has an invalid structure:", parsed);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function repairCommonJsonIssues(jsonText: string) {
  return jsonText
    // 常见错误：replacementAdvice 结束后多输出一个 }，导致 finalNote 跑到根对象外面
    .replace(/(\}\s*)\}\s*,\s*"finalNote"/, '$1,\n  "finalNote"')
    // 常见错误：末尾多了一个逗号
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]");
}

function parseResult(content: string) {
  const jsonText = extractJsonObject(content);

  const directResult = tryParseAndValidate(jsonText);

  if (directResult) {
    return directResult;
  }

  const repairedJsonText = repairCommonJsonIssues(jsonText);
  const repairedResult = tryParseAndValidate(repairedJsonText);

  if (repairedResult) {
    console.warn("Kimi JSON 有轻微格式问题，已自动修复并继续使用。");
    return repairedResult;
  }

  console.error("Kimi content is not valid JSON:", content);
  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    if (!body.intent || !body.itemType || !body.imageDataUrl) {
      return NextResponse.json(
        { error: "缺少必填的判断信息。" },
        { status: 400 }
      );
    }

    const firstContent = await callKimi(body, true);
const firstResult = parseResult(firstContent);

if (firstResult) {
  return NextResponse.json(firstResult);
}

console.warn("压缩模式 Kimi JSON 解析失败，开始使用标准模式重试。");

const secondContent = await callKimi(body, false);
const secondResult = parseResult(secondContent);

if (secondResult) {
  return NextResponse.json(secondResult);
}

    return NextResponse.json(
      { error: "Kimi 返回的判断结果不是有效 JSON。请重新生成一次。" },
      { status: 502 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知错误";

    console.error("Evaluate API error:", error);

    return NextResponse.json(
      {
        error: `调用 Kimi API 失败：${message}`,
      },
      { status: 500 }
    );
  }
}
