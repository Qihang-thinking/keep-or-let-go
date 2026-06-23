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

/* ═══════════════════════════════════
   Layout constants
   ═══════════════════════════════════ */

const W = 750;
const H = 1334;
const P = 50;
const CW = W - P * 2; // 650
const FONT = `-apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`;

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

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
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
  return lines;
}

function drawTextWithMaxLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const lines = wrapText(ctx, text, maxWidth);
  if (lines.length > maxLines) {
    // trim last line to fit "…"
    lines[maxLines - 1] = lines[maxLines - 1].slice(0, -2) + "\u2026";
  }
  const shown = lines.slice(0, maxLines);
  shown.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

/* ═══════════════════════════════════
   Main
   ═══════════════════════════════════ */

export default async function generateShareImage(params: ShareImageParams): Promise<string> {
  const { verdictWord, scoreText, scoreTitle, summary, scene, imageDataUrl, rxItems, colorDir } = params;

  const canvas = document.createElement("canvas");
  canvas.width = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2);

  // ── background ──
  ctx.fillStyle = "#fbf7f3";
  ctx.fillRect(0, 0, W, H);

  // ── load image ──
  let loadedImg: HTMLImageElement | null = null;
  if (imageDataUrl) {
    try { loadedImg = await loadImage(imageDataUrl); } catch { /* skip */ }
  }

  /* ═══ 1. Header ═══ */
  ctx.fillStyle = "#3f3935";
  ctx.font = `600 28px ${FONT}`;
  ctx.fillText("留不留", P, 78);

  ctx.fillStyle = "#a1958e";
  ctx.font = `500 18px ${FONT}`;
  ctx.textAlign = "right";
  ctx.fillText("PERSONAL FIT REVIEW", W - P, 78);
  ctx.textAlign = "left";

  ctx.strokeStyle = "#e8e0da";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(P, 100);
  ctx.lineTo(W - P, 100);
  ctx.stroke();

  /* ═══ 2. Verdict ═══ */
  ctx.fillStyle = "#2f2926";
  ctx.font = `600 76px ${FONT}`;
  const oneLine = wrapText(ctx, verdictWord, CW)[0] || verdictWord;
  ctx.fillText(oneLine, P, 210);

  /* ═══ 3. Score ═══ */
  ctx.fillStyle = "#9b6572";
  ctx.font = `600 18px ${FONT}`;
  ctx.fillText(scoreTitle, P, 265);

  ctx.fillStyle = "#2f2926";
  ctx.font = `400 72px ${FONT}`;
  ctx.fillText(scoreText, P, 325);
  const sw = ctx.measureText(scoreText).width;

  ctx.fillStyle = "#8c827d";
  ctx.font = `500 34px ${FONT}`;
  ctx.fillText("/ 10", P + sw + 10, 325);

  /* ═══ 4. Image ═══ */
  drawRoundRect(ctx, P, 340, CW, 390, 26);
  if (loadedImg) {
    ctx.save();
    drawRoundRect(ctx, P, 340, CW, 390, 26);
    ctx.clip();
    drawImageCover(ctx, loadedImg, P, 340, CW, 390);
    ctx.restore();
  }
  ctx.strokeStyle = "#e8e0da";
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, P, 340, CW, 390, 26);
  ctx.stroke();

  /* ═══ 5. Summary ═══ */
  ctx.fillStyle = "#514946";
  ctx.font = `400 30px ${FONT}`;
  drawTextWithMaxLines(ctx, summary, P, 770, CW, 44, 3);

  /* ═══ 6. Divider + Scene ═══ */
  ctx.strokeStyle = "#e8e0da";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(P, 930);
  ctx.lineTo(W - P, 930);
  ctx.stroke();

  ctx.fillStyle = "#9b6572";
  ctx.font = `600 16px ${FONT}`;
  ctx.fillText("适合场景", P, 965);

  ctx.fillStyle = "#5c534f";
  ctx.font = `400 26px ${FONT}`;
  drawTextWithMaxLines(ctx, scene, P, 1000, CW, 34, 1);

  /* ═══ 7. Divider + Styling RX ═══ */
  ctx.strokeStyle = "#e8e0da";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(P, 1060);
  ctx.lineTo(W - P, 1060);
  ctx.stroke();

  ctx.fillStyle = "#9b6572";
  ctx.font = `600 16px ${FONT}`;
  ctx.fillText("造型处方", P, 1095);

  const shownRx = rxItems.slice(0, 2);
  shownRx.forEach((item, idx) => {
    const itemY = idx === 0 ? 1135 : 1215;

    ctx.fillStyle = "#9b6572";
    ctx.font = `600 22px ${FONT}`;
    ctx.fillText(String(idx + 1).padStart(2, "0"), P, itemY);
    ctx.fillText(item.label, P + 44, itemY);

    ctx.fillStyle = "#403936";
    ctx.font = `400 22px ${FONT}`;
    drawTextWithMaxLines(ctx, item.value, P + 12, itemY + 30, CW - 12, 30, 2);
  });

  /* ═══ 8. Footer ═══ */
  ctx.fillStyle = "#c4bab6";
  ctx.font = `500 18px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText("www.liubuliu.com.cn", W / 2, 1290);
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png");
}
