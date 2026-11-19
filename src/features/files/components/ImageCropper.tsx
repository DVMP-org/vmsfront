"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Crop, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/Button";

const BOX = 288;

type Aspect = "square" | "wide";

interface Point {
  x: number;
  y: number;
}

/**
 * Crop the browser already has loaded.
 *
 * No image-processing dependency: the preview is the original image scaled and
 * positioned behind a fixed frame, and the same geometry is applied to a
 * canvas on confirm. The result is uploaded as a normal `File`.
 */
export function ImageCropper({
  file,
  aspect = "square",
  onCancel,
  onCropped,
}: {
  file: File;
  aspect?: Aspect;
  onCancel: () => void;
  onCropped: (file: File) => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const drag = useRef<{ start: Point; origin: Point } | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const boxWidth = BOX;
  const boxHeight = aspect === "square" ? BOX : Math.round(BOX * (9 / 16));

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const baseScale = useMemo(() => {
    if (!natural.width || !natural.height) return 1;
    return Math.max(boxWidth / natural.width, boxHeight / natural.height);
  }, [natural.width, natural.height, boxWidth, boxHeight]);

  const scale = baseScale * zoom;
  const rendered = {
    width: natural.width * scale,
    height: natural.height * scale,
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      start: { x: event.clientX, y: event.clientY },
      origin: offset,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.start.x;
    const dy = event.clientY - drag.current.start.y;
    const maxX = Math.max(0, (rendered.width - boxWidth) / 2);
    const maxY = Math.max(0, (rendered.height - boxHeight) / 2);
    setOffset({
      x: Math.max(-maxX, Math.min(maxX, drag.current.origin.x + dx)),
      y: Math.max(-maxY, Math.min(maxY, drag.current.origin.y + dy)),
    });
  };

  const endDrag = () => {
    drag.current = null;
  };

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const crop = useCallback(async () => {
    const image = imageRef.current;
    if (!image || !natural.width || !natural.height) {
      setError("The image is still loading.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const sourceWidth = boxWidth / scale;
      const sourceHeight = boxHeight / scale;
      const sourceX = Math.max(
        0,
        Math.min(natural.width - sourceWidth, (rendered.width / 2 - offset.x - boxWidth / 2) / scale),
      );
      const sourceY = Math.max(
        0,
        Math.min(natural.height - sourceHeight, (rendered.height / 2 - offset.y - boxHeight / 2) / scale),
      );

      const outputWidth = aspect === "square" ? 1024 : 1200;
      const outputHeight = aspect === "square" ? 1024 : 675;
      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable");
      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight,
      );
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.9),
      );
      if (!blob) throw new Error("The crop could not be created");
      const extension = blob.type === "image/webp" ? "webp" : "png";
      const name = file.name.replace(/\.[^.]+$/, "") || "image";
      onCropped(
        new File([blob], `${name}-crop.${extension}`, { type: blob.type }),
      );
    } catch (cropError) {
      setError(
        cropError instanceof Error ? cropError.message : "The crop failed.",
      );
    } finally {
      setBusy(false);
    }
  }, [
    aspect,
    boxHeight,
    boxWidth,
    file.name,
    natural.height,
    natural.width,
    offset.x,
    offset.y,
    onCropped,
    rendered.height,
    rendered.width,
    scale,
  ]);

  return (
    <div className="space-y-4" role="dialog" aria-label="Crop image">
      <div
        className="relative mx-auto overflow-hidden rounded-xl border border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] touch-none"
        style={{ width: boxWidth, height: boxHeight }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local object URL is the crop source
          <img
            ref={imageRef}
            src={src}
            alt="Image to crop"
            draggable={false}
            onLoad={(event) =>
              setNatural({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              })
            }
            className="absolute left-1/2 top-1/2 max-w-none select-none"
            style={{
              width: rendered.width || undefined,
              height: rendered.height || undefined,
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
            }}
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-white/70" />
      </div>

      <label className="flex items-center gap-3 text-sm text-[var(--vms-ink-muted)]">
        <span className="w-12 shrink-0">Zoom</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="h-11 flex-1 accent-[var(--vms-active-accent)]"
          aria-label="Crop zoom"
        />
      </label>

      {error ? (
        <p role="alert" className="text-sm text-[var(--vms-danger)]">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={reset}>
          <RotateCcw aria-hidden="true" className="size-4" />
          Reset
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            <X aria-hidden="true" className="size-4" />
            Cancel
          </Button>
          <Button type="button" isLoading={busy} onClick={() => void crop()}>
            <Crop aria-hidden="true" className="size-4" />
            Use crop
          </Button>
        </div>
      </div>
    </div>
  );
}
