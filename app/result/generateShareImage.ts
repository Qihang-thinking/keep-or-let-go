type StylingPlan = {
  outfit: string;
  shoesAndBag: string;
  colorDirection: string;
  avoid?: string;
};

type ShareInput = {
  decisionLabel: string;
  decisionHeadline: string;
  decisionEvidence?: string;
  scoreText?: string;
  scoreTitle?: string;
  ratings: Array<{ label?: string; score: number }>;
  stylingPlan?: StylingPlan;
  imageDataUrl?: string;
};

const W = 750;
const H = 1120;
const P = 34;
const CARD_W = W - P * 2;
const CARD_R = 30;
const FONT = `-apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
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

function drawCard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = CARD_R) {
  ctx.fillStyle = "#fffefd";
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.strokeStyle = "#e8ded8";
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, r);
  ctx.stroke();
}

function drawDivider(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.strokeStyle = "#eadfd9";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = src;
  });
}

function drawContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!iw || !ih) return;

  const scale = Math.min(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;

  ctx.drawImage(img, dx, dy, dw, dh);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const value = String(text || "").trim();
  const lines: string[] = [];
  let current = "";

  for (const ch of value) {
    const next = current + ch;
    if (current && ctx.measureText(next).width > maxWidth) {
      lines.push(current);
      current = ch;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function drawTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const allLines = wrapText(ctx, text, maxWidth);
  const lines = allLines.slice(0, maxLines);

  if (allLines.length > maxLines && lines.length) {
    let last = lines[lines.length - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[lines.length - 1] = `${last}…`;
  }

  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
  });
}

function computeScore(ratings: Array<{ score: number }>) {
  if (!ratings.length) return "—";
  const avg = ratings.reduce((sum, item) => sum + item.score, 0) / ratings.length;
  return (avg * 2).toFixed(1);
}

function drawPill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number) {
  ctx.fillStyle = "#f6eef1";
  roundRect(ctx, x, y, w, 38, 19);
  ctx.fill();
  ctx.strokeStyle = "#eadde2";
  ctx.lineWidth = 1.2;
  roundRect(ctx, x, y, w, 38, 19);
  ctx.stroke();

  ctx.fillStyle = "#8b5262";
  ctx.font = `700 16px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText(text, x + w / 2, y + 25);
  ctx.textAlign = "left";
}

export default async function generateShareImage(input: ShareInput): Promise<string> {
  const {
    decisionLabel,
    decisionHeadline,
    decisionEvidence,
    scoreText,
    scoreTitle,
    ratings,
    stylingPlan,
    imageDataUrl,
  } = input;

  const canvas = document.createElement("canvas");
  const dpr = 2;
  canvas.width = W * dpr;
  canvas.height = H * dpr;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.scale(dpr, dpr);
  ctx.fillStyle = "#f7f4f0";
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "alphabetic";

  let img: HTMLImageElement | null = null;
  if (imageDataUrl) {
    try {
      img = await loadImage(imageDataUrl);
    } catch {
      img = null;
    }
  }

  ctx.fillStyle = "#2f2926";
  ctx.font = `800 30px ${FONT}`;
  ctx.fillText("留不留", P, 48);

  ctx.fillStyle = "#9d928c";
  ctx.font = `700 17px ${FONT}`;
  ctx.fillText("|  FIT REVIEW", P + 104, 48);

  ctx.textAlign = "right";
  ctx.font = `700 17px ${FONT}`;
  ctx.fillText("No.0625", W - P, 48);
  ctx.textAlign = "left";

  const photoY = 78;
  const photoH = 470;
  drawCard(ctx, P, photoY, CARD_W, photoH, 32);

  const photoPad = 22;
  const photoX = P + photoPad;
  const photoInnerY = photoY + photoPad;
  const photoInnerW = CARD_W - photoPad * 2;
  const photoInnerH = photoH - photoPad * 2;

  ctx.fillStyle = "#f4eee9";
  roundRect(ctx, photoX, photoInnerY, photoInnerW, photoInnerH, 24);
  ctx.fill();

  if (img) {
    ctx.save();
    roundRect(ctx, photoX, photoInnerY, photoInnerW, photoInnerH, 24);
    ctx.clip();
    drawContain(ctx, img, photoX, photoInnerY, photoInnerW, photoInnerH);
    ctx.restore();
  }

  drawPill(ctx, decisionLabel || "判断", P + 34, photoY + 32, 122);

  const verdictY = photoY + photoH + 18;
  const verdictH = 238;
  drawCard(ctx, P, verdictY, CARD_W, verdictH);

  const innerX = P + 36;
  const innerW = CARD_W - 72;

  ctx.fillStyle = "#9b6572";
  ctx.font = `800 16px ${FONT}`;
  ctx.fillText(scoreTitle || "综合适配分", innerX, verdictY + 46);

  const score = scoreText || computeScore(ratings);
  ctx.fillStyle = "#2f2926";
  ctx.font = `400 58px ${FONT}`;
  ctx.fillText(score, innerX, verdictY + 104);

  const scoreW = ctx.measureText(score).width;
  ctx.fillStyle = "#8f8580";
  ctx.font = `700 24px ${FONT}`;
  ctx.fillText("/ 10", innerX + scoreW + 16, verdictY + 100);

  ctx.fillStyle = "#2f2926";
  ctx.font = `800 44px ${FONT}`;
  ctx.textAlign = "right";
  ctx.fillText(decisionLabel || "判断", P + CARD_W - 36, verdictY + 84);
  ctx.textAlign = "left";

  ctx.fillStyle = "#514946";
  ctx.font = `600 25px ${FONT}`;
  drawTextLines(ctx, decisionHeadline, innerX, verdictY + 148, innerW, 32, 2);

  if (decisionEvidence) {
    drawDivider(ctx, innerX, verdictY + 174, innerW);
    ctx.fillStyle = "#9b6572";
    ctx.font = `800 15px ${FONT}`;
    ctx.fillText("判断依据", innerX, verdictY + 204);

    ctx.fillStyle = "#514946";
    ctx.font = `600 20px ${FONT}`;
    drawTextLines(ctx, decisionEvidence, innerX + 88, verdictY + 204, innerW - 88, 26, 1);
  }

  const rxY = verdictY + verdictH + 18;
  const rxH = 228;
  drawCard(ctx, P, rxY, CARD_W, rxH);

  ctx.fillStyle = "#9b6572";
  ctx.font = `800 16px ${FONT}`;
  ctx.fillText("造型处方", innerX, rxY + 46);
  drawPill(ctx, "STYLING RX", P + CARD_W - 36 - 132, rxY + 22, 132);
  drawDivider(ctx, innerX, rxY + 74, innerW);

  if (stylingPlan) {
    ctx.fillStyle = "#2f2926";
    ctx.font = `800 26px ${FONT}`;
    drawTextLines(ctx, stylingPlan.outfit, innerX, rxY + 116, innerW, 32, 1);

    ctx.fillStyle = "#9b6572";
    ctx.font = `800 15px ${FONT}`;
    ctx.fillText("鞋包", innerX, rxY + 162);
    ctx.fillText("配色", innerX, rxY + 198);

    ctx.fillStyle = "#403936";
    ctx.font = `600 22px ${FONT}`;
    drawTextLines(ctx, stylingPlan.shoesAndBag, innerX + 58, rxY + 162, innerW - 58, 28, 1);
    drawTextLines(ctx, [stylingPlan.colorDirection, stylingPlan.avoid].filter(Boolean).join("；"), innerX + 58, rxY + 198, innerW - 58, 28, 1);
  } else {
    ctx.fillStyle = "#514946";
    ctx.font = `500 24px ${FONT}`;
    ctx.fillText("暂无明确造型处方。", innerX, rxY + 116);
  }

  ctx.fillStyle = "#c6bdb8";
  ctx.font = `700 16px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText("www.liubuliu.com.cn", W / 2, H - 28);
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png");
}
