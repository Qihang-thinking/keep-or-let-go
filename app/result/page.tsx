"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

type DecisionLabel = "建议放手" | "再观察" | "有条件留下" | "值得留下";

type ReasonItem = {
  title: string;
  detail: string;
};

type StylingPlan = {
  scenario: string;
  outfit: string;
  shoesAndBag: string;
  colorDirection: string;
  avoid: string;
  whyItWorks: string;
};
type SharpReview = {
  score?: number;
  comment?: string;
  oneLineReason?: string;
  biggestProblem?: string;
  keepCondition?: string[];
  dropReason?: string[];
};

type StylingFormula = {
  inner?: string;
  bottom?: string;
  shoes?: string;
  bag?: string;
  color?: string;
  avoid?: string;
};

type RatingItem = {
  label: string;
  score: number;
  note: string;
};

type VisualAnalysis = {
  color?: string;
  silhouette?: string;
  proportion?: string;
  fabricAndDetails?: string;
  stylingPotential?: string;
  imageQuality?: string;
};

type ImageCheck = {
  visibleMainItem?: string;
  selectedItemType?: string;
  isTypeMatched?: boolean;
  targetItemVisible?: boolean;
  warning?: string;
};

type EvaluationResult = {
  imageCheck?: ImageCheck;
    decision: {
    label: DecisionLabel | string;
    headline: string;
    reason: string;
  };
  sharpReview?: SharpReview;
  stylingFormula?: StylingFormula;
  uiSummary: {
    retentionValue: string;
    idleRisk: string;
    stylingDifficulty: string;
    bestScenario: string;
  };
  visualAnalysis?: VisualAnalysis;
  ratings?: RatingItem[];
  keepReasons?: ReasonItem[];
  riskReasons?: ReasonItem[];
  stylingPlans: StylingPlan[];
  replacementAdvice: {
    title: string;
    suggestions: string[];
  };
  finalNote: string;
};

type FormData = {
  intent?: string;
  purpose?: string;
  itemType: string;
  concern: string;
  feeling: string;
  firstFeeling?: string;
  similarItems: string;
  scenario: string;
  occasion?: string;
  priceFeeling?: string;
  note: string;
  extraInfo?: string;
  imageName?: string;
  imageDataUrl?: string;
};
function formatDisplayText(value?: string) {
  return value ? value.replace(/\//g, " / ") : "";
}
function getIntentCopy(intent?: string) {
  if (intent?.includes("怎么搭")) {
    return {
      pageTitle: "搭配方案",
      spectrumTitle: "搭配可行度",
      spectrumLabels: ["不建议硬搭", "需要调整", "有搭配空间", "很好搭"],
      heroEyebrow: "Styling Direction",
      evidenceTitle: "搭配依据",
      detailTitle: "详细分析",
    };
  }

  if (intent?.includes("适不适合")) {
    return {
      pageTitle: "适配度判断",
      spectrumTitle: "适配度光谱",
      spectrumLabels: ["不太适合", "需要再观察", "有条件适合", "很适合你"],
      heroEyebrow: "Fit Review",
      evidenceTitle: "适配分析",
      detailTitle: "详细分析",
    };
  }

  return {
    pageTitle: "留 / 不留判断",
    spectrumTitle: "留 / 不留光谱",
    spectrumLabels: ["建议放手", "再观察", "有条件留下", "值得留下"],
    heroEyebrow: "Wardrobe Decision",
    evidenceTitle: "判断依据",
    detailTitle: "详细分析",
  };
}

function getDisplayDecisionLabel(label: DecisionLabel, intent?: string) {
  if (intent?.includes("怎么搭")) {
    if (label === "建议放手") return "不建议硬搭";
    if (label === "再观察") return "需要调整";
    if (label === "有条件留下") return "有搭配空间";
    return "很好搭";
  }

  if (intent?.includes("适不适合")) {
    if (label === "建议放手") return "不太适合";
    if (label === "再观察") return "需要再观察";
    if (label === "有条件留下") return "有条件适合";
    return "很适合你";
  }

  return label;
}

function getHeroDecisionLabel(label: DecisionLabel, intent?: string, primaryPlan?: StylingPlan) {
  if (intent?.includes("怎么搭")) {
    return formatDisplayText(primaryPlan?.scenario) || "优先这样搭";
  }

  return getDisplayDecisionLabel(label, intent);
}

function getHeroDescription(result: EvaluationResult, intent?: string, primaryPlan?: StylingPlan) {
  if (intent?.includes("怎么搭") && primaryPlan?.outfit) {
    return primaryPlan.outfit;
  }

  return result.decision.headline;
}

function getSharpScore(result: EvaluationResult, label: DecisionLabel) {
  const rawScore = result.sharpReview?.score;

  if (typeof rawScore === "number" && Number.isFinite(rawScore)) {
    return Math.max(0, Math.min(10, rawScore));
  }

  if (label === "值得留下") return 8.2;
  if (label === "有条件留下") return 6.8;
  if (label === "再观察") return 6.2;
  return 5.2;
}

function formatSharpScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

function getSharpComment(result: EvaluationResult, label: DecisionLabel, intent?: string) {
  if (result.sharpReview?.comment) return result.sharpReview.comment;

  if (intent?.includes("怎么搭")) {
    if (label === "建议放手") return "不是不能搭，是没必要硬拗；限制太多会拖累整套。";
    if (label === "再观察") return "能搭，但需要明显调整；随便穿容易暴露短板。";
    if (label === "有条件留下") return "有搭配空间，但不能乱搭；必须靠比例和鞋包撑住。";
    return "搭配方向清楚，可以直接进入常穿公式。";
  }

  if (intent?.includes("适不适合")) {
    if (label === "建议放手") return "不是你不会穿，是这件本身对你加分不够。";
    if (label === "再观察") return "能穿，但没有明显抬高你的状态。";
    if (label === "有条件留下") return "适合一部分场景，但需要搭配把短板压下去。";
    return "这件和你的比例、风格方向比较顺。";
  }

  if (label === "建议放手") return "能穿不等于值得留；这件没有强到要占衣橱位置。";
  if (label === "再观察") return "先别急着留下，它现在的说服力还不够。";
  if (label === "有条件留下") return "可以留，但理由应该是实用，不是它特别加分。";
  return "这件有明确加分点，不是靠勉强搭配才成立。";
}

function getOneLineReason(result: EvaluationResult) {
  return result.sharpReview?.oneLineReason || result.decision.reason || result.finalNote;
}

function getBiggestProblem(result: EvaluationResult) {
  return (
    result.sharpReview?.biggestProblem ||
    result.riskReasons?.[0]?.detail ||
    result.decision.reason ||
    "最大问题还不够明确，建议重新生成一次。"
  );
}

function getKeepConditions(result: EvaluationResult, primaryPlan?: StylingPlan) {
  const conditions = result.sharpReview?.keepCondition?.filter(Boolean) || [];

  if (conditions.length > 0) return conditions.slice(0, 3);

  return [
    result.keepReasons?.[0]?.detail || "你确实缺这个类型，并且它能进入固定搭配。",
    primaryPlan?.scenario
      ? `你会在「${primaryPlan.scenario}」里稳定使用。`
      : result.uiSummary.bestScenario || "你有明确使用场景。",
  ].filter(Boolean).slice(0, 3);
}

function getDropReasons(result: EvaluationResult) {
  const reasons = result.sharpReview?.dropReason?.filter(Boolean) || [];

  if (reasons.length > 0) return reasons.slice(0, 3);

  return [
    result.riskReasons?.[0]?.detail || "短板比亮点更影响日常穿着。",
    result.riskReasons?.[1]?.detail || "如果需要反复说服自己，它就不够值得。",
  ].filter(Boolean).slice(0, 3);
}

function getFormulaValue(
  result: EvaluationResult,
  key: keyof StylingFormula,
  fallback: string
) {
  return result.stylingFormula?.[key] || fallback;
}

function shouldBlockForInvisibleTarget(result: EvaluationResult) {
  return result.imageCheck?.targetItemVisible === false;
}

function getImageCheckWarning(result: EvaluationResult) {
  const check = result.imageCheck;

  if (!check) return "";
  if (check.targetItemVisible === false) {
    return check.warning || "图片中没有清楚看到你选择的目标单品。";
  }

  if (check.isTypeMatched === false) {
    return (
      check.warning ||
      `你选择的是「${check.selectedItemType || "该类型"}」，但图片主体更像「${
        check.visibleMainItem || "另一类单品"
      }」。以下判断将优先依据图片主体。`
    );
  }

  return "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidResult(value: unknown): value is EvaluationResult {
  return (
    isRecord(value) &&
    isRecord(value.decision) &&
    isRecord(value.uiSummary) &&
    Array.isArray(value.stylingPlans) &&
    isRecord(value.replacementAdvice) &&
    typeof value.finalNote === "string"
  );
}

function normalizeFormData(value: unknown): FormData | null {
  if (!isRecord(value)) return null;

  const itemType = typeof value.itemType === "string" ? value.itemType : "";
  if (!itemType) return null;

  const intent =
    typeof value.intent === "string"
      ? value.intent
      : typeof value.purpose === "string"
      ? value.purpose
      : "";

  const feeling =
    typeof value.feeling === "string"
      ? value.feeling
      : typeof value.firstFeeling === "string"
      ? value.firstFeeling
      : "";

  const scenario =
    typeof value.scenario === "string"
      ? value.scenario
      : typeof value.occasion === "string"
      ? value.occasion
      : "";

  const note =
    typeof value.note === "string"
      ? value.note
      : typeof value.extraInfo === "string"
      ? value.extraInfo
      : "";

  return {
    intent,
    purpose: typeof value.purpose === "string" ? value.purpose : intent,
    itemType,
    concern: typeof value.concern === "string" ? value.concern : "",
    feeling,
    firstFeeling: typeof value.firstFeeling === "string" ? value.firstFeeling : feeling,
    similarItems: typeof value.similarItems === "string" ? value.similarItems : "",
    scenario,
    occasion: typeof value.occasion === "string" ? value.occasion : scenario,
    priceFeeling: typeof value.priceFeeling === "string" ? value.priceFeeling : "",
    note,
    extraInfo: typeof value.extraInfo === "string" ? value.extraInfo : note,
    imageName: typeof value.imageName === "string" ? value.imageName : "",
    imageDataUrl: typeof value.imageDataUrl === "string" ? value.imageDataUrl : "",
  };
}

function normalizeDecisionLabel(label: string): DecisionLabel {
  if (
    label === "建议放手" ||
    label === "再观察" ||
    label === "有条件留下" ||
    label === "值得留下"
  ) {
    return label;
  }

  return "再观察";
}

function getDecisionPosition(label: DecisionLabel) {
  if (label === "建议放手") return "18%";
  if (label === "再观察") return "52%";
  if (label === "有条件留下") return "74%";
  return "90%";
}

function getReportNumber() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `No.${month}${day}`;
}

function getVerdictWord(label: DecisionLabel, intent?: string) {
  if (intent?.includes("怎么搭")) {
    if (label === "建议放手") return "难搭";
    if (label === "再观察") return "调整";
    if (label === "有条件留下") return "可搭";
    return "好搭";
  }

  if (intent?.includes("适不适合")) {
    if (label === "建议放手") return "不合";
    if (label === "再观察") return "观察";
    if (label === "有条件留下") return "适合";
    return "很合";
  }

  if (label === "建议放手") return "放手";
  if (label === "再观察") return "观察";
  if (label === "有条件留下") return "有条件留";
  return "留下";
}

function getScorePercent(score: number) {
  return Math.max(0, Math.min(100, Math.round(score * 10)));
}

function formatScore10(score: number) {
  return score.toFixed(1);
}

function getScoreTitle(intent?: string) {
  if (intent?.includes("怎么搭")) return "搭配指数";
  if (intent?.includes("适不适合")) return "契合度";
  return "留用指数";
}

function getScoreHint(intent?: string) {
  if (intent?.includes("怎么搭")) return "衡量的是这件单品通过搭配被穿好的空间。";
  if (intent?.includes("适不适合")) return "衡量的是与你身形、风格和场景的匹配度。";
  return "衡量的是保留适配度，不是单品好坏。";
}

function getItemTags(formData: FormData, result: EvaluationResult) {
  const visibleItem = result.imageCheck?.visibleMainItem;
  const tags = [
    visibleItem && visibleItem !== "看不清" ? visibleItem : formData.itemType,
    formData.intent || formData.purpose,
    result.uiSummary.bestScenario,
    formData.concern,
  ]
    .filter(Boolean)
    .map((item) => String(item).trim())
    .filter((item, index, arr) => item && arr.indexOf(item) === index)
    .slice(0, 4);

  return tags.length ? tags : [formData.itemType];
}

function getAccessoryText(result: EvaluationResult, primaryPlan?: StylingPlan) {
  return (
    result.stylingFormula?.avoid ||
    primaryPlan?.avoid ||
    primaryPlan?.shoesAndBag ||
    "小体量配饰即可，避免抢走单品重点。"
  );
}

type RxItem = { label: string; value: string };

function getFilteredRxItems(
  itemType: string,
  result: EvaluationResult,
  primaryPlan?: StylingPlan
): RxItem[] {
  const f = result.stylingFormula || {};
  const p = primaryPlan;

  const inner = f.inner || "";
  const bottom = f.bottom || "";
  const shoes = f.shoes || "";
  const bag = f.bag || "";
  const shoesAndBag = [shoes || p?.shoesAndBag || "", bag].filter(Boolean).join(" + ");
  const avoid = f.avoid || p?.avoid || "";
  const outfitDir = inner || bottom || p?.outfit || "";

  switch (itemType) {
    case "连衣裙":
      return [
        { label: "鞋包", value: shoesAndBag || p?.shoesAndBag || "" },
        { label: "配饰 / 避雷", value: avoid },
      ].filter((v) => v.value);

    case "上衣":
      return [
        { label: "下装", value: bottom || p?.outfit || "" },
        { label: "鞋包", value: shoesAndBag || p?.shoesAndBag || "" },
        { label: "配饰 / 避雷", value: avoid },
      ].filter((v) => v.value);

    case "裤子":
    case "半裙":
      return [
        { label: "上衣", value: inner || p?.outfit || "" },
        { label: "鞋包", value: shoesAndBag || p?.shoesAndBag || "" },
        { label: "配饰 / 避雷", value: avoid },
      ].filter((v) => v.value);

    case "外套":
      return [
        { label: "内搭", value: inner || p?.outfit || "" },
        { label: "下装", value: bottom },
        { label: "鞋包配饰", value: shoesAndBag || p?.shoesAndBag || "" },
      ].filter((v) => v.value);

    case "套装":
      return [
        { label: "鞋包", value: shoesAndBag || p?.shoesAndBag || "" },
        { label: "配饰 / 避雷", value: avoid },
      ].filter((v) => v.value);

    case "鞋子":
      return [
        { label: "服装搭配方向", value: outfitDir || p?.outfit || "" },
        { label: "包配饰", value: [bag, avoid].filter(Boolean).join(" + ") },
        { label: "避雷", value: avoid },
      ].filter((v) => v.value);

    case "包 / 配饰":
      return [
        { label: "服装搭配方向", value: outfitDir || p?.outfit || "" },
        { label: "鞋子", value: shoes },
        { label: "避雷", value: avoid },
      ].filter((v) => v.value);

    default:
      return [
        { label: "内搭", value: inner || p?.outfit || "" },
        { label: "下装", value: bottom },
        { label: "鞋包", value: shoesAndBag || p?.shoesAndBag || "" },
        { label: "配饰 / 避雷", value: avoid },
      ].filter((v) => v.value);
  }
}

function getSpectrumTone(label: DecisionLabel, intent?: string) {
  if (intent?.includes("怎么搭")) {
    if (label === "建议放手") return "不建议硬搭";
    if (label === "再观察") return "需要调整后再搭";
    if (label === "有条件留下") return "有搭配空间";
    return "很好搭";
  }

  if (intent?.includes("适不适合")) {
    if (label === "建议放手") return "不太适合";
    if (label === "再观察") return "需要再观察";
    if (label === "有条件留下") return "有条件适合";
    return "很适合你";
  }

  if (label === "建议放手") return "偏向不留";
  if (label === "再观察") return "中立观察";
  if (label === "有条件留下") return "有条件保留";
  return "值得留下";
}

function getMainMetrics(
  result: EvaluationResult,
  intent?: string,
  decisionLabel?: DecisionLabel,
  primaryPlan?: StylingPlan
) {
  if (intent?.includes("怎么搭")) {
  return [
    { label: "搭配门槛", value: result.uiSummary.stylingDifficulty },
    {
      label: "可行程度",
      value: decisionLabel ? getDisplayDecisionLabel(decisionLabel, intent) : "有搭配空间",
    },
  ];
}

  if (intent?.includes("适不适合")) {
    return [
      {
        label: "适配程度",
        value: decisionLabel ? getDisplayDecisionLabel(decisionLabel, intent) : "需要再观察",
      },
      { label: "搭配门槛", value: result.uiSummary.stylingDifficulty },
      { label: "闲置风险", value: result.uiSummary.idleRisk },
    ];
  }

  return [
    { label: "保留价值", value: result.uiSummary.retentionValue },
    { label: "闲置风险", value: result.uiSummary.idleRisk },
    { label: "搭配门槛", value: result.uiSummary.stylingDifficulty },
  ];
}

function getScenarioLabel(intent?: string) {
  if (intent?.includes("怎么搭")) return "推荐场景";
  if (intent?.includes("适不适合")) return "适合场景";
  return "适合场景";
}

function getEvidenceItems(result: EvaluationResult, intent?: string, primaryPlan?: StylingPlan) {
  const visual = result.visualAnalysis || {};
  const color = visual.color || "";
  const silhouette = visual.silhouette || "";
  const proportion = visual.proportion || "";
  const fabric = visual.fabricAndDetails || visual.stylingPotential || visual.imageQuality || "";
  const colorAndFabric = [color, fabric].filter(Boolean).join("；");
  const shapeAndProportion = [silhouette, proportion].filter(Boolean).join("；");

  if (intent?.includes("怎么搭")) {
    return [
      {
        title: "风格方向",
        detail:
          primaryPlan?.whyItWorks ||
          result.decision.headline ||
          "先确定整体风格，再决定内搭、下装和鞋包。",
      },
      {
        title: "版型比例",
        detail: shapeAndProportion || "重点是控制衣长、腰线和鞋型，让比例更清楚。",
      },
      {
        title: "颜色材质",
        detail: colorAndFabric || "颜色和材质决定它更适合作为过渡层还是主角单品。",
      },
      {
        title: "搭配影响",
        detail:
          primaryPlan?.avoid ||
          "搭配时要避开会放大短板的单品，让整体线条更利落。",
      },
    ];
  }

  if (intent?.includes("适不适合")) {
    return [
      {
        title: "颜色材质",
        detail: colorAndFabric || "颜色和材质会影响它是否提气色、显精神。",
      },
      {
        title: "版型比例",
        detail: shapeAndProportion || "需要结合肩线、衣长、腰线和视觉重心判断适配度。",
      },
      {
        title: "细节状态",
        detail: fabric || silhouette || "重点看褶皱、垂感、门襟、袖长和细节是否影响利落度。",
      },
      {
        title: "适配影响",
        detail:
          primaryPlan?.avoid ||
          primaryPlan?.whyItWorks ||
          "它是否适合你，取决于这些细节能不能被搭配修正。",
      },
    ];
  }

  return [
    {
      title: "颜色材质",
      detail: colorAndFabric || "颜色和材质会影响它的保留价值和日常质感。",
    },
    {
      title: "版型比例",
      detail: shapeAndProportion || "需要结合版型、比例和视觉重心判断真实利用率。",
    },
    {
      title: "细节状态",
      detail: fabric || silhouette || "重点看褶皱、垂感、门襟、袖长和细节是否影响利落度。",
    },
    {
      title: "穿着影响",
      detail:
        primaryPlan?.avoid ||
        primaryPlan?.whyItWorks ||
        "这些细节会决定它是容易常穿，还是需要特定搭配才成立。",
    },
  ];
}

function clampScore(score: number) {
  return Math.max(1, Math.min(5, Math.round(score)));
}

function getFallbackRatings(formData: FormData, result: EvaluationResult): RatingItem[] {
  const decisionLabel = normalizeDecisionLabel(result.decision.label);

  const fit =
    decisionLabel === "值得留下"
      ? 4
      : decisionLabel === "建议放手"
      ? 2
      : 3;

  const color = decisionLabel === "值得留下" ? 4 : 3;

  const styling =
    result.uiSummary.stylingDifficulty === "低"
      ? 4
      : result.uiSummary.stylingDifficulty === "高"
      ? 2
      : 3;

  const practicality =
    result.uiSummary.idleRisk === "低"
      ? 4
      : result.uiSummary.idleRisk === "高"
      ? 2
      : 3;

  const wardrobe =
    formData.similarItems === "没有"
      ? 5
      : formData.similarItems === "有很多"
      ? 2
      : 3;

  return [
    {
      label: "版型比例",
      score: fit,
      note: "根据图片中的轮廓、长度、腰线和视觉重心综合判断。",
    },
    {
      label: "颜色适配",
      score: color,
      note: "根据图片颜色、明暗、饱和度和整体风格判断。",
    },
    {
      label: "搭配友好度",
      score: styling,
      note: `当前搭配门槛为「${result.uiSummary.stylingDifficulty}」。`,
    },
    {
      label: "实穿频率",
      score: practicality,
      note: `当前闲置风险为「${result.uiSummary.idleRisk}」。`,
    },
    {
      label: "衣橱补充",
      score: wardrobe,
      note: `衣橱重复度：${formData.similarItems}。`,
    },
  ];
}

function normalizeRatingLabel(label: string) {
  if (label === "搭配难度") return "搭配门槛";
  return label;
}

function RatingCard({ item }: { item: RatingItem }) {
  const score = clampScore(item.score);
  const width = `${score * 20}%`;

  return (
    <div className={styles.ratingItem}>
      <div className={styles.ratingTop}>
        <strong>{normalizeRatingLabel(item.label)}</strong>
        <div className={styles.scoreValue}>
          <span>{score}</span>
          <em>/ 5</em>
        </div>
      </div>

      <div className={styles.scoreBar} aria-hidden="true">
        <div className={styles.scoreBarFill} style={{ width }} />
      </div>

      <p>{item.note}</p>
    </div>
  );
}

function saveFeedback(value: string) {
  const feedbackPayload = {
    value,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem("keepOrLetGoFeedback", JSON.stringify(feedbackPayload));
}

export default function Result() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [shareError, setShareError] = useState("");
  const [generatedShareImage, setGeneratedShareImage] = useState("");
  const shareCardRef = useRef<HTMLDivElement | null>(null);

  const handleFeedback = (value: string) => {
    setFeedback(value);
    saveFeedback(value);
  };

  const handleStartNew = () => {
    localStorage.removeItem("keepOrLetGoForm");
    localStorage.removeItem("keepOrLetGoResult");
    localStorage.removeItem("keepOrLetGoFeedback");
    router.push("/decision-helper?reset=1");
  };

  const handleEditForm = () => {
    localStorage.removeItem("keepOrLetGoResult");
    router.push("/decision-helper");
  };

  const handleShare = () => {
    setShareError("");
    setShowShareModal(true);
  };

  const handleCloseModal = () => {
    setShowShareModal(false);
    setShareError("");
    setGeneratedShareImage("");
  };

  function drawRoundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function drawImageCover(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const boxRatio = w / h;
    let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
    if (imgRatio > boxRatio) {
      sw = img.naturalHeight * boxRatio;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      sh = img.naturalWidth / boxRatio;
      sy = (img.naturalHeight - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  function drawWrappedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines = 5
  ) {
    let line = "";
    const lines: string[] = [];
    for (const ch of text) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line.length > 0) {
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    const shown = lines.slice(0, maxLines);
    shown.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
    return y + shown.length * lineHeight;
  }

  async function generateShareImageCanvas(
    imageDataUrl?: string
  ): Promise<string> {
    const W = 750;
    const H = 1334;
    const DPR = 2;
    const P = 48;
    const CW = W - P * 2;

    const canvas = document.createElement("canvas");
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(DPR, DPR);

    // Background
    ctx.fillStyle = "#fbf7f3";
    ctx.fillRect(0, 0, W, H);

    let y = P;

    // ── Header ──
    ctx.fillStyle = "#3f3935";
    ctx.font = "620 28px -apple-system, PingFang SC, Hiragino Sans GB, sans-serif";
    ctx.fillText("留不留", P, y + 22);

    ctx.fillStyle = "#a1958e";
    ctx.font = "540 18px -apple-system, PingFang SC, Hiragino Sans GB, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("PERSONAL FIT REVIEW", W - P, y + 22);
    ctx.textAlign = "left";
    y += 50;

    // Divider
    ctx.strokeStyle = "#e8e0da";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(P, y);
    ctx.lineTo(W - P, y);
    ctx.stroke();
    y += 44;

    // ── Verdict + Score ──
    const verdictWord = getVerdictWord(decisionLabel, formData?.intent);
    ctx.fillStyle = "#2f2926";
    ctx.font = "520 88px -apple-system, PingFang SC, Hiragino Sans GB, sans-serif";
    ctx.fillText(verdictWord, P, y + 66);
    y += 94;

    const scoreTitle = getScoreTitle(formData?.intent);
    ctx.fillStyle = "#9b6572";
    ctx.font = "650 18px -apple-system, PingFang SC, Hiragino Sans GB, sans-serif";
    ctx.fillText(scoreTitle, P, y + 14);

    const scoreText = formatScore10(sharpScore);
    ctx.fillStyle = "#2f2926";
    ctx.font = "470 72px -apple-system, PingFang SC, Hiragino Sans GB, sans-serif";
    ctx.fillText(scoreText, P, y + 72);
    const sw = ctx.measureText(scoreText).width;

    ctx.fillStyle = "#8c827d";
    ctx.font = "500 34px -apple-system, PingFang SC, Hiragino Sans GB, sans-serif";
    ctx.fillText("/ 10", P + sw + 10, y + 72);
    y += 100;

    // ── Image ──
    const imgX = P;
    const imgY = y;
    const imgW = CW;
    const imgH = 420;

    if (imageDataUrl) {
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const i = new Image();
          i.onload = () => resolve(i);
          i.onerror = () => reject(new Error("load failed"));
          i.src = imageDataUrl;
        });
        ctx.save();
        drawRoundRect(ctx, imgX, imgY, imgW, imgH, 28);
        ctx.clip();
        drawImageCover(ctx, img, imgX, imgY, imgW, imgH);
        ctx.restore();
        ctx.strokeStyle = "#e8e0da";
        ctx.lineWidth = 1.5;
        drawRoundRect(ctx, imgX, imgY, imgW, imgH, 28);
        ctx.stroke();
      } catch {
        ctx.fillStyle = "#f2eee9";
        drawRoundRect(ctx, imgX, imgY, imgW, imgH, 28);
        ctx.fill();
        ctx.fillStyle = "#a1958e";
        ctx.font = "24px -apple-system, PingFang SC, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("图片加载失败", W / 2, imgY + imgH / 2);
        ctx.textAlign = "left";
      }
    } else {
      ctx.fillStyle = "#f2eee9";
      drawRoundRect(ctx, imgX, imgY, imgW, imgH, 28);
      ctx.fill();
      ctx.fillStyle = "#a1958e";
      ctx.font = "24px -apple-system, PingFang SC, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("暂无图片", W / 2, imgY + imgH / 2);
      ctx.textAlign = "left";
    }
    y = imgY + imgH + 32;

    // ── Summary ──
    ctx.fillStyle = "#514946";
    ctx.font = "390 30px -apple-system, PingFang SC, Hiragino Sans GB, sans-serif";
    const shortSummary = sharpComment.length > 100
      ? sharpComment.slice(0, 97) + "…"
      : sharpComment;
    y = drawWrappedText(ctx, shortSummary, P, y, CW, 44, 3) + 24;

    // ── Scene ──
    ctx.strokeStyle = "#e8e0da";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(P, y);
    ctx.lineTo(W - P, y);
    ctx.stroke();
    y += 32;

    ctx.fillStyle = "#9b6572";
    ctx.font = "650 16px -apple-system, PingFang SC, Hiragino Sans GB, sans-serif";
    ctx.fillText("适合场景", P, y);
    y += 28;

    ctx.fillStyle = "#5c534f";
    ctx.font = "430 26px -apple-system, PingFang SC, Hiragino Sans GB, sans-serif";
    const sceneText = result?.uiSummary?.bestScenario || "";
    ctx.fillText(sceneText.slice(0, 40), P, y);
    y += 40;

    // ── Styling RX ──
    if (shareRxItems.length > 0) {
      ctx.strokeStyle = "#e8e0da";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(P, y);
      ctx.lineTo(W - P, y);
      ctx.stroke();
      y += 32;

      ctx.fillStyle = "#9b6572";
      ctx.font = "650 16px -apple-system, PingFang SC, Hiragino Sans GB, sans-serif";
      ctx.fillText("造型处方", P, y);
      y += 32;

      shareRxItems.forEach((item, idx) => {
        const num = String(idx + 1).padStart(2, "0");
        ctx.fillStyle = "#9b6572";
        ctx.font = "520 22px -apple-system, PingFang SC, Hiragino Sans GB, sans-serif";
        ctx.fillText(num, P, y);
        ctx.fillText(item.label, P + 44, y);

        ctx.fillStyle = "#403936";
        ctx.font = "440 22px -apple-system, PingFang SC, Hiragino Sans GB, sans-serif";
        const value = item.value.length > 50 ? item.value.slice(0, 48) + "…" : item.value;
        const lw = ctx.measureText(item.label).width;
        y = drawWrappedText(ctx, value, P + 44 + lw + 12, y - 2, CW - lw - 56, 30, 2) + 20;
      });

      // Color direction
      if (shareColorDir) {
        y += 4;
        ctx.fillStyle = "#9b6572";
        ctx.font = "650 16px -apple-system, PingFang SC, Hiragino Sans GB, sans-serif";
        ctx.fillText("●  ●  ●  配色方向", P, y);
        y += 24;
        ctx.fillStyle = "#5c534f";
        ctx.font = "400 24px -apple-system, PingFang SC, Hiragino Sans GB, sans-serif";
        ctx.fillText(shareColorDir.slice(0, 40), P, y);
        y += 26;
      }
    }

    // ── URL ──
    ctx.fillStyle = "#c4bab6";
    ctx.font = "500 18px -apple-system, PingFang SC, Hiragino Sans GB, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("www.liubuliu.com.cn", W / 2, H - P);
    ctx.textAlign = "left";

    return canvas.toDataURL("image/png");
  }

  const handleDownloadShare = async () => {
    setShareError("");
    setGeneratedShareImage("");
    setIsGeneratingShare(true);

    try {
      const dataUrl = await generateShareImageCanvas(formData?.imageDataUrl);

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "liubuliu-fit-review.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "留不留｜FIT REVIEW",
            text: "我的衣服判断结果",
          });
        } catch {
          setGeneratedShareImage(dataUrl);
        }
      } else {
        setGeneratedShareImage(dataUrl);
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (!isMobile) {
          const link = document.createElement("a");
          link.download = "liubuliu-fit-review.png";
          link.href = dataUrl;
          link.click();
        }
      }
    } catch {
      setShareError("分享图生成失败，请稍后再试。");
    } finally {
      setIsGeneratingShare(false);
    }
  };

  useEffect(() => {
    const rawForm = localStorage.getItem("keepOrLetGoForm");
    const rawResult = localStorage.getItem("keepOrLetGoResult");

    try {
      if (rawForm) {
        const parsedForm = JSON.parse(rawForm);
        const normalizedForm = normalizeFormData(parsedForm);

        if (normalizedForm) {
          setFormData(normalizedForm);
        } else {
          localStorage.removeItem("keepOrLetGoForm");
        }
      }

      if (rawResult) {
        const parsedResult = JSON.parse(rawResult);
        if (isValidResult(parsedResult)) {
          setResult(parsedResult);
        } else {
          localStorage.removeItem("keepOrLetGoResult");
        }
      }
    } catch (error) {
      console.error("读取结果失败", error);
      localStorage.removeItem("keepOrLetGoResult");
    } finally {
      setLoaded(true);
    }
  }, []);

  if (!loaded) {
    return null;
  }

  if (!formData || !result) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.header}>
            <div className={styles.pageBadge}>判断报告</div>
            <h1 className={styles.title}>还没有生成判断结果</h1>
            <p className={styles.subtitle}>
              请先上传一张衣服图片，完成一次判断。结果生成后会显示在这里。
            </p>
          </div>

          <section className={styles.suggestCard}>
            <div className={styles.suggestionLabel}>暂无数据</div>
            <h2 className={styles.suggestionText}>暂无结果</h2>
            <p className={styles.suggestionDesc}>
              可能是还没有生成过判断，或浏览器本地结果已被清空。
            </p>

            <div className={styles.bottomButtonArea}>
              <button
                className={styles.primaryButton}
                onClick={() => router.push("/decision-helper?reset=1")}
              >
                开始判断一件衣服
              </button>
              <button className={styles.secondaryButton} onClick={() => router.push("/")}>
                返回首页
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const decisionLabel = normalizeDecisionLabel(result.decision.label);
  const primaryPlan = result.stylingPlans[0];
  const morePlans = result.stylingPlans.slice(1);
  const evidenceItems = getEvidenceItems(result, formData.intent, primaryPlan);
  const imageCheckWarning = getImageCheckWarning(result);
  const sharpScore = getSharpScore(result, decisionLabel);
  const scorePercent = getScorePercent(sharpScore);
  const scoreDisplay = formatScore10(sharpScore);
  const sharpComment = getSharpComment(result, decisionLabel, formData.intent);
  const sharpReason = getOneLineReason(result);
  const biggestProblem = getBiggestProblem(result);
  const keepConditions = getKeepConditions(result, primaryPlan);
  const dropReasons = getDropReasons(result);
  const reportNumber = getReportNumber();
  const itemTags = getItemTags(formData, result);
  const accessoryText = getAccessoryText(result, primaryPlan);
  const shareRxItems = getFilteredRxItems(formData.itemType, result, primaryPlan).slice(0, 3);
  const shareColorDir = getFormulaValue(result, "color", primaryPlan?.colorDirection || "");
  const shareRxIntro = (primaryPlan?.whyItWorks || "").slice(0, 80);





  if (shouldBlockForInvisibleTarget(result)) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.header}>
            <div className={styles.pageBadge}>图片信息不足</div>
            <h1 className={styles.title}>没有看清你要判断的单品</h1>
            <p className={styles.subtitle}>
              {imageCheckWarning || "请重新上传能看清目标单品的图片，或返回表单修改单品类型。"}
            </p>
          </div>

          <section className={styles.resultHeroGrid}>
            <div className={styles.suggestCard}>
              <div className={styles.suggestionLabel}>需要重新确认</div>
              <h2 className={styles.suggestionText}>图片信息不足</h2>
              <p className={styles.suggestionDesc}>
                你选择的是「{result.imageCheck?.selectedItemType || formData.itemType}」，
                但图片里没有清楚看到这个单品。为了避免误判，建议先修改图片或单品类型。
              </p>

              <div className={styles.bottomButtonArea}>
                <button className={styles.primaryButton} onClick={handleEditForm}>
                  修改单品类型
                </button>
                <button className={styles.secondaryButton} onClick={handleStartNew}>
                  重新上传图片
                </button>
              </div>
            </div>

            <div className={styles.imagePanel}>
              <div className={styles.imagePanelHeader}>
                <span>上传图片</span>
                <strong>目标单品不可见</strong>
              </div>

              <div className={styles.resultImageBox}>
                {formData.imageDataUrl ? (
                  <img
                    src={formData.imageDataUrl}
                    alt={formData.imageName || "上传的图片"}
                    className={styles.resultImage}
                  />
                ) : (
                  <div className={styles.noImageState}>没有读取到图片预览</div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.reportHeader}>
          <div>
            <span>留不留</span>
            <em>|</em>
            <span>FIT REVIEW</span>
          </div>
          <strong>{reportNumber}</strong>
        </header>

        <section className={styles.editorialVerdictCard}>
          <div className={styles.verdictAccentLine} />

          <div className={styles.verdictTopline}>
            <span>THE VERDICT</span>
            <button
  type="button"
  onClick={handleShare}
  disabled={isGeneratingShare}
  style={{
    minHeight: "34px",
    padding: "0 16px",
    border: "1px solid #e3cfd5",
    borderRadius: "999px",
    background: isGeneratingShare ? "#f1e3e7" : "#f8eef1",
    color: "#7e4b59",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.04em",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "none",
    cursor: isGeneratingShare ? "not-allowed" : "pointer",
    appearance: "none",
    WebkitAppearance: "none",
    whiteSpace: "nowrap",
    opacity: isGeneratingShare ? 0.64 : 1,
  }}
>
  {isGeneratingShare ? "生成中…" : "保存分享图"}
</button>
          </div>

          <div className={styles.verdictBody}>
            <h1>{getVerdictWord(decisionLabel, formData.intent)}</h1>
            <p>{sharpComment}</p>
          </div>

          <div className={styles.verdictScoreStrip}>
            <div className={styles.verdictScoreHeader}>
              <span>{getScoreTitle(formData.intent)}</span>
              <strong>{scoreDisplay}<em>/10</em></strong>
            </div>
            <div className={styles.verdictScoreTrack}>
              <div className={styles.verdictScoreFill} style={{ width: `${scorePercent}%` }} />
              <div className={styles.verdictScoreMarker} style={{ left: `${scorePercent}%` }} />
            </div>
            <p className={styles.verdictScoreHint}>{getScoreHint(formData.intent)}</p>
          </div>

          <div className={styles.verdictReasonBox}>
            <span>判断依据</span>
            <p>{sharpReason}。{biggestProblem}</p>
          </div>

          <div className={styles.verdictMetaLine}>
            <span>{getScenarioLabel(formData.intent)}</span>
            <strong>{result.uiSummary.bestScenario}</strong>
          </div>
        </section>

        <section className={styles.uploadEvidenceCard}>
          <div className={styles.uploadEvidenceHeader}>
            <div>
              <span>上传的单品</span>
              <strong>已分析</strong>
            </div>
            <em>{formData.itemType}</em>
          </div>

          <div className={styles.uploadImageFrame}>
            {formData.imageDataUrl ? (
              <img
                src={formData.imageDataUrl}
                alt={formData.imageName || "上传的衣服图片"}
                className={styles.uploadEvidenceImage}
              />
            ) : (
              <div className={styles.noImageState}>没有读取到图片预览</div>
            )}

            <div className={styles.imageOverlayPill}>
              {result.imageCheck?.visibleMainItem || formData.itemType}
            </div>
          </div>

          <div className={styles.itemTagRow}>
            {itemTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          {imageCheckWarning && (
            <div className={styles.warningBox}>
              <span>图片校正提示</span>
              <p>{imageCheckWarning}</p>
            </div>
          )}
        </section>

        {(() => {
  const rxItems = getFilteredRxItems(formData.itemType, result, primaryPlan);
  const hasRx = rxItems.length > 0 || primaryPlan;

  if (!hasRx) return null;

  return (
    <section className={styles.stylingRxCard}>
      <div className={styles.rxHeader}>
        <span>造型处方</span>
        <strong>STYLING RX</strong>
      </div>

      {primaryPlan?.whyItWorks && (
        <p className={styles.rxIntro}>{primaryPlan.whyItWorks}</p>
      )}

      <div className={styles.rxList}>
        {rxItems.map((item, index) => (
          <div key={index} className={styles.rxItem}>
            <em>{String(index + 1).padStart(2, "0")}</em>
            <div>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.rxColorNote}>
        <span className={styles.rxColorDots}>
          <span className={styles.rxColorDot} />
          <span className={styles.rxColorDot} />
          <span className={styles.rxColorDot} />
        </span>
        <span>配色方向</span>
        <p>{getFormulaValue(result, "color", primaryPlan?.colorDirection || "")}</p>
      </div>

      {morePlans.length > 0 && (
        <details className={styles.inlineDetails}>
          <summary>查看其他搭配方案</summary>
          <div className={styles.miniPlanList}>
            {morePlans.map((plan, index) => (
              <div key={index}>
                <strong>{plan.scenario}</strong>
                <p>{plan.outfit}</p>
                <span>
                  鞋包：{plan.shoesAndBag}；颜色：{plan.colorDirection}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
})()}

        <section className={styles.breakdownCard}>
          <div className={styles.breakdownHeader}>
            <span>详细分析</span>
            <strong>BREAKDOWN</strong>
          </div>

          <div className={styles.breakdownList}>
            <details className={styles.breakdownItem} open>
              <summary>
                <span>版型与廓形</span>
                <em>+</em>
              </summary>
              <p>{result.visualAnalysis?.silhouette || evidenceItems[1]?.detail}</p>
            </details>

            <details className={styles.breakdownItem}>
              <summary>
                <span>色彩适配</span>
                <em>+</em>
              </summary>
              <p>{result.visualAnalysis?.color || evidenceItems[0]?.detail}</p>
            </details>

            <details className={styles.breakdownItem}>
              <summary>
                <span>比例与材质</span>
                <em>+</em>
              </summary>
              <p>
                {[result.visualAnalysis?.proportion, result.visualAnalysis?.fabricAndDetails]
                  .filter(Boolean)
                  .join("；") || evidenceItems[2]?.detail}
              </p>
            </details>

            <details className={styles.breakdownItem}>
              <summary>
                <span>保留 / 放手条件</span>
                <em>+</em>
              </summary>
              <div className={styles.breakdownConditionGrid}>
                <div>
                  <strong>可以留</strong>
                  <ul>
                    {keepConditions.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>不建议留</strong>
                  <ul>
                    {dropReasons.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </details>

            <details className={styles.breakdownItem}>
              <summary>
                <span>替代购买方向</span>
                <em>+</em>
              </summary>
              <div className={styles.replacementList}>
                <strong>{result.replacementAdvice.title}</strong>
                <ul>
                  {result.replacementAdvice.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            </details>
          </div>
        </section>

        <section className={styles.feedbackCard}>
          <h3>这次评估对你有帮助吗？</h3>

          <div className={styles.feedbackButtons}>
            <button type="button" onClick={() => handleFeedback("有帮助")}>有帮助</button>
            <button type="button" onClick={() => handleFeedback("再想想")}>再想想</button>
            <button type="button" onClick={() => handleFeedback("没帮助")}>没帮助</button>
          </div>

          {feedback && <p className={styles.feedbackNote}>已记录：{feedback}。</p>}
        </section>

        <div className={styles.bottomButtonArea}>
          <button className={styles.primaryButton} onClick={handleStartNew}>
            再判断一件
          </button>
          <button className={styles.secondaryButton} onClick={handleEditForm}>
            修改表单重新判断
          </button>
          <button
            type="button"
            className={styles.bottomShareButton}
            onClick={handleShare}
            disabled={isGeneratingShare}
          >
            {isGeneratingShare ? "生成中…" : "保存分享图"}
          </button>
          <button className={styles.secondaryButton} onClick={() => router.push("/") }>
            返回首页
          </button>
        </div>

        {shareError && (
          <p className={styles.shareError}>{shareError}</p>
        )}

        {showShareModal && (
          <div
            className={styles.shareOverlay}
            onClick={handleCloseModal}
            role="dialog"
            aria-modal="true"
          >
            <div
              className={styles.shareModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.shareModalHeader}>
                <h2>分享结果图</h2>
                <button
                  className={styles.shareModalClose}
                  onClick={handleCloseModal}
                >
                  ✕
                </button>
              </div>

              <div
                ref={shareCardRef}
                className={styles.shareCard}
              >
                {/* Header */}
                <div className={styles.shareHeader}>
                  <span>留不留</span>
                  <strong>PERSONAL FIT REVIEW</strong>
                </div>

                {/* Verdict */}
                <h1 className={styles.shareVerdict}>
                  {getVerdictWord(decisionLabel, formData.intent)}
                </h1>

                {/* Score row */}
                <div className={styles.shareScoreRow}>
                  <span>{getScoreTitle(formData.intent)}</span>
                  <strong>{formatScore10(sharpScore)} <em>/ 10</em></strong>
                </div>

                {/* Image */}
                {formData.imageDataUrl && (
                  <div className={styles.shareImageFrame}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className={styles.shareImage}
                      src={formData.imageDataUrl}
                      alt=""
                      crossOrigin="anonymous"
                    />
                  </div>
                )}

                {/* Summary */}
                <p className={styles.shareSummary}>
                  {sharpComment}
                </p>

                {/* Scene */}
                <div className={styles.shareScene}>
                  <span>适合场景</span>
                  <strong>{result.uiSummary.bestScenario}</strong>
                </div>

                {/* Styling RX */}
                {(shareRxItems.length > 0 || shareRxIntro) && (
                  <div className={styles.shareRxSection}>
                    <div className={styles.shareRxHeader}>
                      <span>造型处方</span>
                      <strong>STYLING RX</strong>
                    </div>

                    {shareRxIntro && (
                      <p className={styles.shareRxIntro}>{shareRxIntro}</p>
                    )}

                    {shareRxItems.map((item, idx) => (
                      <div key={idx} className={styles.shareRxItem}>
                        <em>{String(idx + 1).padStart(2, "0")}</em>
                        <div>
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </div>
                      </div>
                    ))}

                    {shareColorDir && (
                      <div className={styles.shareRxColor}>
                        <span className={styles.shareRxColorDots}>
                          <span /><span /><span />
                        </span>
                        <span>配色方向</span>
                        <p>{shareColorDir}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
                <p
  style={{
    margin: "28px 0 0",
    color: "#a1958e",
    fontSize: "13px",
    fontWeight: 600,
    letterSpacing: "0.16em",
    textAlign: "center",
  }}
>
  www.liubuliu.com.cn
</p>
              </div>

              {generatedShareImage ? (
                <div className={styles.sharePreviewFallback}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className={styles.sharePreviewImage}
                    src={generatedShareImage}
                    alt="分享图预览"
                  />
                  <p className={styles.sharePreviewHint}>
                    长按图片保存，或使用浏览器分享按钮发送给朋友。
                  </p>
                  <button
                    type="button"
                    className={styles.sharePreviewClose}
                    onClick={handleCloseModal}
                  >
                    关闭
                  </button>
                </div>
              ) : (
                <div className={styles.shareModalActions}>
                  <button
                    type="button"
                    className={styles.shareDownloadButton}
                    onClick={handleDownloadShare}
                    disabled={isGeneratingShare}
                  >
                    {isGeneratingShare ? "生成中…" : "分享 / 保存图片"}
                  </button>
                  <button
                    type="button"
                    className={styles.shareCloseButton}
                    onClick={handleCloseModal}
                  >
                    关闭
                  </button>
                </div>
              )}

              {shareError && (
                <p className={styles.shareError}>{shareError}</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}