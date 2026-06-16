import { NextResponse } from "next/server";

export const runtime = "nodejs";

type FormPayload = {
  imageDataUrl?: string;
  imageName?: string;
  purpose?: string;
  intent?: string;
  itemType?: string;
  concern?: string;
  firstFeeling?: string;
  feeling?: string;
  similarItems?: string;
  occasion?: string;
  scenario?: string;
  priceFeeling?: string;
  extraInfo?: string;
  note?: string;
};

type RequestBody = FormPayload & {
  image?: string;
  imageBase64?: string;
  form?: FormPayload;
  formData?: FormPayload;
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

function normalizeBody(body: RequestBody): RequestBody {
  const form = body.form || body.formData || {};

  return {
    ...body,
    imageDataUrl:
      body.imageDataUrl ||
      body.image ||
      body.imageBase64 ||
      form.imageDataUrl,
    imageName: body.imageName || form.imageName,
    intent: body.intent || body.purpose || form.intent || form.purpose,
    itemType: body.itemType || form.itemType,
    concern: body.concern || form.concern,
    feeling:
      body.feeling ||
      body.firstFeeling ||
      form.feeling ||
      form.firstFeeling,
    similarItems: body.similarItems || form.similarItems,
    scenario:
      body.scenario ||
      body.occasion ||
      form.scenario ||
      form.occasion,
    priceFeeling: body.priceFeeling || form.priceFeeling,
    note: body.note || body.extraInfo || form.note || form.extraInfo,
    form,
    formData: form,
  };
}

function getIntentGuide(intent?: string) {
  if (intent?.includes("怎么搭")) {
    return `
当前判断目的：这件应该怎么搭。
输出重点：直接回答“怎么搭更好看”，不要把主结论写成留不留、退不退、值得留下。
headline 应该像一个搭配方向或风格结论，例如“适合走轻法式约会感”“适合做通勤里的温柔亮点”。
finalNote 必须给出具体穿法建议，不要以“建议留下/建议放手”作为核心。
stylingPlans 和 stylingFormula 是最重要的部分，必须具体到上衣/下装/鞋包/颜色/避雷。
sharpReview.comment 要回答“这件单品怎么搭才成立”，不要回答“要不要留下”。
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
sharpReview.comment 要回答“它对用户本人是否加分”，不要回答“是否值得购买”。
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
sharpReview.comment 要回答“到底值不值得留”，必须有明确取舍。
decision.label 表示留不留倾向：
- 建议放手 = 更建议退掉/放手
- 再观察 = 暂时不做决定
- 有条件留下 = 满足特定条件才值得留
- 值得留下 = 明确值得保留
`;
}

function buildPrompt(body: RequestBody, compact = false) {
  const lengthRule = compact
    ? "每个字符串字段不超过 24 个中文字符。只写短句。"
    : "每个字符串字段不超过 42 个中文字符。不要写长段落。";

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

判断语气要求：
1. 你不是礼貌客服，也不是泛泛夸人的穿搭博主。你是直接、准确、会指出问题的衣橱判断助手。
2. 先下判断，再讲原因；不要绕弯，但不要为了显得专业而刻意挑刺。
3. 评价要像真人试衣建议：一句话里要有明确取舍，例如“能留，但不是高分单品”“适合当功能外搭，不适合靠它提升质感”。
4. 必须指出“这件单品最拖后腿的地方”，但只说衣服造成的视觉效果，例如压身高、显拖沓、软塌、不够利落、难打理、和用户期待不匹配。
5. sharpReview.comment 要像真人判断：不攻击用户，但要敢说真话。避免模板腔，不要写“适合一部分场景”这种泛泛表述。
6. sharpReview.comment 要有取舍，但不要毒舌。
7. sharpReview.score 是 0-10 的真实评分，可以有小数，例如 7.2；不要为了显得专业而压低分数，也不要把普通可穿的衣服都打成 5-6 分。
8. 评分标准：8.5以上=明显加分；7.5-8.4=值得留但有条件；6.8-7.4=普通可用、有短板但能穿；6-6.7=短板明显且利用率存疑；6以下=更建议放手。
9. 不要输出“适合大多数人”“日常百搭”“有一定搭配空间”“适合一部分场景”这种空话；必须用图片证据说明为什么。
10. stylingFormula 必须像穿搭处方，具体到内搭、下装、鞋、包、配色和避雷。
表达克制要求：
1. 不要为了毒舌而夸大短板；普通可以说普通，但不要轻易写“廉价、土气、显旧、没精神、显胖、显壮、撑不住”。
2. visualAnalysis、sharpReview、stylingPlans、stylingFormula 不要重复同一句话。
3. headline 用自然中文，不要中英混杂。
4. 搭配建议要像人话，不要写模板腔。
5. 不要直接评价用户身体部位大小，例如“臀部偏大”“腿粗”“肩宽”。应改写为衣服造成的视觉效果，例如“胯臀区域横向感被放大”“裤腿松量让下半身显宽”。
6. 如果单品整体干净、比例没有明显灾难、能进入 2 套以上可执行搭配，即使有短板，也不应低于 6.8。
7. 如果单品只是“不惊艳但可用”，应给 6.8-7.4，而不是 5-6 分。
8. 所有负面判断优先写成“衣服版型/面料/长度造成的效果”，不要写成“用户撑不住”“人不精神”“穿着者不适合”。
9. 避免使用尴尬或不自然的身体部位词，例如“后臀口袋”“臀部口袋”；应改写为“后袋线条”“口袋痕迹”“后片细节”，且只有图片清晰可见时才提。
通用判断要求：
1. 必须优先分析图片里的衣服本身，再结合表单。不能把表单信息包装成单品本身判断。
2. 图片观察必须具体：颜色冷暖/明暗/饱和度、领口/门襟、肩线、袖长、衣长、腰线、宽松度、面料垂感、褶皱、透感、装饰细节、风格信号。
3. 如果是上身图，必须评价肩线、袖长、衣长、视觉重心、是否压身高、是否让上半身显得不够利落。
4. 如果图片信息有限，要说明“图片看不清某项”，但仍要基于看得见的部分判断。
5. 不要为了安慰用户强行给高分，也不要为了显得严格强行给低分。
6. ${lengthRule}
7. 只输出合法 JSON，不要 markdown，不要解释，不要代码块。
8. 如果某些用户信息是“未填写”，不要抱怨信息不足；主要依据图片、判断目的和单品类型给出判断。
9. 价格感受只作为用户心理负担和性价比感知的参考，不要直接判断商品真实定价是否合理。
10. 如果价格感受是“有点贵”或“明显不值”，需要在闲置风险、保留价值或最终建议里体现。
11. 如果价格感受是“不考虑价格”或“不记得价格”，不要过度讨论价格。
12. stylingPlans 只返回 1 套最推荐方案。
13. finalNote 不超过 55 个中文字符。
14. replacementAdvice 的 suggestions 最多返回 2 条，只写替代购买方向，不要写已经在搭配里出现过的内容。
15. sharpReview.keepCondition 最多返回 2 条，每条必须是“什么情况下值得留”。
16. sharpReview.dropReason 最多返回 2 条，每条必须是“什么情况下不值得留”。
17. sharpReview.oneLineReason 必须解释“为什么是这个判断”，不能只复述 headline。
18. sharpReview.biggestProblem 必须短而准，只写一个最大问题，不要并列三四个问题。
19. 如果一件衣服只是普通、基础、能穿但不惊艳，要直接说“普通可用”“加分有限”“不是高分单品”，但评分通常应在 6.8-7.4。

图片一致性检查要求：
1. 必须先判断用户选择的目标单品是否可见，不要自动改判画面里最显眼的单品。
2. 只要目标单品能看见，就围绕目标单品判断；全身图里的裤子、短裤、半裙、裙裤等下装只要露出轮廓就算可见。
3. 只有目标单品完全看不清、被遮挡或不存在时，targetItemVisible 才能为 false。
4. 大类可近似匹配：裤子包含短裤/裙裤/阔腿裤；外套包含衬衫式外套/薄开衫/防晒衫。
5. visibleMainItem 填本次实际判断的目标单品。若其他单品更显眼，可在 warning 简短说明，但不要改判。
穿着适配要求：
1. 如果能看到真人试穿，必须结合衣服穿在人身上的比例效果判断，而不是只评价衣服本身。
2. 重点看肩线、袖长、衣长、腰线、松量、视觉重心、是否显精神、是否压身高。
3. 不评价用户身材好坏，不使用羞辱性表达；所有比例问题都归因于衣服版型、松量、长度和搭配造成的视觉效果。平铺图或商品图不要臆测体型适配。
图片本身判断强制要求：
1. visualAnalysis 四个字段必须来自图片可见信息，不要写表单结论。
2. color 写颜色冷暖、明度、是否提气色；除非证据明显，不要写显旧。
3. silhouette 写版型、肩线、袖长、领口、门襟、下摆。
4. proportion 写衣长、腰线、视觉重心、是否压身高。
5. fabricAndDetails 写垂感、挺括度、褶皱、透感、扣子、纹理；只有口袋清晰可见时才写口袋，不要写“后臀口袋隐约可见”这类别扭表述。
6. sharpReview.biggestProblem 必须来自图片观察，只写一个最大短板。
7. sharpReview.oneLineReason 必须包含一个图片证据。
严格返回这个 JSON 结构，字段名不能改：

{
  "imageCheck": {
    "visibleMainItem": "本次实际判断的目标单品",
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
  "sharpReview": {
    "score": 6.5,
    "comment": "能留，但它的价值主要是实用，不是提升穿搭质感。",
    "oneLineReason": "因为颜色和版型基础可用，但图片里最明显的短板会影响利落感。",
    "biggestProblem": "只写一个最大短板，例如：袖长盖手背，视觉重心下移",
    "keepCondition": [
      "什么情况下可以留",
      "第二个保留前提"
    ],
    "dropReason": [
      "什么情况下应该放弃",
      "第二个放弃理由"
    ]
  },
  "stylingFormula": {
    "inner": "具体内搭，例如：修身背心 / 短款T恤 / 细肩带内搭",
    "bottom": "具体下装，例如：高腰直筒牛仔裤 / 黑色短裙 / 利落西裤",
    "shoes": "具体鞋子，例如：乐福鞋 / 德训鞋 / 薄底凉鞋",
    "bag": "具体包包，例如：小号腋下包 / 硬挺托特 / 帆布包",
    "color": "具体配色，例如：米白+深蓝+棕色，不要只写同色系",
    "avoid": "具体避雷，例如：不要配同样软塌的宽松裤"
  },
  "uiSummary": {
    "retentionValue": "中",
    "idleRisk": "中",
    "stylingDifficulty": "中",
    "bestScenario": "最适合场景"
  },
  "visualAnalysis": {
    "color": "例如：米白偏暖，柔和提亮，但褶皱和发黄会更明显",
    "silhouette": "例如：直筒微宽松衬衫版型，肩线自然但袖长略拖",
    "proportion": "例如：衣长到胯部附近，不压身高但不强调腰线",
    "fabricAndDetails": "例如：轻薄垂感面料，清爽但容易皱，门襟线条简洁"
  },
  
  "stylingPlans": [
    {
      "scenario": "最推荐场景",
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
      "具体建议二"
    ]
  },
  "finalNote": "最后简短建议"
}

imageCheck.visibleMainItem 应填写本次实际判断的目标单品，使用中文短词，例如：上衣、裤子、短裤、半裙、裙裤、连衣裙、外套、鞋子、包包、看不清。
imageCheck.selectedItemType 必须等于用户选择的单品类型。
imageCheck.isTypeMatched 和 imageCheck.targetItemVisible 必须是布尔值 true 或 false。
label 必须从这四个里选一个：建议放手、再观察、有条件留下、值得留下。
retentionValue、idleRisk、stylingDifficulty 必须从这三个里选一个：低、中、高。
sharpReview.score 必须是 0 到 10 的数字，可以有一位小数；正常可留单品应在 7 分以上。只有明显拖垮比例、质感或使用率很低时，才低于 6.5。
sharpReview.comment 必须直接、有判断，不要写成温和总结，也不要写“适合一部分场景”这种泛句；不要使用“撑不住”“人不精神”这类把问题归因给穿着者的表达。
sharpReview.oneLineReason、sharpReview.biggestProblem、sharpReview.keepCondition、sharpReview.dropReason 不能互相重复。
stylingFormula 六个字段都必须填写，不能空字符串；每个字段都要具体到可执行单品，不要只写抽象原则。
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
      max_tokens: compact ? 900 : 1200,
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
    .replace(/(\}\s*)\}\s*,\s*"finalNote"/, '$1,\n  "finalNote"')
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

  console.error("Kimi content is not valid JSON. Preview:", content.slice(0, 600));
  return null;
}

export async function POST(request: Request) {
  try {
    const rawBody = (await request.json()) as RequestBody;
    const body = normalizeBody(rawBody);

    if (!body.intent || !body.itemType || !body.imageDataUrl) {
      return NextResponse.json(
        { error: "缺少必填的判断信息。" },
        { status: 400 }
      );
    }

    const content = await callKimi(body, true);
    const result = parseResult(content);

    if (result) {
      return NextResponse.json(result);
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
