"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import styles from "./page.module.css";

const intentOptions = [
  "要不要留下 / 退掉",
  "这件适不适合我",
  "这件应该怎么搭",
];

const itemTypeOptions = [
  "上衣",
  "裤子",
  "半裙",
  "连衣裙",
  "外套",
  "鞋子",
  "包包",
  "其他",
];

const concernOptions = [
  "显胖显矮",
  "不好搭",
  "不够日常",
  "性价比纠结",
  "风格不确定",
  "舍不得但很少穿",
];

const feelingOptions = ["很喜欢", "还不错", "说不上来", "有点别扭", "明显不舒服"];

const similarItemsOptions = ["没有", "有一两件", "有很多", "不确定"];

const scenarioOptions = [
  "日常出门",
  "通勤",
  "约会聚会",
  "旅行拍照",
  "运动休闲",
  "特殊场合",
];

const priceFeelingOptions = [
  "不考虑价格",
  "觉得很值",
  "可以接受",
  "有点贵",
  "明显不值",
  "不记得价格",
];

type SavedForm = {
  intent?: string;
  itemType?: string;
  concern?: string;
  feeling?: string;
  similarItems?: string;
  scenario?: string;
  priceFeeling?: string;
  note?: string;
  imageName?: string;
  imageDataUrl?: string;
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      try {
        const maxSize = 1280;
        const scale = Math.min(
          1,
          maxSize / image.width,
          maxSize / image.height
        );

        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("图片压缩失败");
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.72);

        URL.revokeObjectURL(objectUrl);
        resolve(compressedDataUrl);
      } catch {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("图片读取失败"));
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("图片读取失败"));
    };

    image.src = objectUrl;
  });
}

function getCleanValue(value?: string) {
  if (!value || value === "未填写") return "";
  return value;
}

function getScenarioValues(value?: string) {
  const cleanValue = getCleanValue(value);

  if (!cleanValue) return [];

  return cleanValue
    .split("、")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function DecisionHelper() {
  const [intent, setIntent] = useState("");
  const [itemType, setItemType] = useState("");
  const [concern, setConcern] = useState("");
  const [feeling, setFeeling] = useState("");
  const [similarItems, setSimilarItems] = useState("");
  const [scenarios, setScenarios] = useState<string[]>([]);
  const [priceFeeling, setPriceFeeling] = useState("");
  const [note, setNote] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [savedImageDataUrl, setSavedImageDataUrl] = useState("");
  const [savedImageName, setSavedImageName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optionalOpen, setOptionalOpen] = useState(false);

  const activePreviewUrl = previewUrl || savedImageDataUrl;
  const activeImageName = image?.name || savedImageName;
  const hasImage = Boolean(image || savedImageDataUrl);
  const isFormComplete = Boolean(intent && itemType && hasImage);

  useEffect(() => {
    const shouldReset =
      new URLSearchParams(window.location.search).get("reset") === "1";

    if (shouldReset) {
      localStorage.removeItem("keepOrLetGoForm");
      localStorage.removeItem("keepOrLetGoResult");
      localStorage.removeItem("keepOrLetGoFeedback");
      window.history.replaceState(null, "", "/decision-helper");
      return;
    }

    const rawForm = localStorage.getItem("keepOrLetGoForm");

    if (!rawForm) return;

    try {
      const savedForm = JSON.parse(rawForm) as SavedForm;
      const restoredScenarios = getScenarioValues(savedForm.scenario);

      setIntent(getCleanValue(savedForm.intent));
      setItemType(getCleanValue(savedForm.itemType));
      setConcern(getCleanValue(savedForm.concern));
      setFeeling(getCleanValue(savedForm.feeling));
      setSimilarItems(getCleanValue(savedForm.similarItems));
      setScenarios(restoredScenarios);
      setPriceFeeling(getCleanValue(savedForm.priceFeeling));
      setNote(getCleanValue(savedForm.note));
      setSavedImageDataUrl(savedForm.imageDataUrl || "");
      setSavedImageName(savedForm.imageName || "");

      if (
        getCleanValue(savedForm.concern) ||
        getCleanValue(savedForm.feeling) ||
        getCleanValue(savedForm.similarItems) ||
        restoredScenarios.length > 0 ||
        getCleanValue(savedForm.priceFeeling) ||
        getCleanValue(savedForm.note)
      ) {
        setOptionalOpen(true);
      }
    } catch (error) {
      console.error("恢复表单失败", error);
    }
  }, []);

  useEffect(() => {
    if (!image) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(image);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  const clearError = () => {
    if (error) setError("");
  };

  const getFriendlyErrorMessage = (message: string) => {
    if (message.includes("图片读取失败")) {
      return "图片读取失败，请重新选择一张图片。";
    }

    if (message.includes("图片格式")) {
      return "这个文件看起来不是图片格式，请换一张 JPG、PNG 或 HEIC 图片。";
    }

    if (message.includes("请求超时") || message.includes("AbortError")) {
      return "这次生成时间太久了，可能是网络波动或图片较大。请稍后重试，或换一张更清晰、体积更小的图片。";
    }

    if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
      return "网络连接不稳定，暂时没有成功生成。请检查网络后重新试一次。";
    }

    if (
      message.includes("Kimi") ||
      message.includes("API") ||
      message.includes("JSON") ||
      message.includes("结果结构") ||
      message.includes("temperature") ||
      message.includes("reasoning_content")
    ) {
      return "这次没有成功生成判断，可能是模型返回异常或图片较难识别。请重新生成一次，或换一张更清晰的图片。";
    }

    return "这次没有成功生成判断，请稍后重新试一次。";
  };

  const toggleScenario = (value: string) => {
    setScenarios((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );

    clearError();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setImage(null);
      setSavedImageDataUrl("");
      setSavedImageName("");
      setError("图片格式不支持，请选择一张图片文件。");
      e.target.value = "";
      return;
    }

    const maxSizeInMB = 5;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    if (selectedFile.size > maxSizeInBytes) {
      setError(`图片太大了，请选择 ${maxSizeInMB}MB 以内的图片。`);
      e.target.value = "";
      return;
    }

    setImage(selectedFile);
    setSavedImageDataUrl("");
    setSavedImageName("");
    localStorage.removeItem("keepOrLetGoResult");
    clearError();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!hasImage) {
      setError("请先上传一张衣服图片或试穿图。");
      return;
    }

    if (!intent || !itemType) {
      setError("请先选择判断目的和单品类型。");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const imageDataUrl = image ? await fileToDataUrl(image) : savedImageDataUrl;

      if (!imageDataUrl) {
        throw new Error("图片读取失败");
      }

      const payload = {
        intent,
        itemType,
        concern: concern || "未填写",
        feeling: feeling || "未填写",
        similarItems: similarItems || "未填写",
        scenario: scenarios.length > 0 ? scenarios.join("、") : "未填写",
        priceFeeling: priceFeeling || "未填写",
        note,
        imageName: image?.name || savedImageName || "",
        imageDataUrl,
      };

      localStorage.setItem("keepOrLetGoForm", JSON.stringify(payload));
      localStorage.removeItem("keepOrLetGoResult");

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 60000);

      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }).finally(() => window.clearTimeout(timeoutId));

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "API 请求失败");
      }

      const result = await response.json();

      if (!result?.decision || !result?.uiSummary || !result?.stylingPlans) {
        throw new Error("结果结构异常");
      }

      localStorage.setItem("keepOrLetGoResult", JSON.stringify(result));
      window.location.href = "/result";
    } catch (e) {
      console.error("生成建议失败", e);

      const message = e instanceof Error ? e.message : "";
      setError(getFriendlyErrorMessage(message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.badge}>Decision Helper · 单件判断</div>
        <h1 className={styles.title}>判断这件衣服，适不适合你</h1>
        <p className={styles.subtitle}>
          上传试穿照或衣服照片，选择你这次想判断的问题。AI 会结合图片、场景、穿着感受和衣橱重复度，给你更具体的判断和搭配建议。
        </p>
      </section>

      <section className={styles.stepBar} aria-label="判断流程">
        <Step active label="上传照片" number="01" />
        <div className={styles.stepLine} />
        <Step active label="选择目的" number="02" />
        <div className={styles.stepLine} />
        <Step label="获得建议" number="03" />
      </section>

      <section className={styles.card}>
        <div className={styles.uploadPanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelEyebrow}>Photo</span>
            <h2>上传试穿照或衣服照片</h2>
            <p>
              建议优先上传上身图。能看到肩线、腰线、长度和整体比例，判断会更准确。
              图片仅用于本次判断，并保存在你的浏览器本地用于展示结果，不会公开展示。
            </p>
          </div>

          <label htmlFor="imageUpload" className={styles.uploadBox}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className={styles.fileInput}
              id="imageUpload"
            />

            {activePreviewUrl ? (
              <img
                src={activePreviewUrl}
                alt="已上传的衣服照片预览"
                className={styles.previewImage}
              />
            ) : (
              <div className={styles.uploadPlaceholder}>
                <div className={styles.uploadIcon}>＋</div>
                <strong>点击选择图片</strong>
                <span>支持试穿照、商品图、搭配图</span>
              </div>
            )}
          </label>

          {activeImageName && (
            <div className={styles.fileInfo}>
              <span>已选择</span>
              <strong>{activeImageName}</strong>
            </div>
          )}
        </div>

        <form className={styles.formPanel} onSubmit={(e) => e.preventDefault()}>
          <div className={styles.panelHeader}>
            <span className={styles.panelEyebrow}>Details</span>
            <h2>先完成快速判断</h2>
            <p>上传图片后，只选判断目的和单品类型就能生成结果；补充更多信息会让判断更具体。</p>
          </div>

          <div className={styles.requiredBlock}>
            <OptionsField
              label="你这次想判断什么"
              required
              options={intentOptions}
              value={intent}
              onChange={(v) => {
                setIntent(v);
                clearError();
              }}
            />

            <OptionsField
              label="单品类型"
              required
              options={itemTypeOptions}
              value={itemType}
              onChange={(v) => {
                setItemType(v);
                clearError();
              }}
            />
          </div>

          <details
            className={styles.optionalDetails}
            open={optionalOpen}
            onToggle={(event) => setOptionalOpen(event.currentTarget.open)}
          >
            <summary>
              <span>补充更多信息</span>
              <strong>可选 · 让判断更准</strong>
            </summary>

            <div className={styles.optionalFields}>
              <OptionsField
                label="最纠结什么"
                options={concernOptions}
                value={concern}
                onChange={(v) => {
                  setConcern(v);
                  clearError();
                }}
              />

              <OptionsField
                label="穿上后的第一感受"
                options={feelingOptions}
                value={feeling}
                onChange={(v) => {
                  setFeeling(v);
                  clearError();
                }}
              />

              <OptionsField
                label="衣橱里有没有类似单品"
                options={similarItemsOptions}
                value={similarItems}
                onChange={(v) => {
                  setSimilarItems(v);
                  clearError();
                }}
              />

              <MultiOptionsField
                label="可能使用场景"
                options={scenarioOptions}
                values={scenarios}
                onChange={toggleScenario}
              />

              <OptionsField
                label="你对价格的感受"
                options={priceFeelingOptions}
                value={priceFeeling}
                onChange={(v) => {
                  setPriceFeeling(v);
                  clearError();
                }}
              />

              <div className={styles.formSection}>
                <label className={styles.label} htmlFor="note">
                  补充说明
                  <span>可选</span>
                </label>
                <textarea
                  id="note"
                  placeholder="比如：我担心它显胖 / 腰线不对 / 颜色不好搭 / 买回来可能很少穿"
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    clearError();
                  }}
                  className={styles.textarea}
                  rows={4}
                />
              </div>
            </div>
          </details>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.buttonArea}>
            <button
              type="button"
              onClick={handleSubmit}
              className={styles.submitButton}
              disabled={isSubmitting || !isFormComplete}
            >
              {isSubmitting
                ? "正在看图判断，大约需要 15–25 秒..."
                : isFormComplete
                ? "快速生成判断"
                : "请先上传图片并选择必填项"}
            </button>
            <p>只填前三项也可以快速判断；补充越多，结果会越具体。</p>
          </div>
        </form>
      </section>
    </main>
  );
}

function Step({
  number,
  label,
  active = false,
}: {
  number: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div className={active ? `${styles.step} ${styles.stepActive}` : styles.step}>
      <span>{number}</span>
      <strong>{label}</strong>
    </div>
  );
}

function OptionsField({
  label,
  options,
  value,
  onChange,
  required = false,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className={styles.formSection}>
      <div className={styles.label}>
        {label}
        {required ? <span>必选</span> : <span>可选</span>}
      </div>

      <div className={styles.optionGroup}>
        {options.map((option) => {
          const selected = value === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={
                selected
                  ? `${styles.option} ${styles.optionSelected}`
                  : styles.option
              }
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MultiOptionsField({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className={styles.formSection}>
      <div className={styles.label}>
        {label}
        <span>可选 · 可多选</span>
      </div>

      <div className={styles.optionGroup}>
        {options.map((option) => {
          const selected = values.includes(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={
                selected
                  ? `${styles.option} ${styles.optionSelected}`
                  : styles.option
              }
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
