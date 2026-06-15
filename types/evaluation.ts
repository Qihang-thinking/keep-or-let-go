export type DecisionLabel = "建议放手" | "再观察" | "有条件留下" | "值得留下";

export type EvidenceSource = "form";

export type EvaluationResult = {
  decision: {
    label: DecisionLabel;
    headline: string;
    reason: string;
  };

  uiSummary: {
    retentionValue: "高" | "中高" | "中" | "低";
    idleRisk: "高" | "中" | "低";
    stylingDifficulty: "高" | "中" | "低";
    bestScenario: string;
  };

  visualAnalysis: {
    imageQuality: "清晰" | "一般" | "较差";
    garmentFeatures: string[];
    fitAndProportion: string[];
    colorAndTexture: string[];
    styleKeywords: string[];
    uncertainty: string[];
  };

  keepReasons: {
    title: string;
    detail: string;
    evidence: EvidenceSource;
  }[];

  riskReasons: {
    title: string;
    detail: string;
    evidence: EvidenceSource;
  }[];

  stylingPlans: {
    scenario: string;
    outfit: string;
    shoesAndBag: string;
    colorDirection: string;
    avoid: string;
    whyItWorks: string;
  }[];

  replacementAdvice: {
    title: string;
    suggestions: string[];
  };

  finalNote: string;
};
