"use client";

type RxItem = { label: string; value: string };

type Props = {
  /** "preview" = visible in modal | "export" = hidden off-screen for toPng */
  mode: "preview" | "export";
  verdictWord: string;
  scoreTitle: string;
  scoreText: string;
  imageDataUrl?: string;
  summary: string;
  scene: string;
  rxItems: RxItem[];
  rxIntro?: string;
  colorDir?: string;
};

export default function ShareCardExport({
  mode,
  verdictWord,
  scoreTitle,
  scoreText,
  imageDataUrl,
  summary,
  scene,
  rxItems,
  rxIntro,
  colorDir,
}: Props) {
  return (
    <article
      className="shareCard"
      data-mode={mode}
      style={mode === "export" ? { width: 750 } : undefined}
    >
      {/* Header */}
      <div className="shareHeader">
        <span>留不留</span>
        <strong>PERSONAL FIT REVIEW</strong>
      </div>

      {/* Verdict */}
      <h1 className="shareVerdict">{verdictWord}</h1>

      {/* Score row */}
      <div className="shareScoreRow">
        <span>{scoreTitle}</span>
        <strong>
          {scoreText} <em>/ 10</em>
        </strong>
      </div>

      {/* Image */}
      {imageDataUrl && (
        <div className="shareImageFrame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="shareImage"
            src={imageDataUrl}
            alt=""
            crossOrigin="anonymous"
          />
        </div>
      )}

      {/* Summary */}
      <p className="shareSummary">{summary}</p>

      {/* Scene */}
      <div className="shareScene">
        <span>适合场景</span>
        <strong>{scene}</strong>
      </div>

      {/* Styling RX */}
      {(rxItems.length > 0 || rxIntro) && (
        <div className="shareRxSection">
          <div className="shareRxHeader">
            <span>造型处方</span>
            <strong>STYLING RX</strong>
          </div>

          {rxIntro && <p className="shareRxIntro">{rxIntro}</p>}

          {rxItems.map((item, idx) => (
            <div key={idx} className="shareRxItem">
              <em>{String(idx + 1).padStart(2, "0")}</em>
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            </div>
          ))}

          {colorDir && (
            <div className="shareRxColor">
              <span className="shareRxColorDots">
                <span />
                <span />
                <span />
              </span>
              <span>配色方向</span>
              <p>{colorDir}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <p className="shareUrl">www.liubuliu.com.cn</p>
    </article>
  );
}
