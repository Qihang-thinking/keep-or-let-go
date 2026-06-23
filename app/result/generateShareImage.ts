type RxItem = { label: string; value: string };

type ShareImageParams = {
  verdictWord: string;
  scoreText: string;
  scoreTitle: string;
  summary: string;
  scene: string;
  imageDataUrl?: string;
  rxItems: RxItem[];
  colorDir?: string;
};

/* ── helpers ── */

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
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
  x: number, y: number, w: number, h: number,
) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!iw || !ih) return;
  const imgRatio = iw / ih;
  const boxRatio = w / h;
  let sx = 0, sy = 0, sw = iw, sh = ih;
  if (imgRatio > boxRatio) {
    sw = ih * boxRatio;
    sx = (iw - sw) / 2;
  } else {
    sh = iw / boxRatio;
    sy = (ih - sh) / 2;
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
  maxLines = 5,
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

  let shown = lines.slice(0, maxLines);
  if (lines.length > maxLines && shown.length > 0) {
    const last = shown[shown.length - 1];
    shown[shown.length - 1] = last.slice(0, -2) + "…";
  }
  shown.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return y + shown.length * lineHeight;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

/* ── main ── */

const W = 750;
const P = 48;       // outer padding
const CW = W - P * 2; // content width
const CARD_R = 28;
const FONT = `-apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`;

export default async function generateShareImage(
  params: ShareImageParams,
): Promise<string> {
  const { verdictWord, scoreText, scoreTitle, summary, scene, imageDataUrl, rxItems, colorDir } = params;

  // ── pre-calculate height ──
  // We'll just use a tall enough canvas and the card height will be determined by content.
  // Start with a generous estimate: 1500 should be plenty.
  const H = 1500;

  const canvas = document.createElement("canvas");
  canvas.width = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2); // 2x DPR → draw in logical pixels

  // ── background ──
  ctx.fillStyle = "#fbf7f3";
  ctx.fillRect(0, 0, W, H);

  // ── pre-load image if provided ──
  let loadedImg: HTMLImageElement | null = null;
  if (imageDataUrl) {
    try {
      loadedImg = await loadImage(imageDataUrl);
    } catch { /* continue without image */ }
  }

  let y = P;

  // ── header ──
  ctx.fillStyle = "#3f3935";
  ctx.font = `600 28px ${FONT}`;
  ctx.fillText("留不留", P, y + 22);

  ctx.fillStyle = "#a1958e";
  ctx.font = `500 18px ${FONT}`;
  ctx.textAlign = "right";
  ctx.fillText("PERSONAL FIT REVIEW", W - P, y + 22);
  ctx.textAlign = "left";
  y += 50;

  // ── divider ──
  ctx.strokeStyle = "#e8e0da";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(P, y);
  ctx.lineTo(W - P, y);
  ctx.stroke();
  y += 44;

  // ── verdict ──
  ctx.fillStyle = "#2f2926";
  ctx.font = `600 88px ${FONT}`;
  ctx.fillText(verdictWord, P, y + 66);
  y += 94;

  // ── score row ──
  ctx.fillStyle = "#9b6572";
  ctx.font = `600 18px ${FONT}`;
  ctx.fillText(scoreTitle, P, y + 14);

  ctx.fillStyle = "#2f2926";
  ctx.font = `400 72px ${FONT}`;
  ctx.fillText(scoreText, P, y + 72);
  const sw = ctx.measureText(scoreText).width;

  ctx.fillStyle = "#8c827d";
  ctx.font = `500 34px ${FONT}`;
  ctx.fillText("/ 10", P + sw + 10, y + 72);
  y += 100;

  // ── image ──
  const imgY = y;
  const imgH = 420;

  drawRoundRect(ctx, P, imgY, CW, imgH, CARD_R);
  if (loadedImg) {
    ctx.save();
    drawRoundRect(ctx, P, imgY, CW, imgH, CARD_R);
    ctx.clip();
    drawImageCover(ctx, loadedImg, P, imgY, CW, imgH);
    ctx.restore();
  }
  ctx.strokeStyle = "#e8e0da";
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, P, imgY, CW, imgH, CARD_R);
  ctx.stroke();
  y = imgY + imgH + 32;

  // ── summary ──
  ctx.fillStyle = "#514946";
  ctx.font = `400 30px ${FONT}`;
  const shortSummary = summary.length > 150 ? summary.slice(0, 147) + "…" : summary;
  y = drawWrappedText(ctx, shortSummary, P, y, CW, 44, 5) + 24;

  // ── divider + scene ──
  ctx.strokeStyle = "#e8e0da";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(P, y);
  ctx.lineTo(W - P, y);
  ctx.stroke();
  y += 32;

  ctx.fillStyle = "#9b6572";
  ctx.font = `600 16px ${FONT}`;
  ctx.fillText("适合场景", P, y);
  y += 28;

  ctx.fillStyle = "#5c534f";
  ctx.font = `400 26px ${FONT}`;
  ctx.fillText(scene.slice(0, 40), P, y);
  y += 40;

  // ── styling RX ──
  if (rxItems.length > 0) {
    ctx.strokeStyle = "#e8e0da";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(P, y);
    ctx.lineTo(W - P, y);
    ctx.stroke();
    y += 32;

    ctx.fillStyle = "#9b6572";
    ctx.font = `600 16px ${FONT}`;
    ctx.fillText("造型处方", P, y);
    y += 32;

    for (const item of rxItems) {
      const num = String(rxItems.indexOf(item) + 1).padStart(2, "0");
      ctx.fillStyle = "#9b6572";
      ctx.font = `600 22px ${FONT}`;
      ctx.fillText(num, P, y);
      ctx.fillText(item.label, P + 44, y);
      y += 26;

      ctx.fillStyle = "#403936";
      ctx.font = `400 22px ${FONT}`;
      const value = item.value.length > 50 ? item.value.slice(0, 48) + "…" : item.value;
      y = drawWrappedText(ctx, value, P + 12, y, CW - 12, 30, 2) + 16;
    }

    if (colorDir) {
      y += 2;
      ctx.fillStyle = "#9b6572";
      ctx.font = `600 16px ${FONT}`;
      ctx.fillText("●  ●  ●  配色方向", P, y);
      y += 24;
      ctx.fillStyle = "#5c534f";
      ctx.font = `400 24px ${FONT}`;
      ctx.fillText(colorDir.slice(0, 40), P, y);
      y += 30;
    }
  }

  // ── footer URL ──
  const urlY = Math.max(y + 60, 1300);
  ctx.fillStyle = "#c4bab6";
  ctx.font = `500 18px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText("www.liubuliu.com.cn", W / 2, urlY);
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png");
}
