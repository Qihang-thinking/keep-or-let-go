"use client";

import { useEffect, useState } from "react";
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
  if (label === "建议放手") return "15%";
  if (label === "再观察") return "45%";
  if (label === "有条件留下") return "68%";
  return "88%";
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
  const resultCopy = getIntentCopy(formData.intent);
  const primaryPlan = result.stylingPlans[0];
  const morePlans = result.stylingPlans.slice(1);
    const heroDecisionLabel = getHeroDecisionLabel(decisionLabel, formData.intent, primaryPlan);
  const heroDescription = getHeroDescription(result, formData.intent, primaryPlan);
  const evidenceItems = getEvidenceItems(result, formData.intent, primaryPlan);
  const imageCheckWarning = getImageCheckWarning(result);
  const sharpScore = getSharpScore(result, decisionLabel);
  const sharpComment = getSharpComment(result, decisionLabel, formData.intent);
  const sharpReason = getOneLineReason(result);
  const biggestProblem = getBiggestProblem(result);
  const keepConditions = getKeepConditions(result, primaryPlan);
  const dropReasons = getDropReasons(result);




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
        <section className={styles.decisionCard}>
          <div className={styles.decisionTopline}>
            <span>{resultCopy.heroEyebrow}</span>
            <strong>
              {formData.itemType} · {resultCopy.pageTitle}
            </strong>
          </div>

              <div className={styles.decisionHero}>
            <div>
              <h1>{heroDecisionLabel}</h1>
              <p>{heroDescription}</p>
            </div>

            <div className={styles.sharpScoreBox}>
  <div className={styles.scoreHeaderLine}>
    <span>真实评分</span>
    <strong>
      {formatSharpScore(sharpScore)}
      <em>/ 10</em>
    </strong>
  </div>

  <div className={styles.scoreSpectrumWrap}>
  <div
    className={styles.scoreSpectrum}
    style={
      {
        "--score-percent": `${Math.max(0, Math.min(10, sharpScore)) * 10}%`,
      } as React.CSSProperties
    }
    aria-hidden="true"
  >
    <div
      className={styles.scoreSpectrumMarker}
      style={{ left: `${Math.max(0, Math.min(10, sharpScore)) * 10}%` }}
    />
  </div>

  <div className={styles.scoreSpectrumLabels}>
    <span>放手</span>
    <span>观察</span>
    <span>可留</span>
    <span>高分</span>
  </div>
</div>
</div>
          </div>

                    <div className={styles.sharpVerdictBox}>
            <span>真实判断</span>
            <strong>{sharpComment}</strong>

            <div className={styles.sharpVerdictPoints}>
              <p>
                <em>为什么：</em>
                {sharpReason}
              </p>
              <p>
                <em>短板：</em>
                {biggestProblem}
              </p>
            </div>
          </div>

                    <div className={styles.conditionGrid}>
            <div className={styles.conditionBlock}>
              <span>可以留的前提</span>
              <ul>
                {keepConditions.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className={styles.conditionBlock}>
              <span>不该留的理由</span>
              <ul>
                {dropReasons.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className={styles.evidenceCard}>
          <div className={styles.evidenceImageWrap}>
            {formData.imageDataUrl ? (
              <img
                src={formData.imageDataUrl}
                alt={formData.imageName || "上传的衣服图片"}
                className={styles.evidenceImage}
              />
            ) : (
              <div className={styles.noImageState}>没有读取到图片预览</div>
            )}
          </div>

          <div className={styles.evidenceContent}>
            <div className={styles.evidenceMeta}>
  <h3>{resultCopy.evidenceTitle}</h3>
  <p>基于图片里的版型、比例、颜色和材质</p>
  <span>{formData.itemType}</span>
</div>

            <div className={styles.evidenceList}>
              {evidenceItems.map((item) => (
                <div key={item.title} className={styles.evidenceItem}>
                  <span>{item.title}</span>
                  <p>{item.detail}</p>
                </div>
              ))}
            </div>

            {imageCheckWarning && (
              <div className={styles.warningBox}>
                <span>图片校正提示</span>
                <p>{imageCheckWarning}</p>
              </div>
            )}
          </div>
        </section>

        {primaryPlan && (
          <section className={styles.analysisSection}>
            <div className={`${styles.analysisCard} ${styles.primaryStylingCard}`}>
              <div className={styles.sectionTitleRow}>
                <h3 className={styles.analysisTitle}>怎么搭配</h3>
              </div>

              {primaryPlan.whyItWorks && (
                <p className={styles.stylingHighlight}>{primaryPlan.whyItWorks}</p>
              )}

                            <div className={styles.stylingGrid}>
                <div>
                  <span>内搭</span>
                  <strong>{getFormulaValue(result, "inner", primaryPlan.outfit)}</strong>
                </div>

                <div>
                  <span>下装</span>
                  <strong>{getFormulaValue(result, "bottom", primaryPlan.outfit)}</strong>
                </div>

                <div>
                  <span>鞋子</span>
                  <strong>{getFormulaValue(result, "shoes", primaryPlan.shoesAndBag)}</strong>
                </div>

                <div>
                  <span>包包</span>
                  <strong>{getFormulaValue(result, "bag", primaryPlan.shoesAndBag)}</strong>
                </div>

                <div>
                  <span>配色</span>
                  <strong>{getFormulaValue(result, "color", primaryPlan.colorDirection)}</strong>
                </div>

                <div className={styles.avoidItem}>
                  <span>避雷</span>
                  <strong>{getFormulaValue(result, "avoid", primaryPlan.avoid)}</strong>
                </div>
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
            </div>
          </section>
        )}

        <section className={styles.detailSection}>
          <div className={styles.detailHeader}>
            <h3>替代方向</h3>
          </div>

          <div className={styles.compactReasonGroup}>
            <h4>{result.replacementAdvice.title}</h4>
            <ul className={styles.analysisList}>
              {result.replacementAdvice.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.feedbackCard}>
          <h3>这个判断对你有帮助吗？</h3>

          <div className={styles.feedbackButtons}>
            <button type="button" onClick={() => handleFeedback("有帮助")}>
              有帮助！
            </button>
            <button type="button" onClick={() => handleFeedback("还是很纠结")}>
              还是很纠结
            </button>
            <button type="button" onClick={() => handleFeedback("没帮助")}>
              根本没帮助
            </button>
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
          <button className={styles.secondaryButton} onClick={() => router.push("/")}>
            返回首页
          </button>
        </div>
      </main>
    </div>
  );
}