type RxItem = { label: string; value: string };

type ShareImageParams = {
  verdictWord: string;
  scoreText: string;
  scoreTitle: string;
  summary: string;
  imageDataUrl?: string;
  rxItems: RxItem[];
};

/* ══════════════════════════════
   Layout constants
   ══════════════════════════════ */

const W = 750;
const H = 850;
const P = 24;          // outer padding
const CARD_R = 24;
const CARD_PAD = 28;   // inner card padding
const FONT = `-apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`;

/* ── helpers ── */

function roundRect(
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

function drawWithMaxLines(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  maxWidth: number, lineHeight: number, maxLines: number,
) {
  const lines = wrapText(ctx, text, maxWidth);
  if (lines.length > maxLines) {
    lines[maxLines - 1] = lines[maxLines - 1].slice(0, -2) + "\u2026";
  }
  lines.slice(0, maxLines).forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("load failed"));
    img.src = src;
  });
}

function drawThumbCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number, y: number, w: number, h: number,
) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  if (!iw || !ih) return;
  const rImg = iw / ih, rBox = w / h;
  let sx = 0, sy = 0, sw = iw, sh = ih;
  if (rImg > rBox) { sw = ih * rBox; sx = (iw - sw) / 2; }
  else { sh = iw / rBox; sy = (ih - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/* ══════════════════════════════
   Main
   ══════════════════════════════ */

export default async function generateShareImage(params: ShareImageParams): Promise<string> {
  const { verdictWord, scoreText, scoreTitle, summary, imageDataUrl, rxItems } = params;

  const canvas = document.createElement("canvas");
  canvas.width = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2);

  // background (result page bg)
  ctx.fillStyle = "#f7f4f0";
  ctx.fillRect(0, 0, W, H);

  // pre-load image
  let thumb: HTMLImageElement | null = null;
  if (imageDataUrl) {
    try { thumb = await loadImage(imageDataUrl); } catch { /* skip */ }
  }

  // card dimensions
  const cardW = W - P * 2; // 702
  const cx = P + CARD_PAD;  // 52  (content x inside card)
  const cw = cardW - CARD_PAD * 2; // 646

  /* ═══════════════════ Card 1: Verdict ═══════════════════ */
  const c1y = P;
  const c1h = 390;

  ctx.fillStyle = "#fffefd";
  roundRect(ctx, P, c1y, cardW, c1h, CARD_R);
  ctx.fill();
  ctx.strokeStyle = "#e8e0da";
  ctx.lineWidth = 1.5;
  roundRect(ctx, P, c1y, cardW, c1h, CARD_R);
  ctx.stroke();

  // header
  ctx.fillStyle = "#3f3935";
  ctx.font = `600 18px ${FONT}`;
  ctx.fillText("留不留", cx, c1y + CARD_PAD + 18);

  ctx.fillStyle = "#a1958e";
  ctx.font = `500 13px ${FONT}`;
  ctx.textAlign = "right";
  ctx.fillText("PERSONAL FIT REVIEW", P + cardW - CARD_PAD, c1y + CARD_PAD + 18);
  ctx.textAlign = "left";

  // divider
  ctx.strokeStyle = "#e8e0da";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, c1y + 62);
  ctx.lineTo(P + cardW - CARD_PAD, c1y + 62);
  ctx.stroke();

  // verdict — single line, 76px
  const vY = c1y + 120;
  ctx.fillStyle = "#2f2926";
  ctx.font = `600 72px ${FONT}`;
  const vLine = wrapText(ctx, verdictWord, cw - 140)[0] || verdictWord;
  ctx.fillText(vLine, cx, vY + 54);

  // score
  ctx.fillStyle = "#9b6572";
  ctx.font = `600 14px ${FONT}`;
  ctx.fillText(scoreTitle, cx, vY + 72 + 18);

  ctx.fillStyle = "#2f2926";
  ctx.font = `400 56px ${FONT}`;
  ctx.fillText(scoreText, cx, vY + 72 + 70);
  const sw = ctx.measureText(scoreText).width;

  ctx.fillStyle = "#8c827d";
  ctx.font = `500 26px ${FONT}`;
  ctx.fillText("/ 10", cx + sw + 8, vY + 72 + 70);

  // thumbnail — 120×160, top-right corner of card
  if (thumb) {
    const thumbX = P + cardW - CARD_PAD - 120;
    const thumbY = c1y + CARD_PAD + 72;
    ctx.save();
    roundRect(ctx, thumbX, thumbY, 120, 160, 14);
    ctx.clip();
    drawThumbCover(ctx, thumb, thumbX, thumbY, 120, 160);
    ctx.restore();
    ctx.strokeStyle = "#e8e0da";
    ctx.lineWidth = 1.5;
    roundRect(ctx, thumbX, thumbY, 120, 160, 14);
    ctx.stroke();
  }

  // summary — below score, full width, max 3 lines
  const sumY = vY + 72 + 70 + 36;
  ctx.fillStyle = "#514946";
  ctx.font = `400 28px ${FONT}`;
  drawWithMaxLines(ctx, summary, cx, sumY, cw, 40, 3);

  /* ═══════════════════ Card 2: Styling RX ═══════════════════ */
  const c2y = c1y + c1h + 20;
  const c2h = 290;

  ctx.fillStyle = "#fffefd";
  roundRect(ctx, P, c2y, cardW, c2h, CARD_R);
  ctx.fill();
  ctx.strokeStyle = "#e8e0da";
  ctx.lineWidth = 1.5;
  roundRect(ctx, P, c2y, cardW, c2h, CARD_R);
  ctx.stroke();

  // label
  ctx.fillStyle = "#9b6572";
  ctx.font = `600 14px ${FONT}`;
  ctx.fillText("造型处方", cx, c2y + CARD_PAD + 14);

  // max 2 items
  const shownRx = rxItems.slice(0, 2);
  shownRx.forEach((item, idx) => {
    const itemY = c2y + CARD_PAD + 50 + idx * 90;

    ctx.fillStyle = "#9b6572";
    ctx.font = `600 20px ${FONT}`;
    ctx.fillText(String(idx + 1).padStart(2, "0"), cx, itemY);

    ctx.fillText(item.label, cx + 44, itemY);

    ctx.fillStyle = "#403936";
    ctx.font = `400 20px ${FONT}`;
    drawWithMaxLines(ctx, item.value, cx + 12, itemY + 28, cw - 12, 28, 2);
  });

  return canvas.toDataURL("image/png");
}
