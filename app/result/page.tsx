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

type EvaluationResult = {
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
  itemType: string;
  concern: string;
  feeling: string;
  similarItems: string;
  scenario: string;
  note: string;
  imageName?: string;
  imageDataUrl?: string;
};

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

function isValidForm(value: unknown): value is FormData {
  return (
    isRecord(value) &&
    typeof value.itemType === "string" &&
    typeof value.concern === "string" &&
    typeof value.feeling === "string" &&
    typeof value.similarItems === "string" &&
    typeof value.scenario === "string" &&
    typeof value.note === "string"
  );
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

function getDecisionTone(label: DecisionLabel) {
  if (label === "建议放手") return "偏向不留";
  if (label === "再观察") return "中立观察";
  if (label === "有条件留下") return "有条件保留";
  return "值得留下";
}

function clampScore(score: number) {
  return Math.max(1, Math.min(5, Math.round(score)));
}

function getFallbackRatings(
  formData: FormData,
  result: EvaluationResult
): RatingItem[] {
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

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.summaryItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
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

export default function Result() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const rawForm = localStorage.getItem("keepOrLetGoForm");
    const rawResult = localStorage.getItem("keepOrLetGoResult");

    try {
      if (rawForm) {
        const parsedForm = JSON.parse(rawForm);
        if (isValidForm(parsedForm)) {
          setFormData(parsedForm);
        }
      }

      if (rawResult) {
        const parsedResult = JSON.parse(rawResult);
        if (isValidResult(parsedResult)) {
          setResult(parsedResult);
        }
      }
    } catch (error) {
      console.error("解析结果页 localStorage 失败", error);
    }

    setLoaded(true);
  }, []);

  if (!loaded) {
    return null;
  }

  if (!formData || !result) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <div className={styles.header}>
            <div className={styles.pageBadge}>Result · 判断报告</div>
            <h1 className={styles.title}>还没有判断结果</h1>
            <p className={styles.subtitle}>请先上传衣服图片并完成一次判断。</p>
          </div>

          <section className={styles.suggestCard}>
            <div className={styles.suggestionLabel}>Empty State</div>
            <h2 className={styles.suggestionText}>先去判断一件衣服</h2>
            <p className={styles.suggestionDesc}>
              完成图片上传和表单选择后，这里会展示完整的留 / 不留判断报告。
            </p>
            <div className={styles.buttonArea}>
              <button
                type="button"
                className={styles.submitButton}
                onClick={() => router.push("/decision-helper")}
              >
                去填写表单
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const decisionLabel = normalizeDecisionLabel(result.decision.label);
  const ratings =
    result.ratings && result.ratings.length > 0
      ? result.ratings
      : getFallbackRatings(formData, result);

  const visualItems = [
    {
      label: "颜色",
      value:
        result.visualAnalysis?.color ||
        "暂未返回独立颜色分析。可以重新生成一次，让 AI 更具体地判断颜色。",
    },
    {
      label: "版型轮廓",
      value:
        result.visualAnalysis?.silhouette ||
        "暂未返回独立版型分析。可以结合最终判断和搭配建议参考。",
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

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.pageBadge}>Result · 判断报告</div>
          <h1 className={styles.title}>你的留 / 不留建议</h1>
          <p className={styles.subtitle}>
            结合上传图片和你的真实感受，判断它是否值得占据衣橱位置。
          </p>
        </div>

        <section className={styles.resultHeroGrid}>
          <div className={styles.imagePanel}>
            <div className={styles.imagePanelHeader}>
              <span>Uploaded Item</span>
              <strong>AI 已参考图片</strong>
            </div>

            <div className={styles.resultImageBox}>
              {formData.imageDataUrl ? (
                <img
                  src={formData.imageDataUrl}
                  alt={formData.imageName || "上传的衣服图片"}
                  className={styles.resultImage}
                />
              ) : (
                <div className={styles.noImageState}>没有读取到图片预览</div>
              )}
            </div>

            <div className={styles.formChips}>
              <span>{formData.itemType}</span>
              <span>{formData.scenario}</span>
              <span>{formData.concern}</span>
            </div>
          </div>

          <div className={styles.suggestCard}>
            <div className={styles.suggestionLabel}>最终倾向</div>
            <h2 className={styles.suggestionText}>{decisionLabel}</h2>
            <p className={styles.suggestionDesc}>{result.decision.headline}</p>

            <div className={styles.heroMetaGrid}>
              <div>
                <span>第一感受</span>
                <strong>{formData.feeling}</strong>
              </div>
              <div>
                <span>类似单品</span>
                <strong>{formData.similarItems}</strong>
              </div>
              <div>
                <span>主要场景</span>
                <strong>{formData.scenario}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.spectrumSection}>
          <div className={styles.spectrumHeader}>
            <div>
              <h3>留 / 不留光谱</h3>
              <p>{getDecisionTone(decisionLabel)}</p>
            </div>
            <strong>{decisionLabel}</strong>
          </div>

          <div className={styles.spectrumTrack}>
            <div
              className={styles.spectrumMarker}
              style={{ left: getDecisionPosition(decisionLabel) }}
            />
          </div>

          <div className={styles.spectrumLabels}>
            <span>建议放手</span>
            <span>再观察</span>
            <span>有条件留下</span>
            <span>值得留下</span>
          </div>

          <div className={styles.summaryGrid}>
            <SummaryItem label="保留价值" value={result.uiSummary.retentionValue} />
            <SummaryItem label="闲置风险" value={result.uiSummary.idleRisk} />
            <SummaryItem label="搭配门槛" value={result.uiSummary.stylingDifficulty} />
            <SummaryItem label="适合场景" value={result.uiSummary.bestScenario} />
          </div>
        </section>

        <section className={styles.analysisSection}>
          <div className={styles.analysisCard}>
            <h3 className={styles.analysisTitle}>为什么是这个结论</h3>
            <p className={styles.adviceText}>{result.decision.reason}</p>
          </div>
        </section>

        <section className={styles.analysisSection}>
          <div className={styles.analysisCard}>
            <h3 className={styles.analysisTitle}>图片观察</h3>
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
        </section>

        <section className={styles.analysisSection}>
          <div className={styles.analysisCard}>
            <h3 className={styles.analysisTitle}>维度评分</h3>
            <div className={styles.ratingGrid}>
              {ratings.map((item) => (
                <RatingCard key={item.label} item={item} />
              ))}
            </div>
          </div>
        </section>

        <section className={styles.twoColumnSection}>
          <div className={styles.analysisCard}>
            <h3 className={styles.analysisTitle}>留它的理由</h3>
            <ul className={styles.analysisList}>
              {result.keepReasons.map((reason, index) => (
                <li key={index}>
                  <strong>{reason.title}：</strong>
                  {reason.detail}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.analysisCard}>
            <h3 className={styles.analysisTitle}>不留的风险</h3>
            <ul className={styles.analysisList}>
              {result.riskReasons.map((reason, index) => (
                <li key={index}>
                  <strong>{reason.title}：</strong>
                  {reason.detail}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.analysisSection}>
          <div className={styles.analysisCard}>
            <h3 className={styles.analysisTitle}>搭配方案</h3>
            <div className={styles.stylingGrid}>
              {result.stylingPlans.map((plan, index) => (
                <div key={index} className={styles.stylingCard}>
                  <div className={styles.stylingCardHeader}>
                    <strong>{plan.scenario}</strong>
                    <span>核心建议</span>
                  </div>

                  <p className={styles.outfitText}>{plan.outfit}</p>

                  <div className={styles.stylingTags}>
                    <span>鞋包：{plan.shoesAndBag}</span>
                    <span>颜色：{plan.colorDirection}</span>
                  </div>

                  <p className={styles.avoidText}>避免：{plan.avoid}</p>
                  <p className={styles.whyText}>{plan.whyItWorks}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.analysisSection}>
          <div className={styles.finalAdviceCard}>
            <h3 className={styles.analysisTitle}>{result.replacementAdvice.title}</h3>
            <ul className={styles.analysisList}>
              {result.replacementAdvice.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.analysisSection}>
          <div className={styles.analysisCard}>
            <h3 className={styles.analysisTitle}>最终建议</h3>
            <p className={styles.adviceText}>{result.finalNote}</p>
          </div>
        </section>

        <section className={styles.feedbackCard}>
          <h3>这个判断对你有帮助吗？</h3>
          <div className={styles.feedbackButtons}>
            <button type="button">有帮助！</button>
            <button type="button">还是很纠结</button>
            <button type="button">根本没帮助</button>
          </div>
        </section>

        <div className={styles.bottomButtonArea}>
          <button
            className={styles.primaryButton}
            onClick={() => router.push("/decision-helper")}
          >
            再判断一件
          </button>
          <button
            className={styles.secondaryButton}
            onClick={() => router.push("/decision-helper")}
          >
            重新编辑信息
          </button>
          <button className={styles.secondaryButton} onClick={() => router.push("/")}>
            返回首页
          </button>
        </div>
      </main>
    </div>
  );
}