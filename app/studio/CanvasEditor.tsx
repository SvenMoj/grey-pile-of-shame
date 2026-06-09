"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Download, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FORMAT_SIZES } from "@/lib/studio/format";
import type { StudioFormat } from "@/lib/studio/format";
import type { CanvasData } from "./actions";

// ─── Constants ───────────────────────────────────────────────────────────────

const LOGO_SRC = "/grey-pile-of-shame.png";
const LOGO_ASPECT = 1536 / 1024;
const LOGO_H_BASE = 64;
const LOGO_W_BASE = Math.round(LOGO_H_BASE * LOGO_ASPECT); // 96

const TITLE_BASE = 72;
const SUBTITLE_BASE = 36;
const HANDLE_BASE = 32;
const SWATCH_R_BASE = 24;
const SWATCH_GAP_BASE = 10;
const STEP_FONT_BASE = 26;
const PAD = 72;
const THUMB_W = 90;

const ROLE_LABELS: Record<string, string> = {
  basecoat: "Basecoat",
  layer: "Layer",
  highlight: "Highlight",
  edge_highlight: "Edge Highlight",
  shade: "Shade",
  drybrush: "Drybrush",
  glaze: "Glaze",
  wash: "Wash",
  other: "Other",
};

// ─── Types ───────────────────────────────────────────────────────────────────

type ElId = "title" | "subtitle" | "swatches" | "steps" | "logo" | "handle";

interface El {
  id: ElId;
  x: number;
  y: number;
  visible: boolean;
  scale: number;
  /** For "steps" only: inclusive [start, end] slice into data.steps. Absent = all. */
  stepRange?: [number, number];
}

interface PhotoTransform {
  zoom: number; // 1 = fill; range 1–5
  panX: number; // logical canvas px offset (positive = photo moved right)
  panY: number;
}

interface Slide {
  id: string;
  label: string;
  els: El[];
  photoTransform: PhotoTransform;
}

type RenderData = Omit<CanvasData, "coverImageUrl">;

const EL_LABELS: Record<ElId, string> = {
  title: "Title",
  subtitle: "Subtitle",
  swatches: "Swatches",
  steps: "Recipe steps",
  logo: "Logo",
  handle: "Handle",
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function defaultEls(w: number, h: number): El[] {
  return [
    { id: "title", x: PAD, y: h * 0.58, visible: true, scale: 1 },
    { id: "subtitle", x: PAD, y: h * 0.76, visible: true, scale: 1 },
    { id: "swatches", x: PAD, y: h * 0.76, visible: true, scale: 1 },
    { id: "steps", x: PAD, y: h * 0.42, visible: false, scale: 1 },
    { id: "logo", x: PAD, y: h * 0.87, visible: true, scale: 1 },
    { id: "handle", x: w * 0.58, y: h * 0.87, visible: true, scale: 1 },
  ];
}

function makeSlide(
  w: number,
  h: number,
  label: string,
  overrides?: Array<{ id: ElId } & Partial<Omit<El, "id">>>,
): Slide {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const els = defaultEls(w, h).map((el) => {
    const ov = overrides?.find((o) => o.id === el.id);
    return ov ? { ...el, ...ov } : el;
  });
  return { id, label, els, photoTransform: { zoom: 1, panX: 0, panY: 0 } };
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

// ─── Bounds (module-level — no closure needed) ────────────────────────────────

function getElBounds(
  el: El,
  ctx: CanvasRenderingContext2D,
  W: number,
  data: RenderData,
): { x: number; y: number; w: number; h: number } | null {
  if (!el.visible) return null;
  const s = el.scale;

  if (el.id === "title") {
    const fs = Math.round(TITLE_BASE * s);
    ctx.font = `bold ${fs}px sans-serif`;
    const maxW = W - el.x - PAD;
    const lines = wrapLines(ctx, data.title, maxW);
    const w = Math.min(maxW, Math.max(...lines.map((l) => ctx.measureText(l).width)));
    return { x: el.x, y: el.y, w, h: lines.length * fs * 1.2 };
  }
  if (el.id === "subtitle" && data.subtitle) {
    const fs = Math.round(SUBTITLE_BASE * s);
    ctx.font = `${fs}px sans-serif`;
    return { x: el.x, y: el.y, w: ctx.measureText(data.subtitle).width, h: fs * 1.4 };
  }
  if (el.id === "swatches" && data.swatchHexes.length > 0) {
    const r = Math.round(SWATCH_R_BASE * s);
    const gap = Math.round(SWATCH_GAP_BASE * s);
    const n = Math.min(data.swatchHexes.length, 8);
    return { x: el.x, y: el.y, w: n * r * 2 + (n - 1) * gap, h: r * 2 };
  }
  if (el.id === "steps") {
    const range = el.stepRange ?? [0, Math.max(0, data.steps.length - 1)];
    if (data.steps.length === 0 || range[1] < range[0]) return null;
    const sf = Math.round(STEP_FONT_BASE * s);
    const bf = Math.round(sf * 0.65);
    const bLineH = Math.round(bf * 1.3);
    const pLineH = Math.round(sf * 1.25);
    const rowPad = Math.round(pLineH * 0.4);
    const pV = Math.round(14 * s);
    const pH = Math.round(16 * s);
    const badgeW = Math.round(120 * s);
    const dotR = Math.round(sf * 0.7);
    const dotGap = Math.round(4 * s);
    const dotAreaW = 3 * (dotR * 2 + dotGap);
    const maxNW = Math.min(W * 0.65, Math.round(560 * s));
    const textNW = maxNW - dotAreaW - dotGap;
    let totalInner = 0;
    for (const step of data.steps.slice(range[0], range[1] + 1)) {
      ctx.font = `${bf}px sans-serif`;
      const bLines = wrapLines(
        ctx,
        ROLE_LABELS[step.role] ?? step.role,
        badgeW - Math.round(8 * s),
      );
      ctx.font = `${sf}px sans-serif`;
      const pLines = wrapLines(ctx, step.paintLabel, textNW).slice(0, 2);
      totalInner += Math.max(bLines.length * bLineH, pLines.length * pLineH) + rowPad;
    }
    return {
      x: el.x,
      y: el.y,
      w: pH + badgeW + Math.round(12 * s) + maxNW + pH,
      h: totalInner + pV * 2,
    };
  }
  if (el.id === "logo") {
    return { x: el.x, y: el.y, w: Math.round(LOGO_W_BASE * s), h: Math.round(LOGO_H_BASE * s) };
  }
  if (el.id === "handle" && data.handle) {
    const fs = Math.round(HANDLE_BASE * s);
    ctx.font = `${fs}px sans-serif`;
    return { x: el.x, y: el.y, w: ctx.measureText(`@${data.handle}`).width, h: fs * 1.4 };
  }
  return null;
}

// ─── Core draw function (module-level, usable for thumbnails too) ─────────────

function renderSlide(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  slide: Slide,
  data: RenderData,
  coverImg: HTMLImageElement,
  logoImg: HTMLImageElement | null,
): void {
  const aW = ctx.canvas.width;
  const aH = ctx.canvas.height;
  const scaleX = aW / W;
  const scaleY = aH / H;

  // ── 1. Photo (in actual canvas coords) ──────────────────────────────────────
  ctx.clearRect(0, 0, aW, aH);

  const { zoom, panX, panY } = slide.photoTransform;
  const ia = coverImg.naturalWidth / coverImg.naturalHeight;
  const ca = W / H;
  let bx = 0,
    by = 0,
    bw = coverImg.naturalWidth,
    bh = coverImg.naturalHeight;
  if (ia > ca) {
    bw = bh * ca;
    bx = (coverImg.naturalWidth - bw) / 2;
  } else {
    bh = bw / ca;
    by = (coverImg.naturalHeight - bh) / 2;
  }

  const zw = bw / zoom;
  const zh = bh / zoom;
  const mPx = (bw - zw) / 2;
  const mPy = (bh - zh) / 2;
  const iPx = Math.max(-mPx, Math.min(mPx, panX * (bw / W)));
  const iPy = Math.max(-mPy, Math.min(mPy, panY * (bh / H)));

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(coverImg, bx + mPx - iPx, by + mPy - iPy, zw, zh, 0, 0, aW, aH);

  const grad = ctx.createLinearGradient(0, aH * 0.4, 0, aH);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(0.5, "rgba(0,0,0,0.6)");
  grad.addColorStop(1, "rgba(0,0,0,0.88)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, aW, aH);

  // ── 2. Overlay elements (in logical coords via transform) ────────────────────
  ctx.save();
  ctx.scale(scaleX, scaleY);
  ctx.textBaseline = "top";

  for (const el of slide.els) {
    if (!el.visible) continue;
    const s = el.scale;
    const { x, y } = el;

    if (el.id === "title") {
      const fs = Math.round(TITLE_BASE * s);
      const lh = fs * 1.2;
      ctx.font = `bold ${fs}px sans-serif`;
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = Math.round(20 * s);
      wrapLines(ctx, data.title, W - x - PAD).forEach((line, i) => {
        ctx.fillText(line, x, y + i * lh);
      });
      ctx.shadowBlur = 0;
    }

    if (el.id === "subtitle" && data.subtitle) {
      const fs = Math.round(SUBTITLE_BASE * s);
      ctx.font = `${fs}px sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = Math.round(12 * s);
      ctx.fillText(data.subtitle, x, y);
      ctx.shadowBlur = 0;
    }

    if (el.id === "swatches" && data.swatchHexes.length > 0) {
      const r = Math.round(SWATCH_R_BASE * s);
      const gap = Math.round(SWATCH_GAP_BASE * s);
      data.swatchHexes.slice(0, 8).forEach((hex, i) => {
        const cx = x + i * (r * 2 + gap) + r;
        const cy = y + r;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = hex;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.stroke();
      });
    }

    if (el.id === "steps" && data.steps.length > 0) {
      const range = el.stepRange ?? [0, data.steps.length - 1];
      const stepsToShow = data.steps.slice(range[0], range[1] + 1);
      if (stepsToShow.length > 0) {
        const sf = Math.round(STEP_FONT_BASE * s);
        const bf = Math.round(sf * 0.65);
        const bLineH = Math.round(bf * 1.3);
        const pLineH = Math.round(sf * 1.25);
        const rowPad = Math.round(pLineH * 0.4);
        const badgeW = Math.round(120 * s);
        const pH = Math.round(16 * s);
        const pV = Math.round(14 * s);
        const dotR = Math.round(sf * 0.7);
        const dotGap = Math.round(4 * s);
        const dotAreaW = 3 * (dotR * 2 + dotGap);
        const maxNW = Math.min(W * 0.65, Math.round(560 * s));
        const textNW = maxNW - dotAreaW - dotGap;
        const nameX = x + pH + badgeW + Math.round(12 * s);
        const dotsX = nameX + textNW + dotGap;

        // Pre-pass: compute lines and row heights from actual content
        const rowData = stepsToShow.map((step) => {
          ctx.font = `${bf}px sans-serif`;
          const bLines = wrapLines(
            ctx,
            ROLE_LABELS[step.role] ?? step.role,
            badgeW - Math.round(8 * s),
          );
          ctx.font = `${sf}px sans-serif`;
          const pLines = wrapLines(ctx, step.paintLabel, textNW).slice(0, 2);
          const bBlockH = bLines.length * bLineH;
          const pBlockH = pLines.length * pLineH;
          const rowH = Math.max(bBlockH, pBlockH) + rowPad;
          return { bLines, pLines, bBlockH, pBlockH, rowH };
        });

        const blockW = pH + badgeW + Math.round(12 * s) + maxNW + pH;
        const blockH = rowData.reduce((sum, r) => sum + r.rowH, 0) + pV * 2;

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        fillRoundRect(ctx, x, y, blockW, blockH, Math.round(12 * s));

        let rowOffsetY = y + pV;
        stepsToShow.forEach((step, i) => {
          const { bLines, pLines, bBlockH, pBlockH, rowH } = rowData[i];
          const innerH = rowH - rowPad;

          // ── Badge (wrapped, vertically centred) ───────────────────────────
          const bTopY = rowOffsetY + (innerH - bBlockH) / 2;
          ctx.fillStyle = "rgba(255,255,255,0.12)";
          fillRoundRect(
            ctx,
            x + pH,
            bTopY - Math.round(4 * s),
            badgeW,
            bBlockH + Math.round(8 * s),
            Math.round(4 * s),
          );
          ctx.font = `${bf}px sans-serif`;
          ctx.fillStyle = "rgba(255,255,255,0.65)";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          bLines.forEach((bl, li) => {
            ctx.fillText(bl, x + pH + badgeW / 2, bTopY + li * bLineH);
          });

          // ── Paint label (wrapped, vertically centred) ─────────────────────
          const pTopY = rowOffsetY + (innerH - pBlockH) / 2;
          ctx.font = `${sf}px sans-serif`;
          ctx.fillStyle = "#fff";
          ctx.textAlign = "left";
          ctx.shadowColor = "rgba(0,0,0,0.4)";
          ctx.shadowBlur = Math.round(6 * s);
          pLines.forEach((pl, li) => {
            ctx.fillText(pl, nameX, pTopY + li * pLineH);
          });
          ctx.shadowBlur = 0;

          // ── Color dots (centred on paint text block) ──────────────────────
          const dotCY = pTopY + pBlockH / 2;
          step.hexes.forEach((hex, j) => {
            const cx = dotsX + j * (dotR * 2 + dotGap) + dotR;
            ctx.beginPath();
            ctx.arc(cx, dotCY, dotR, 0, Math.PI * 2);
            ctx.fillStyle = hex;
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = "rgba(255,255,255,0.35)";
            ctx.stroke();
          });

          rowOffsetY += rowH;
        });

        ctx.textAlign = "left";
        ctx.textBaseline = "top";
      }
    }

    if (el.id === "logo" && logoImg) {
      ctx.drawImage(logoImg, x, y, Math.round(LOGO_W_BASE * s), Math.round(LOGO_H_BASE * s));
    }

    if (el.id === "handle" && data.handle) {
      const fs = Math.round(HANDLE_BASE * s);
      ctx.font = `${fs}px sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = Math.round(12 * s);
      ctx.fillText(`@${data.handle}`, x, y);
      ctx.shadowBlur = 0;
    }
  }

  ctx.restore();
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  data: CanvasData;
  format: StudioFormat;
}

export default function CanvasEditor({ data, format }: Props) {
  const { coverImageUrl, title, subtitle, swatchHexes, steps, handle } = data;
  const { width: W, height: H } = FORMAT_SIZES[format];
  const THUMB_H = Math.round(THUMB_W * (H / W));
  const DISP_W = 480;
  const DISP_H = Math.round(DISP_W * (H / W));

  const renderData: RenderData = { title, subtitle, swatchHexes, steps, handle };

  // ── State ──────────────────────────────────────────────────────────────────
  const [slides, setSlides] = useState<Slide[]>(() => [makeSlide(W, H, "Cover")]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedId, setSelectedId] = useState<ElId | null>(null);
  const [coverImg, setCoverImg] = useState<HTMLImageElement | null>(null);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [zipBusy, setZipBusy] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{ id: ElId; ox: number; oy: number } | null>(null);
  const photoDragRef = useRef<{
    lx: number;
    ly: number;
    panX: number;
    panY: number;
  } | null>(null);
  const mousedownRef = useRef<{ x: number; y: number; id: ElId | null } | null>(null);
  const thumbRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  const activeSlide = slides[activeIdx] ?? slides[0];

  // ── Slide helpers ──────────────────────────────────────────────────────────

  function updateActiveSlide(fn: (s: Slide) => Slide) {
    setSlides((prev) => prev.map((s, i) => (i === activeIdx ? fn(s) : s)));
  }
  function updateActiveEls(fn: (els: El[]) => El[]) {
    updateActiveSlide((s) => ({ ...s, els: fn(s.els) }));
  }

  // ── Load images ────────────────────────────────────────────────────────────

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setCoverImg(img);
    img.src = coverImageUrl;
  }, [coverImageUrl]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setLogoImg(img);
    img.src = LOGO_SRC;
  }, []);

  // ── Main canvas draw ───────────────────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !coverImg) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    renderSlide(ctx, W, H, activeSlide, renderData, coverImg, logoImg);

    // Selection / drag outline (drawn in actual canvas coords, after restore)
    const outlineId = dragRef.current?.id ?? selectedId;
    if (outlineId) {
      const el = activeSlide.els.find((e) => e.id === outlineId && e.visible);
      if (el) {
        const b = getElBounds(el, ctx, W, renderData);
        if (b) {
          const sx = canvas.width / W;
          const sy = canvas.height / H;
          ctx.setLineDash([8, 5]);
          ctx.strokeStyle = "rgba(255,255,255,0.85)";
          ctx.lineWidth = 2;
          ctx.strokeRect((b.x - 6) * sx, (b.y - 6) * sy, (b.w + 12) * sx, (b.h + 12) * sy);
          ctx.setLineDash([]);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    coverImg,
    logoImg,
    activeSlide,
    title,
    subtitle,
    swatchHexes,
    steps,
    handle,
    W,
    H,
    selectedId,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  // ── Thumbnails (debounced — only redraws after interaction settles) ─────────

  useEffect(() => {
    if (!coverImg) return;
    const timer = setTimeout(() => {
      slides.forEach((slide, i) => {
        const thumb = thumbRefs.current[i];
        if (!thumb) return;
        const ctx = thumb.getContext("2d");
        if (!ctx) return;
        renderSlide(ctx, W, H, slide, renderData, coverImg, logoImg);
      });
    }, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides, coverImg, logoImg, W, H, title, subtitle, swatchHexes, steps, handle]);

  // ── Interaction ────────────────────────────────────────────────────────────

  function toLogical(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * W,
      y: ((e.clientY - r.top) / r.height) * H,
    };
  }

  function hitTest(lx: number, ly: number): ElId | null {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return null;
    for (const el of [...activeSlide.els].reverse()) {
      if (!el.visible) continue;
      const b = getElBounds(el, ctx, W, renderData);
      if (b && lx >= b.x - 8 && lx <= b.x + b.w + 8 && ly >= b.y - 8 && ly <= b.y + b.h + 8)
        return el.id;
    }
    return null;
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const { x, y } = toLogical(e);
    // Capture the pointer so move/up events keep firing on this element
    // even when the finger strays outside the canvas bounds.
    e.currentTarget.setPointerCapture(e.pointerId);
    const id = hitTest(x, y);
    mousedownRef.current = { x, y, id };
    if (id) {
      const el = activeSlide.els.find((el) => el.id === id)!;
      dragRef.current = { id, ox: x - el.x, oy: y - el.y };
      e.currentTarget.style.cursor = "grabbing";
    } else {
      photoDragRef.current = {
        lx: x,
        ly: y,
        panX: activeSlide.photoTransform.panX,
        panY: activeSlide.photoTransform.panY,
      };
      e.currentTarget.style.cursor = "all-scroll";
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const { x, y } = toLogical(e);
    if (dragRef.current) {
      const { id, ox, oy } = dragRef.current;
      updateActiveEls((prev) =>
        prev.map((el) => (el.id === id ? { ...el, x: x - ox, y: y - oy } : el)),
      );
    } else if (photoDragRef.current) {
      const { lx, ly, panX, panY } = photoDragRef.current;
      updateActiveSlide((s) => ({
        ...s,
        photoTransform: { ...s.photoTransform, panX: panX + (x - lx), panY: panY + (y - ly) },
      }));
    } else {
      e.currentTarget.style.cursor = hitTest(x, y) ? "grab" : "all-scroll";
    }
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const { x, y } = toLogical(e);
    const md = mousedownRef.current;
    if (md && Math.hypot(x - md.x, y - md.y) < 5) {
      setSelectedId(md.id ?? null);
    }
    dragRef.current = null;
    photoDragRef.current = null;
    mousedownRef.current = null;
    e.currentTarget.style.cursor = "default";
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  // ── Layer controls ─────────────────────────────────────────────────────────

  function toggleVisible(id: ElId) {
    updateActiveEls((prev) =>
      prev.map((el) => (el.id === id ? { ...el, visible: !el.visible } : el)),
    );
  }

  function setRecipeView(view: "swatches" | "steps") {
    updateActiveEls((prev) =>
      prev.map((el) => ({
        ...el,
        visible:
          el.id === "swatches"
            ? view === "swatches"
            : el.id === "steps"
              ? view === "steps"
              : el.visible,
      })),
    );
  }

  function setElScale(id: ElId, scale: number) {
    updateActiveEls((prev) => prev.map((el) => (el.id === id ? { ...el, scale } : el)));
  }

  // ── Photo controls ─────────────────────────────────────────────────────────

  function setZoom(zoom: number) {
    updateActiveSlide((s) => ({ ...s, photoTransform: { ...s.photoTransform, zoom } }));
  }
  function resetPhoto() {
    updateActiveSlide((s) => ({ ...s, photoTransform: { zoom: 1, panX: 0, panY: 0 } }));
  }

  // ── Slide management ───────────────────────────────────────────────────────

  function generateSlides() {
    const cover = makeSlide(W, H, "Cover");
    const stepSlides = steps.map((_, i) =>
      makeSlide(W, H, `Step ${i + 1}`, [
        { id: "title", visible: false },
        { id: "subtitle", visible: false },
        { id: "swatches", visible: false },
        { id: "steps", visible: true, stepRange: [i, i] as [number, number] },
        { id: "logo", visible: true },
        { id: "handle", visible: true },
      ]),
    );
    setSlides([cover, ...stepSlides]);
    setActiveIdx(0);
    setSelectedId(null);
  }

  function addSlide() {
    const newSlide: Slide = {
      ...activeSlide,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      label: `Slide ${slides.length + 1}`,
    };
    setSlides((prev) => [...prev, newSlide]);
    setActiveIdx(slides.length);
    setSelectedId(null);
  }

  function deleteSlide(idx: number) {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((_, i) => i !== idx));
    setActiveIdx((prev) => (prev >= idx ? Math.max(0, prev - 1) : prev));
    setSelectedId(null);
  }

  // ── Download ───────────────────────────────────────────────────────────────

  function downloadCurrent() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    draw();
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeSlide.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${format}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  async function downloadAll() {
    if (!coverImg) return;
    setZipBusy(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (let i = 0; i < slides.length; i++) {
        const off = document.createElement("canvas");
        off.width = W;
        off.height = H;
        const ctx = off.getContext("2d");
        if (!ctx) continue;
        renderSlide(ctx, W, H, slides[i], renderData, coverImg, logoImg);
        const blob = await new Promise<Blob>((res) => off.toBlob((b) => res(b!), "image/png"));
        zip.file(
          `${slides[i].label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${format}.png`,
          blob,
        );
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-carousel.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setZipBusy(false);
    }
  }

  // ── Derived helpers for UI ─────────────────────────────────────────────────

  const selectedEl = activeSlide.els.find((e) => e.id === selectedId) ?? null;

  const swatchesVisible = activeSlide.els.find((e) => e.id === "swatches")?.visible ?? false;
  const stepsVisible = activeSlide.els.find((e) => e.id === "steps")?.visible ?? false;

  // Which layer chips to show (omit layers with no content)
  const visibleLayers = activeSlide.els.filter((el) => {
    if (el.id === "subtitle" && !subtitle) return false;
    if (el.id === "steps" && steps.length === 0) return false;
    if (el.id === "handle" && !handle) return false;
    return true;
  });

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Slide thumbnail strip */}
      <div className="flex items-end gap-2 overflow-x-auto pb-1">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => {
              setActiveIdx(i);
              setSelectedId(null);
            }}
            className={`relative flex-shrink-0 rounded overflow-hidden transition-all ${
              i === activeIdx ? "ring-2 ring-primary ring-offset-1" : "opacity-70 hover:opacity-100"
            }`}
          >
            <canvas
              ref={(el) => {
                thumbRefs.current[i] = el;
              }}
              width={THUMB_W}
              height={THUMB_H}
              style={{ display: "block" }}
            />
            <span className="absolute bottom-0 left-0 right-0 text-center bg-black/60 text-white py-0.5 text-[9px] leading-tight">
              {slide.label}
            </span>
            {slides.length > 1 && (
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSlide(i);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    deleteSlide(i);
                  }
                }}
                className="absolute top-0.5 right-0.5 size-4 flex items-center justify-center rounded-full bg-black/60 text-white text-[9px] hover:bg-black cursor-pointer"
              >
                ✕
              </div>
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={addSlide}
          style={{ width: THUMB_W, height: THUMB_H }}
          className="flex-shrink-0 rounded border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Canvas */}
      <p className="text-xs text-muted-foreground">
        Click element to select · Drag element to move · Drag background to pan photo
      </p>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{
          width: DISP_W,
          height: DISP_H,
          display: "block",
          borderRadius: 8,
          border: "1px solid hsl(var(--border))",
          // Prevent iOS Safari from claiming the touch gesture as a page scroll
          touchAction: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      {/* Controls panel */}
      <div className="space-y-4 rounded-lg border border-border p-4 bg-card text-card-foreground">
        {/* Photo */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Photo
            </span>
            <button
              type="button"
              onClick={resetPhoto}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Reset
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-16 shrink-0">
              Zoom {activeSlide.photoTransform.zoom.toFixed(1)}×
            </span>
            <input
              type="range"
              min="1"
              max="5"
              step="0.05"
              value={activeSlide.photoTransform.zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-1.5 accent-primary cursor-pointer"
            />
          </div>
        </div>

        {/* Layers */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Layers
          </span>
          <div className="flex flex-wrap gap-2">
            {visibleLayers.map((el) => (
              <button
                key={el.id}
                type="button"
                onClick={() => toggleVisible(el.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition-colors ${
                  el.visible
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground opacity-60"
                }`}
              >
                {el.visible ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                {EL_LABELS[el.id]}
              </button>
            ))}
          </div>
        </div>

        {/* Recipe view toggle */}
        {steps.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Recipe view
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRecipeView("swatches")}
                className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${
                  swatchesVisible && !stepsVisible
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                Swatches
              </button>
              <button
                type="button"
                onClick={() => setRecipeView("steps")}
                className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${
                  stepsVisible && !swatchesVisible
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                Full steps
              </button>
            </div>
          </div>
        )}

        {/* Selected element scale */}
        {selectedEl && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {EL_LABELS[selectedEl.id]} size — {selectedEl.scale.toFixed(1)}×
            </span>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.05"
              value={selectedEl.scale}
              onChange={(e) => setElScale(selectedEl.id, parseFloat(e.target.value))}
              className="w-full h-1.5 accent-primary cursor-pointer"
            />
          </div>
        )}

        {/* Auto-generate carousel */}
        {steps.length > 0 && (
          <button
            type="button"
            onClick={generateSlides}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Auto-generate recipe slides ({steps.length + 1} total)
          </button>
        )}
      </div>

      {/* Download */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={downloadCurrent}>
          <Download />
          {slides.length > 1 ? "Download slide" : "Download PNG"}
        </Button>
        {slides.length > 1 && (
          <Button variant="secondary" onClick={downloadAll} disabled={zipBusy || !coverImg}>
            {zipBusy ? <Loader2 className="animate-spin size-4" /> : <Download />}
            {zipBusy ? "Zipping…" : `Download all (${slides.length}) as ZIP`}
          </Button>
        )}
      </div>
    </div>
  );
}
