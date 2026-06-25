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
const H = 980;
const P = 30;
const CARD_W = W - P * 2;
const CARD_R = 28;
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

function drawCard(ctx: CanvasRenderingContext2D, y: number, h: number) {
  ctx.fillStyle = "#fffefd";
  roundRect(ctx, P, y, CARD_W, h, CARD_R);
  ctx.fill();
  ctx.strokeStyle = "#e7ded8";
  ctx.lineWidth = 1.5;
  roundRect(ctx, P, y, CARD_W, h, CARD_R);
  ctx.stroke();
}

function drawLine(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
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

function drawCover(
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

  const imageRatio = iw / ih;
  const boxRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = iw;
  let sh = ih;

  if (imageRatio > boxRatio) {
    sw = ih * boxRatio;
    sx = (iw - sw) / 2;
  } else {
    sh = iw / boxRatio;
    sy = (ih - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
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

  const innerX = P + 34;
  const innerW = CARD_W - 68;
  const card1Y = 72;
  const card1H = 444;
  const card2Y = card1Y + card1H + 22;
  const card2H = 354;

  ctx.fillStyle = "#2f2926";
  ctx.font = `800 28px ${FONT}`;
  ctx.fillText("留不留", P, 42);

  ctx.fillStyle = "#9d928c";
  ctx.font = `700 16px ${FONT}`;
  ctx.fillText("|  FIT REVIEW", P + 102, 42);

  ctx.textAlign = "right";
  ctx.font = `700 16px ${FONT}`;
  ctx.fillText("SHARE CARD", W - P, 42);
  ctx.textAlign = "left";

  drawCard(ctx, card1Y, card1H);

  ctx.fillStyle = "#9b6572";
  ctx.font = `800 16px ${FONT}`;
  ctx.fillText("THE VERDICT", innerX, card1Y + 48);
  drawPill(ctx, "VERDICT", P + CARD_W - 34 - 112, card1Y + 22, 112);

  const imageW = 132;
  const imageH = 176;
  const imageX = P + CARD_W - 34 - imageW;
  const imageY = card1Y + 96;

  if (img) {
    ctx.save();
    roundRect(ctx, imageX, imageY, imageW, imageH, 16);
    ctx.clip();
    drawCover(ctx, img, imageX, imageY, imageW, imageH);
    ctx.restore();
  } else {
    ctx.fillStyle = "#f1ede8";
    roundRect(ctx, imageX, imageY, imageW, imageH, 16);
    ctx.fill();
  }

  ctx.strokeStyle = "#e5dcd7";
  ctx.lineWidth = 1.2;
  roundRect(ctx, imageX, imageY, imageW, imageH, 16);
  ctx.stroke();

  const leftW = innerW - imageW - 38;

  ctx.fillStyle = "#2f2926";
  ctx.font = `800 72px ${FONT}`;
  drawTextLines(ctx, decisionLabel || "判断", innerX, card1Y + 144, leftW, 74, 1);

  ctx.fillStyle = "#9b6572";
  ctx.font = `800 16px ${FONT}`;
  ctx.fillText(scoreTitle || "综合适配分", innerX, card1Y + 190);

  const score = scoreText || computeScore(ratings);
  ctx.fillStyle = "#2f2926";
  ctx.font = `400 56px ${FONT}`;
  ctx.fillText(score, innerX, card1Y + 246);

  const scoreW = ctx.measureText(score).width;
  ctx.fillStyle = "#8f8580";
  ctx.font = `700 23px ${FONT}`;
  ctx.fillText("/ 10", innerX + scoreW + 18, card1Y + 242);

  ctx.fillStyle = "#514946";
  ctx.font = `500 26px ${FONT}`;
  drawTextLines(ctx, decisionHeadline, innerX, card1Y + 306, innerW, 34, 2);

  if (decisionEvidence) {
    drawLine(ctx, innerX, card1Y + 356, innerW);
    ctx.fillStyle = "#9b6572";
    ctx.font = `800 16px ${FONT}`;
    ctx.fillText("判断依据", innerX, card1Y + 388);

    ctx.fillStyle = "#514946";
    ctx.font = `600 22px ${FONT}`;
    drawTextLines(ctx, decisionEvidence, innerX + 90, card1Y + 388, innerW - 90, 29, 2);
  }

  drawCard(ctx, card2Y, card2H);

  ctx.fillStyle = "#9b6572";
  ctx.font = `800 16px ${FONT}`;
  ctx.fillText("造型处方", innerX, card2Y + 48);
  drawPill(ctx, "STYLING RX", P + CARD_W - 34 - 132, card2Y + 22, 132);
  drawLine(ctx, innerX, card2Y + 76, innerW);

  if (stylingPlan) {
    let y = card2Y + 122;

    const drawRow = (label: string, value: string, maxLines = 1) => {
      if (!value) return;

      ctx.fillStyle = "#9b6572";
      ctx.font = `800 16px ${FONT}`;
      ctx.fillText(label, innerX, y);

      ctx.fillStyle = "#403936";
      ctx.font = `600 25px ${FONT}`;
      drawTextLines(ctx, value, innerX + 70, y, innerW - 70, 32, maxLines);
      y += maxLines === 2 ? 78 : 52;
    };

    drawRow("搭配", stylingPlan.outfit, 2);
    drawRow("鞋包", stylingPlan.shoesAndBag, 1);
    drawRow("配色", stylingPlan.colorDirection, 1);
    drawRow("避免", stylingPlan.avoid || "", 1);
  } else {
    ctx.fillStyle = "#514946";
    ctx.font = `500 24px ${FONT}`;
    ctx.fillText("暂无明确造型处方。", innerX, card2Y + 126);
  }

  ctx.fillStyle = "#c6bdb8";
  ctx.font = `700 16px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText("www.liubuliu.com.cn", W / 2, H - 34);
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png");
}
