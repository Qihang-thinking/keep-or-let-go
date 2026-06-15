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
  uiSummary: {
    retentionValue: string;
    idleRisk: string;
    stylingDifficulty: string;
    bestScenario: string;
  };
  visualAnalysis?: VisualAnalysis;
  ratings?: RatingItem[];
  keepReasons: ReasonItem[];
  riskReasons: ReasonItem[];
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
    Array.isArray(value.keepReasons) &&
    Array.isArray(value.riskReasons) &&
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
  const firstKeep = result.keepReasons[0];
  const secondKeep = result.keepReasons[1];
  const firstRisk = result.riskReasons[0];

  const visualShape =
    result.visualAnalysis?.silhouette ||
    result.visualAnalysis?.proportion ||
    result.visualAnalysis?.fabricAndDetails ||
    "";

  if (intent?.includes("怎么搭")) {
  return [
    {
      title: "风格方向",
      detail: primaryPlan?.whyItWorks || result.decision.headline || "整体更适合走一个明确风格方向。",
    },
    {
      title: "视觉重心",
      detail:
        result.visualAnalysis?.proportion ||
        result.visualAnalysis?.silhouette ||
        "重点是让上半身露肤、裙长和鞋型保持轻盈。",
    },
    {
      title: "搭配风险",
      detail: primaryPlan?.avoid || firstRisk?.detail || "避免用风格冲突的单品削弱它的优势。",
    },
  ];
}

  if (intent?.includes("适不适合")) {
    return [
      {
        title: "适合你的地方",
        detail: firstKeep?.detail || result.decision.headline,
      },
      {
        title: "适配风险",
        detail: firstRisk?.detail || result.decision.reason,
      },
      {
        title: "版型与材质观察",
        detail: visualShape || secondKeep?.detail || "需要结合版型、比例和材质判断整体适配度。",
      },
    ];
  }

  return [
    {
      title: "单品亮点",
      detail: firstKeep?.detail || result.decision.headline,
    },
    {
      title: "潜在短板",
      detail: firstRisk?.detail || result.decision.reason,
    },
    {
      title: "版型与材质观察",
      detail: visualShape || secondKeep?.detail || "需要结合版型、比例和材质判断真实利用率。",
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
  const displayDecisionLabel = getDisplayDecisionLabel(decisionLabel, formData.intent);
  const heroDecisionLabel = getHeroDecisionLabel(decisionLabel, formData.intent, primaryPlan);
  const heroDescription = getHeroDescription(result, formData.intent, primaryPlan);
  const spectrumTone = getSpectrumTone(decisionLabel, formData.intent);
  const mainMetrics = getMainMetrics(result, formData.intent, decisionLabel, primaryPlan);
  const evidenceItems = getEvidenceItems(result, formData.intent, primaryPlan);
  const imageCheckWarning = getImageCheckWarning(result);

  const ratings =
    result.ratings && result.ratings.length > 0
      ? result.ratings
      : getFallbackRatings(formData, result);

  const visualItems = [
    {
      label: "颜色",
      value:
        result.visualAnalysis?.color ||
        "暂未返回独立颜色分析。可以重新生成一次，让 AI 更关注颜色和肤色适配。",
    },
    {
      label: "版型轮廓",
      value:
        result.visualAnalysis?.silhouette ||
        "暂未返回独立版型分析。可以重新生成一次，让 AI 更关注肩线、腰线和长度。",
    },
    {
      label: "比例效果",
      value:
        result.visualAnalysis?.proportion ||
        "暂未返回独立比例分析。可以重新生成一次，让 AI 更关注腰线、长度和视觉重心。",
    },
    {
      label: "材质细节",
      value:
        result.visualAnalysis?.fabricAndDetails ||
        result.visualAnalysis?.stylingPotential ||
        result.visualAnalysis?.imageQuality ||
        "暂未返回独立材质细节分析。图片清晰度会影响判断。",
    },
  ];

  const topKeepReasons = result.keepReasons.slice(0, 2);
  const topRiskReasons = result.riskReasons.slice(0, 2);

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
            <h1>{heroDecisionLabel}</h1>
            <p>{heroDescription}</p>
          </div>

          <p className={styles.finalNote}>{result.finalNote}</p>

          <div className={styles.compactSpectrum}>
            <div className={styles.compactSpectrumHeader}>
              <span>{resultCopy.spectrumTitle}</span>
              <strong>{spectrumTone}</strong>
            </div>

            <div className={styles.spectrumTrack}>
              <div
                className={styles.spectrumMarker}
                style={{ left: getDecisionPosition(decisionLabel) }}
              />
            </div>

            <div className={styles.spectrumEndpoints}>
              <span>{resultCopy.spectrumLabels[0]}</span>
              <span>{displayDecisionLabel}</span>
              <span>{resultCopy.spectrumLabels[resultCopy.spectrumLabels.length - 1]}</span>
            </div>
          </div>

          <div className={styles.metricGrid}>
            {mainMetrics.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>

          <div className={styles.scenarioBlock}>
            <span>{getScenarioLabel(formData.intent)}</span>
            <strong>
  {formatDisplayText(result.uiSummary.bestScenario || primaryPlan?.scenario) || "暂无明确场景"}
</strong>
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
  <span>
    {resultCopy.evidenceTitle} · {formData.itemType}
  </span>
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
                  <span>场景</span>
                  <strong>{primaryPlan.scenario}</strong>
                </div>

                <div>
                  <span>搭配</span>
                  <strong>{primaryPlan.outfit}</strong>
                </div>

                <div>
                  <span>鞋包</span>
                  <strong>{primaryPlan.shoesAndBag}</strong>
                </div>

                <div>
                  <span>配色</span>
                  <strong>{primaryPlan.colorDirection}</strong>
                </div>

                <div className={styles.avoidItem}>
                  <span>避雷</span>
                  <strong>{primaryPlan.avoid}</strong>
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
            <h3>{resultCopy.detailTitle}</h3>
          </div>

          <div className={styles.detailAccordion}>
            <details className={styles.detailItem}>
              <summary>
                <span className={styles.detailIcon}>图</span>
                <span className={styles.detailTextGroup}>
                  <strong>图片观察</strong>
                  <em>颜色、版型、比例和材质</em>
                </span>
                <span className={styles.detailToggle} aria-hidden="true">
                  <span className={styles.togglePlus}>+</span>
                  <span className={styles.toggleMinus}>−</span>
                </span>
              </summary>

              <div className={styles.detailItemBody}>
                <div className={styles.visualGrid}>
                  {visualItems.map((item) => (
                    <div key={item.label} className={styles.visualItem}>
                      <span>{item.label}</span>
                      <p>{item.value}</p>
                    </div>
                  ))}
                </div>
                <p className={styles.sourceNote}>判断来源：上传图片 + 表单信息</p>
              </div>
            </details>

            <details className={styles.detailItem}>
              <summary>
                <span className={styles.detailIcon}>评</span>
                <span className={styles.detailTextGroup}>
                  <strong>维度评分</strong>
                  <em>5 个维度的具体分数</em>
                </span>
                <span className={styles.detailToggle} aria-hidden="true">
                  <span className={styles.togglePlus}>+</span>
                  <span className={styles.toggleMinus}>−</span>
                </span>
              </summary>

              <div className={styles.detailItemBody}>
                <div className={styles.ratingGrid}>
                  {ratings.map((item) => (
                    <RatingCard key={item.label} item={item} />
                  ))}
                </div>
              </div>
            </details>

            <details className={styles.detailItem}>
              <summary>
                <span className={styles.detailIcon}>析</span>
                <span className={styles.detailTextGroup}>
                  <strong>单品亮点与风险</strong>
                  <em>客观拆解这件衣服的优势和短板</em>
                </span>
                <span className={styles.detailToggle} aria-hidden="true">
                  <span className={styles.togglePlus}>+</span>
                  <span className={styles.toggleMinus}>−</span>
                </span>
              </summary>

              <div className={styles.detailItemBody}>
                <div className={styles.reasonCompareGrid}>
                  <div className={styles.compactReasonGroup}>
                    <h4>单品亮点</h4>
                    <ul className={styles.analysisList}>
                      {topKeepReasons.map((reason, index) => (
                        <li key={index}>
                          <strong>{reason.title}：</strong>
                          {reason.detail}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={styles.compactReasonGroup}>
                    <h4>潜在风险</h4>
                    <ul className={styles.analysisList}>
                      {topRiskReasons.map((reason, index) => (
                        <li key={index}>
                          <strong>{reason.title}：</strong>
                          {reason.detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </details>

            <details className={styles.detailItem}>
              <summary>
                <span className={styles.detailIcon}>替</span>
                <span className={styles.detailTextGroup}>
                  <strong>替代方向</strong>
                  <em>如果放手，可以找什么</em>
                </span>
                <span className={styles.detailToggle} aria-hidden="true">
                  <span className={styles.togglePlus}>+</span>
                  <span className={styles.toggleMinus}>−</span>
                </span>
              </summary>

              <div className={styles.detailItemBody}>
                <div className={styles.compactReasonGroup}>
                  <h4>{result.replacementAdvice.title}</h4>
                  <ul className={styles.analysisList}>
                    {result.replacementAdvice.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </details>
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