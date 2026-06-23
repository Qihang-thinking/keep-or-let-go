import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RequestBody = {
  itemType?: string;
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

function buildPrompt(body: RequestBody, compact = false) {
  const lengthRule = compact
    ? "每个字符串字段不超过 45 个中文字符。搭配方案只写关键词式短句。"
    : "每个字符串字段不超过 70 个中文字符。不要写长段落。";

  return `
你是「留不留」中文衣橱决策助手。请根据用户上传的衣服图片和表单信息，判断这件衣服是否值得留下。

用户信息：
单品类型：${body.itemType || "未知"}
纠结点：${body.concern || "未知"}
第一感受：${body.feeling || "未知"}
类似单品：${body.similarItems || "未知"}
主要场景：${body.scenario || "未知"}
补充说明：${body.note || "无"}

判断要求：
1. 必须结合图片本身，不要只评价表单。
2. 重点看颜色、版型、比例、长度、材质、褶皱、穿着门槛。
3. 如果是上身图，可以评价肩线、腰线、视觉重心、显高显瘦。
4. 如果图片信息有限，要直接说明。
5. 不要为了安慰用户强行建议留下。
6. ${lengthRule}
7. 只输出合法 JSON，不要 markdown，不要解释，不要代码块。
8. score 只能是 1、2、3、4、5。
9. 不要所有评分都给 5。
10. 如果场景窄，实穿频率不应高于 3。
11. 如果用户担心不好搭，搭配难度不应高于 3，除非图片显示非常百搭。
12. 如果衣橱里很多类似单品，衣橱补充不应高。

严格返回这个 JSON 结构，字段名不能改：

{
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
            "你是「留不留」中文衣橱决策助手。你必须只输出一个合法 JSON 对象，不要输出 markdown，不要解释。",
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
      max_tokens: compact ? 2200 : 3200,
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

function parseResult(content: string) {
  const jsonText = extractJsonObject(content);

  try {
    const parsed = JSON.parse(jsonText);

    if (!hasValidResultShape(parsed)) {
      console.error("Kimi result has an invalid structure:", parsed);
      return null;
    }

    return parsed;
  } catch {
    console.error("Kimi content is not valid JSON:", content);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    if (
      !body.itemType ||
      !body.concern ||
      !body.feeling ||
      !body.similarItems ||
      !body.scenario
    ) {
      return NextResponse.json(
        { error: "缺少必填的判断信息。" },
        { status: 400 }
      );
    }

    const firstContent = await callKimi(body, false);
    const firstResult = parseResult(firstContent);

    if (firstResult) {
      return NextResponse.json(firstResult);
    }

    console.warn("第一次 Kimi JSON 解析失败，开始使用压缩模式重试。");

    const secondContent = await callKimi(body, true);
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