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
keepReasons 应理解为“图片里这件单品本身适合拿来搭配的视觉优势”，必须来自颜色、版型、线条、材质、长度、细节，不要写衣橱重复度或场景覆盖。
riskReasons 应理解为“图片里这件单品搭配时容易出错的视觉风险”，必须来自单品本身，不要只写用户表单里的担心。
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
keepReasons 应理解为“图片里这件单品本身适合用户的视觉证据”，必须具体到颜色、领口/门襟、肩线、袖长、衣长、腰线、面料、风格信号等。
riskReasons 应理解为“图片里这件单品本身不适合或需要注意的视觉风险”，不能只写通勤、旅行、衣橱空白、搭配范围广这类表单结论。
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
keepReasons 表示这件单品本身值得留下的视觉理由，必须来自图片可见的颜色、版型、比例、材质、细节或风格特征。
riskReasons 表示这件单品本身不留或退掉的视觉风险，也可以补充表单风险，但不能只写表单风险。
decision.label 表示留不留倾向：
- 建议放手 = 更建议退掉/放手
- 再观察 = 暂时不做决定
- 有条件留下 = 满足特定条件才值得留
- 值得留下 = 明确值得保留
`;
}

function buildPrompt(body: RequestBody, compact = false) {
  const lengthRule = compact
    ? "每个字符串字段不超过 30 个中文字符。只写短句，不写完整长段落。"
    : "每个字符串字段不超过 55 个中文字符。不要写长段落。";

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
2. 先下判断，再讲原因；不要绕弯，不要平均用力，不要为了安慰用户把普通单品说成高级。
3. 评价要像真人试衣建议：一句话里要有明确取舍，例如“能留，但不是高分单品”“适合当功能外搭，不适合靠它提升质感”。
4. 必须指出“这件单品最拖后腿的地方”，例如压身高、显旧、显廉价、显壮、软塌、土气、普通、难打理、和用户期待不匹配。
5. sharpReview.comment 要像真人判断：不攻击用户，但要敢说真话。避免模板腔，不要写“适合一部分场景”这种泛泛表述。
6. sharpReview.comment 推荐句式：
   - “能留，但它的价值主要是实用，不是提升穿搭质感。”
   - “不是丑，是不够利落；需要靠搭配把短板压下去。”
   - “如果你要的是显贵/显精神，这件不够；如果只是功能外搭，可以留。”
   - “它成立的前提是你愿意打理，并且确实缺这个类型。”
7. sharpReview.score 是 0-10 的真实评分，可以有小数，例如 6.5；普通单品不要给 8 分以上。
8. 评分标准：8.5 以上=强烈建议留；7-8.4=可以留但要会搭；6-6.9=有明显短板；6 以下=建议放手。
9. 不要输出“适合大多数人”“日常百搭”“有一定搭配空间”“适合一部分场景”这种空话；必须用图片证据说明为什么。
10. stylingFormula 必须像穿搭处方，具体到内搭、下装、鞋、包、配色和避雷。
表达克制要求：
1. 不要为了显得毒舌而夸大短板。普通可以说普通，加分有限可以说加分有限；不要轻易使用“廉价、土气、显旧”，除非图片证据非常明显。
2. sharpReview.comment 要像真人试衣建议，不要像总结报告。优先使用“能留，但……”“不是……而是……”“如果你要的是……这件不够”这类句式。
3. visualAnalysis、sharpReview、stylingPlans、stylingFormula 不能重复同一句话。每个模块承担不同作用：
   - sharpReview：下判断；
   - visualAnalysis：解释图片证据；
   - stylingPlans：说明整体穿法；
   - stylingFormula：拆成内搭、下装、鞋包、配色、避雷。
4. headline 尽量使用自然中文，不要中英混杂，除非是用户常用或行业常见风格词。
5. 搭配建议要像人话，不要写成“露肤打破沉闷、拉回利落感”这种模板表达。可以写“内搭要修身、露一点领口；下装和鞋包要更挺，别让整套都软。”
6. 如果图片里的单品只是普通基础款，评价重点应是“是否值得占衣橱位置”和“怎么穿才不拖后腿”，不要强行拔高成风格亮点。

图片一致性检查要求：
1. 你必须先判断“用户选择的目标单品”在图片中是否可见，而不是判断画面里哪个单品最抢眼。
2. 只要用户选择的目标单品在图片中能看见，就必须围绕该目标单品判断；即使图片里上衣、外套或人物更显眼，也不能自动改判其他单品。
3. 全身穿搭图中，如果用户选择裤子、短裤、半裙、裙裤等下装，只要下装露出轮廓、长度、颜色或比例，就视为 targetItemVisible=true，并围绕下装判断。
4. 只有当用户选择的目标单品完全看不清、被遮挡、或图片中根本没有出现时，targetItemVisible 才能为 false。
5. 如果用户选择的是大类，例如“裤子”，图片里是短裤、裙裤、阔腿裤、牛仔裤、运动裤等，都应视为类型匹配或近似匹配，不要因为细分类不同而改判成上衣。
6. 如果用户选择的是“外套”，图片里是衬衫式外套、薄开衫、罩衫、防晒衫等外穿层，可以视为外套类继续判断，不要过度纠正。
7. visibleMainItem 应填写“本次实际判断的目标单品”，例如：裤子、短裤、半裙、外套、上衣、连衣裙、鞋子、包包。
8. 如果目标单品可见但图片中另一个单品更显眼，warning 可以写“图片中其他单品更显眼，但已按你选择的裤子继续判断”，不要改判其他单品。
9. 如果 targetItemVisible 为 false，仍然必须返回完整 JSON 结构，但其他判断字段可以简短说明“目标单品不可见，无法可靠判断”。

通用判断要求：
1. 必须优先分析图片里的衣服本身，再结合表单。不能把表单信息包装成单品本身判断。
2. 图片观察必须具体：颜色冷暖/明暗/饱和度、领口/门襟、肩线、袖长、衣长、腰线、宽松度、面料垂感、褶皱、透感、装饰细节、风格信号。
3. 如果是上身图，必须评价肩线、袖长、衣长、视觉重心、是否压身高、是否显肩宽/显壮/显拖沓。
4. 如果图片信息有限，要说明“图片看不清某项”，但仍要基于看得见的部分判断。
5. 不要为了安慰用户强行给高分或强行建议留下。
6. ${lengthRule}
7. 只输出合法 JSON，不要 markdown，不要解释，不要代码块。
8. ratings 里的 score 只能是 1、2、3、4、5。
9. 不要所有 ratings 都给 5。
10. 如果场景窄，实穿频率不应高于 3。
11. 如果用户担心不好搭，搭配难度不应高于 3，除非图片显示非常容易搭。
12. 如果衣橱里很多类似单品，衣橱补充不应高。
13. 如果某些用户信息是“未填写”，不要抱怨信息不足；主要依据图片、判断目的和单品类型给出判断。
14. 价格感受只作为用户心理负担和性价比感知的参考，不要直接判断商品真实定价是否合理。
15. 如果价格感受是“有点贵”或“明显不值”，需要在闲置风险、保留价值或最终建议里体现。
16. 如果价格感受是“不考虑价格”或“不记得价格”，不要过度讨论价格。
17. stylingPlans 只返回 1 套最推荐方案。
18. finalNote 不超过 55 个中文字符。
19. sharpReview.keepCondition 最多返回 2 条，每条必须是“什么情况下值得留”。
20. sharpReview.dropReason 最多返回 2 条，每条必须是“什么情况下不值得留”。
21. sharpReview.oneLineReason 必须解释“为什么是这个判断”，不能只复述 headline。
22. sharpReview.biggestProblem 必须短而准，只写一个最大问题，不要并列三四个问题。
23. 如果一件衣服只是普通、基础、能穿但不加分，要直接说“普通”“加分有限”“不是高分单品”。

图片本身判断强制要求：
1. visualAnalysis 四个字段必须全部来自图片可见信息，不能写“适合通勤”“衣橱没有类似款”“覆盖场景广”“性价比高”等表单结论。
2. visualAnalysis.color 必须说明颜色本身，例如偏暖/偏冷、明度、是否显旧、是否提气色、是否容易发黄或显脏。
3. visualAnalysis.silhouette 必须说明版型本身，例如直筒、箱型、收腰、宽松、肩线、袖长、领口、门襟、下摆。
4. visualAnalysis.proportion 必须说明比例效果，例如衣长到哪里、是否压身高、是否显腿长、腰线是否明确、视觉重心在哪里。
5. visualAnalysis.fabricAndDetails 必须说明材质和细节，例如垂感、挺括度、褶皱、透感、厚薄、扣子、领型、口袋、纹理。
6. keepReasons 的 title 和 detail 必须至少包含一个图片可见细节，不允许只写“通勤约会旅行一件覆盖”“衣橱里没有类似款”“补充空白”。
7. riskReasons 的 title 和 detail 必须至少包含一个图片可见细节，不允许只写“需靠搭配出彩”“场景窄”“使用频率低”。
8. 如果确实需要引用表单，请明确写成“表单因素”，不要伪装成衣服本身亮点。
9. 禁止输出空泛词：百搭、实用、高级、有质感、显气质、好看。除非后面紧跟具体图片证据。
10. sharpReview.biggestProblem 必须来自图片观察，不允许只写“场景少”“用户不确定”这种表单因素。
11. sharpReview.biggestProblem 要聚焦一个最主要短板，例如“袖长盖手背，视觉重心下移”，不要写成“颜色、版型、材质都一般”。
12. sharpReview.oneLineReason 必须包含一个图片证据，例如颜色、肩线、袖长、衣长、腰线、面料、褶皱、垂感、领口、门襟、鞋包比例。

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
    }
  ],
  "keepReasons": [
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
sharpReview.score 必须是 0 到 10 的数字，可以有一位小数。
sharpReview.comment 必须直接、有判断，不要写成温和总结，也不要写“适合一部分场景”这种泛句。
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
      max_tokens: compact ? 1400 : 1700,
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
