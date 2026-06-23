"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChangeEvent,
  FormEvent,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./page.module.css";

type RequiredField = "image" | "purpose" | "itemType";

type FormState = {
  imageDataUrl: string;
  imageName: string;
  purpose: string;
  itemType: string;
  concern: string;
  firstFeeling: string;
  similarItems: string;
  occasion: string;
  priceFeeling: string;
  extraInfo: string;
};

const emptyForm: FormState = {
  imageDataUrl: "",
  imageName: "",
  purpose: "",
  itemType: "",
  concern: "",
  firstFeeling: "",
  similarItems: "",
  occasion: "",
  priceFeeling: "",
  extraInfo: "",
};

const purposeOptions = [
  {
    value: "要不要留下 / 退掉",
    title: "要不要留下",
  },
  {
    value: "这件适不适合我",
    title: "适不适合我",
  },
  {
    value: "这件应该怎么搭",
    title: "应该怎么搭",
  },
];

const itemTypeOptions = [
  "上衣",
  "裤子",
  "半裙",
  "连衣裙",
  "套装",
  "外套",
  "鞋子",
  "包 / 配饰",
];
const concernOptions = [
  "担心显胖",
  "担心显矮",
  "不好搭",
  "不够日常",
  "性价比纠结",
  "不像我的风格",
];

const firstFeelingOptions = [
  "很喜欢",
  "还不错",
  "不太喜欢",
  "不舒服",
];

const occasionOptions = [
  "日常出门",
  "通勤",
  "约会聚会",
  "旅行拍照",
  "特殊场合",
];

const priceFeelingOptions = [
  "觉得很值",
  "可以接受",
  "有点贵",
  "明显不值",
];
function DecisionHelperContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [showOptional, setShowOptional] = useState(false);
  const [activeError, setActiveError] = useState<RequiredField | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const imageRef = useRef<HTMLDivElement | null>(null);
  const purposeRef = useRef<HTMLDivElement | null>(null);
  const itemTypeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const shouldReset = searchParams.get("reset") === "1";

    if (shouldReset) {
      localStorage.removeItem("keepOrLetGoForm");
      localStorage.removeItem("keepOrLetGoResult");
      localStorage.removeItem("keepOrLetGoFeedback");
      setForm(emptyForm);
      setActiveError(null);
      return;
    }

    const savedForm = localStorage.getItem("keepOrLetGoForm");

    if (savedForm) {
      try {
        const parsed = JSON.parse(savedForm) as Partial<FormState>;
        setForm({
          ...emptyForm,
          ...parsed,
        });
      } catch {
        localStorage.removeItem("keepOrLetGoForm");
      }
    }
  }, [searchParams]);

  function getFirstMissingField(nextForm: FormState): RequiredField | null {
    if (!nextForm.imageDataUrl) return "image";
    if (!nextForm.purpose) return "purpose";
    if (!nextForm.itemType) return "itemType";
    return null;
  }

  function scrollToField(field: RequiredField) {
    const refMap = {
      image: imageRef,
      purpose: purposeRef,
      itemType: itemTypeRef,
    };

    refMap[field].current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setErrorMessage("");

    setForm((prev) => {
      const next = {
        ...prev,
        [key]: value,
      };

      if (activeError) {
        setActiveError(getFirstMissingField(next));
      }

      return next;
    });
  }

  function clearOptionalFields(nextForm: FormState): FormState {
    return {
      ...nextForm,
      concern: "",
      firstFeeling: "",
      similarItems: "",
      occasion: "",
      priceFeeling: "",
      extraInfo: "",
    };
  }

  function handleItemTypeSelect(item: string) {
    setErrorMessage("");

    setForm((prev) => {
      const next = clearOptionalFields({
        ...prev,
        itemType: prev.itemType === item ? "" : item,
      });

      if (activeError) {
        setActiveError(getFirstMissingField(next));
      }

      return next;
    });
  }
function splitMultiValue(value: string) {
  return value
    .split("、")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toggleMultiValue<K extends keyof FormState>(
  key: K,
  option: string
) {
  setErrorMessage("");

  setForm((prev) => {
    const currentValue = String(prev[key] || "");
    const currentList = splitMultiValue(currentValue);
    const exists = currentList.includes(option);

    const nextList = exists
      ? currentList.filter((item) => item !== option)
      : [...currentList, option];

    const next = {
      ...prev,
      [key]: nextList.join("、"),
    };

    if (activeError) {
      setActiveError(getFirstMissingField(next));
    }

    return next;
  });
}

function selectSingleValue<K extends keyof FormState>(
  key: K,
  option: string
) {
  const currentValue = String(form[key] || "");
  updateForm(key, (currentValue === option ? "" : option) as FormState[K]);
}

function isMultiSelected(value: string, option: string) {
  return splitMultiValue(value).includes(option);
}

const MAX_IMAGE_SIDE = 1024;
const IMAGE_QUALITY = 0.68;

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("图片读取失败，请重新上传。"));
    reader.readAsDataURL(file);
  });
}

async function compressImageFile(file: File): Promise<string> {
  const originalDataUrl = await fileToDataUrl(file);

  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return originalDataUrl;
  }

  try {
    const image = new Image();
    image.src = originalDataUrl;

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("图片压缩失败"));
    });

    const scale = Math.min(
      1,
      MAX_IMAGE_SIDE / Math.max(image.width, image.height)
    );

    if (scale >= 1 && file.size < 450 * 1024) {
      return originalDataUrl;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext("2d");

    if (!context) {
      return originalDataUrl;
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", IMAGE_QUALITY);
  } catch {
    return originalDataUrl;
  }
}
  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("请上传图片格式的文件。");
      return;
    }

    if (file.size > 18 * 1024 * 1024) {
      setErrorMessage("图片有点大，建议换一张 18MB 以内的图片。");
      return;
    }

    try {
      setErrorMessage("");
      const imageDataUrl = await compressImageFile(file);

      const nextForm = clearOptionalFields({
        ...form,
        imageDataUrl,
        imageName: file.name,
      });

      setForm(nextForm);

      if (activeError) {
        setActiveError(getFirstMissingField(nextForm));
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "图片读取失败，请重新上传。";

      setErrorMessage(message);
      event.target.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const firstMissing = getFirstMissingField(form);

    if (firstMissing) {
      setActiveError(firstMissing);
      scrollToField(firstMissing);
      return;
    }

    setActiveError(null);
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      localStorage.setItem("keepOrLetGoForm", JSON.stringify(form));

      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: form.imageDataUrl,
          imageDataUrl: form.imageDataUrl,
          imageBase64: form.imageDataUrl,
          form,
          formData: form,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "判断失败，请稍后再试。");
      }

      localStorage.setItem("keepOrLetGoResult", JSON.stringify(data));
      router.push("/result");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "判断失败，请稍后再试。";

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const imageError = activeError === "image";
  const purposeError = activeError === "purpose";
  const itemTypeError = activeError === "itemType";

  const progressSteps = [
    {
      label: "上传图片",
      done: Boolean(form.imageDataUrl),
    },
    {
      label: "选择判断",
      done: Boolean(form.purpose && form.itemType),
    },
    {
      label: "获得建议",
      done: false,
    },
  ];

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.topBar}>
          <Link href="/" className={styles.backLink}>
            ← 返回首页
          </Link>
          <span className={styles.stepBadge}>单件判断</span>
        </div>

        <header className={styles.hero}>
          <p className={styles.kicker}>Keep or Let Go</p>
          <h1 className={styles.title}>判断这件衣服</h1>
          <p className={styles.subtitleLine}>上传一张照片，选择你这次想解决的问题。</p>
        </header>

        <div className={styles.progressBar}>
          {progressSteps.map((step, index) => (
            <div
              key={step.label}
              className={`${styles.progressStep} ${
                step.done ? styles.progressStepDone : ""
              }`}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step.label}</strong>
            </div>
          ))}
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <section
            ref={imageRef}
            className={`${styles.card} ${imageError ? styles.cardError : ""}`}
          >
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleRow}>
                <span className={styles.requiredTag}>必填</span>
                <h2 className={styles.cardTitle}>上传图片</h2>
              </div>
              <p className={styles.cardHint}>最好上传正面试穿照，能看到肩线、腰线和整体比例。</p>
            </div>

            <label className={styles.uploadBox}>
              <input
                className={styles.fileInput}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />

              {form.imageDataUrl ? (
                <div className={styles.previewWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.imageDataUrl}
                    alt="已上传的衣服图片"
                    className={styles.previewImage}
                  />
                  <div className={styles.previewInfo}>
                    <strong>已选择图片</strong>
                    <span>{form.imageName || "image"}</span>
                    <em>点击可重新选择</em>
                  </div>
                </div>
              ) : (
                <div className={styles.uploadPlaceholder}>
                  <span className={styles.uploadIcon}>＋</span>
                  <strong>点击选择图片</strong>
          
                </div>
              )}
            </label>

            {imageError && (
              <p className={styles.fieldError}>先上传一张图片，再继续判断。</p>
            )}
          </section>

          <section
            ref={purposeRef}
            className={`${styles.card} ${purposeError ? styles.cardError : ""}`}
          >
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleRow}>
                <span className={styles.requiredTag}>必填</span>
                <h2 className={styles.cardTitle}>这次你想判断什么？</h2>
              </div>
            </div>

            <div className={styles.optionGrid}>
              {purposeOptions.map((option) => {
                const selected = form.purpose === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.optionCard} ${
                      selected ? styles.optionCardActive : ""
                    }`}
                    onClick={() => updateForm("purpose", option.value)}
                  >
                    <strong>{option.title}</strong>
                  </button>
                );
              })}
            </div>

            {purposeError && (
              <p className={styles.fieldError}>请选择这次主要想判断什么。</p>
            )}
          </section>

          <section
            ref={itemTypeRef}
            className={`${styles.card} ${itemTypeError ? styles.cardError : ""}`}
          >
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleRow}>
                <span className={styles.requiredTag}>必填</span>
                <h2 className={styles.cardTitle}>想要判断什么单品？</h2>
              </div>
            </div>

            <div className={styles.chipGrid}>
              {itemTypeOptions.map((item) => {
                const selected = form.itemType === item;

                return (
                  <button
                    key={item}
                    type="button"
                    className={`${styles.chip} ${
                      selected ? styles.chipActive : ""
                    }`}
                    onClick={() => handleItemTypeSelect(item)}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            {itemTypeError && (
              <p className={styles.fieldError}>请选择这件衣服属于什么类型。</p>
            )}
          </section>

          <section className={`${styles.card} ${styles.optionalCard}`}>
            <button
              type="button"
              className={styles.optionalToggle}
              onClick={() => setShowOptional((prev) => !prev)}
            >
              <span>＋ 补充更多信息</span>
              <span className={styles.optionalHint}>可选</span>
            </button>

            {showOptional && (
  <div className={styles.optionalContent}>
    <div className={styles.optionGroup}>
      <div className={styles.optionGroupTitle}>
        <span className={styles.optionGroupNumber}>01</span>
        <strong>最纠结什么？</strong>
      </div>

      <div className={styles.selectGrid}>
        {concernOptions.map((option) => {
  const selected = form.concern === option;

  return (
    <button
      key={option}
      type="button"
      className={`${styles.selectChip} ${
        selected ? styles.selectChipActive : ""
      }`}
      onClick={() => selectSingleValue("concern", option)}
    >
      {option}
    </button>
  );
})}
      </div>
    </div>

    <div className={styles.optionGroup}>
      <div className={styles.optionGroupTitle}>
        <span className={styles.optionGroupNumber}>02</span>
        <strong>穿上后的第一感受</strong>
      </div>

      <div className={styles.selectGrid}>
        {firstFeelingOptions.map((option) => {
          const selected = form.firstFeeling === option;

          return (
            <button
              key={option}
              type="button"
              className={`${styles.selectChip} ${
                selected ? styles.selectChipActive : ""
              }`}
              onClick={() => selectSingleValue("firstFeeling", option)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>

    <div className={styles.optionGroup}>
      <div className={styles.optionGroupTitle}>
        <span className={styles.optionGroupNumber}>03</span>
        <strong>可能使用场景</strong>
        <span className={styles.optionGroupHint}>可多选</span>
      </div>

      <div className={styles.selectGrid}>
        {occasionOptions.map((option) => {
          const selected = isMultiSelected(form.occasion, option);

          return (
            <button
              key={option}
              type="button"
              className={`${styles.selectChip} ${
                selected ? styles.selectChipActive : ""
              }`}
              onClick={() => toggleMultiValue("occasion", option)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>

    <div className={styles.optionGroup}>
      <div className={styles.optionGroupTitle}>
        <span className={styles.optionGroupNumber}>04</span>
        <strong>你对价格的感受</strong>
      </div>

      <div className={styles.selectGrid}>
        {priceFeelingOptions.map((option) => {
          const selected = form.priceFeeling === option;

          return (
            <button
              key={option}
              type="button"
              className={`${styles.selectChip} ${
                selected ? styles.selectChipActive : ""
              }`}
              onClick={() => selectSingleValue("priceFeeling", option)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>

    <div className={styles.field}>
      <div className={styles.fieldHeader}>
        <span className={styles.optionGroupNumber}>05</span>
        <span>补充说明</span>
      </div>
      <textarea
        value={form.extraInfo}
        onChange={(event) => updateForm("extraInfo", event.target.value)}
        placeholder="比如：腰线不对 / 颜色不好搭 / 买回来很少穿"
      />
    </div>
  </div>
)}
          </section>

          {errorMessage && (
            <div className={styles.errorBox}>
              <strong>判断失败</strong>
              <span>{errorMessage}</span>
            </div>
          )}

          <div className={styles.submitArea}>
  <button
    type="submit"
    className={styles.submitButton}
    disabled={isSubmitting}
  >
    {isSubmitting ? "分析中…" : "开始判断"}
  </button>

  {isSubmitting ? (
    <p className={styles.loadingNotice}>
      AI 正在分析图片和穿搭信息，一般需要 30 秒左右，请不要关闭页面。
    </p>
  ) : (
    <p className={styles.submitHint}>
      上传图片、选择判断目的和单品类型后即可开始。
    </p>
  )}
</div>
        </form>
      </section>
    </main>
  );
}

export default function DecisionHelperPage() {
  return (
    <Suspense fallback={null}>
      <DecisionHelperContent />
    </Suspense>
  );
}