"use client";

import { useEffect, useRef } from "react";

type GlobePoint = { x: number; y: number; z: number };
type Orientation = { yaw: number; pitch: number };

const DEG = Math.PI / 180;
const REST: Orientation = { yaw: 8 * DEG, pitch: -5 * DEG };

// A coarse, borderless land mask. It suggests continents without claiming
// geographic precision or attaching editorial meaning to a location.
const REGIONS = [
  [-106, 48, 35, 24],
  [-92, 25, 18, 12],
  [-61, -17, 18, 36],
  [-42, 72, 13, 9],
  [12, 52, 24, 13],
  [20, 7, 22, 34],
  [76, 45, 54, 25],
  [108, 12, 28, 19],
  [135, -25, 18, 12],
] as const;

const LAND_POINTS: GlobePoint[] = createLandPoints();

export function AtlasGlobeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    let tabVisible = document.visibilityState === "visible";
    let introStart: number | null = null;
    let introComplete = false;
    const current: Orientation = { yaw: REST.yaw - 16 * DEG, pitch: REST.pitch };
    const target: Orientation = { ...REST };
    const rootStyles = getComputedStyle(canvas.closest(".public-site") ?? canvas);
    const paper = rootStyles.getPropertyValue("--color-paper").trim() || "#FFFEFA";
    const petrol = rootStyles.getPropertyValue("--public-petrol").trim() || "#103C42";
    const gold = rootStyles.getPropertyValue("--color-gold").trim() || "#D4B778";

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const radius = Math.min(width, height) * 0.405;
      const cx = width / 2;
      const cy = height / 2 - radius * 0.02;

      ctx.save();
      ctx.shadowColor = "rgba(3, 20, 23, 0.28)";
      ctx.shadowBlur = radius * 0.13;
      ctx.shadowOffsetY = radius * 0.09;
      const sphere = ctx.createRadialGradient(
        cx - radius * 0.32,
        cy - radius * 0.38,
        radius * 0.08,
        cx,
        cy,
        radius,
      );
      sphere.addColorStop(0, "#ffffff");
      sphere.addColorStop(0.58, paper);
      sphere.addColorStop(1, "#d9ddd4");
      ctx.fillStyle = sphere;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 0.5, 0, Math.PI * 2);
      ctx.clip();
      drawGraticule(ctx, current, cx, cy, radius, gold);

      ctx.fillStyle = petrol;
      for (const point of LAND_POINTS) {
        const rotated = rotate(point, current);
        if (rotated.z <= 0.015) continue;
        const edge = Math.min(1, rotated.z * 2.8);
        ctx.globalAlpha = 0.32 + edge * 0.58;
        const dot = 0.55 + edge * 0.72;
        ctx.beginPath();
        ctx.arc(cx + rotated.x * radius, cy - rotated.y * radius, dot, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;

      ctx.strokeStyle = "rgba(255,255,255,0.72)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 0.5, 0, Math.PI * 2);
      ctx.stroke();
    };

    const requestFrame = () => {
      if (!visible || !tabVisible || frame) return;
      frame = requestAnimationFrame(animate);
    };

    const animate = (now: number) => {
      frame = 0;
      if (!visible || !tabVisible) return;

      if (!introComplete) {
        introStart ??= now;
        const t = Math.min(1, (now - introStart) / 1400);
        const eased = 1 - Math.pow(1 - t, 4);
        current.yaw = REST.yaw - 16 * DEG * (1 - eased);
        current.pitch = REST.pitch;
        introComplete = t >= 1;
      } else {
        current.yaw += (target.yaw - current.yaw) * 0.12;
        current.pitch += (target.pitch - current.pitch) * 0.12;
      }

      draw();
      const moving =
        !introComplete ||
        Math.abs(target.yaw - current.yaw) > 0.0005 ||
        Math.abs(target.pitch - current.pitch) > 0.0005;
      if (moving) requestFrame();
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      target.yaw = REST.yaw + clamp(x, -1, 1) * 6 * DEG;
      target.pitch = REST.pitch - clamp(y, -1, 1) * 6 * DEG;
      requestFrame();
    };

    const settle = () => {
      target.yaw = REST.yaw;
      target.pitch = REST.pitch;
      requestFrame();
    };

    const onVisibility = () => {
      tabVisible = document.visibilityState === "visible";
      if (!tabVisible) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else {
        draw();
        requestFrame();
      }
    };

    const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
    const visibilityObserver = "IntersectionObserver" in window
      ? new IntersectionObserver(([entry]) => {
          visible = Boolean(entry?.isIntersecting);
          if (!visible) {
            cancelAnimationFrame(frame);
            frame = 0;
          } else {
            draw();
            requestFrame();
          }
        })
      : null;
    resizeObserver?.observe(canvas);
    visibilityObserver?.observe(canvas);
    canvas.addEventListener("pointermove", onPointerMove, { passive: true });
    canvas.addEventListener("pointerleave", settle);
    document.addEventListener("visibilitychange", onVisibility);
    resize();
    requestFrame();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", settle);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="atlas-globe-canvas" />;
}

function createLandPoints(): GlobePoint[] {
  const points: GlobePoint[] = [];
  for (let lat = -58; lat <= 80; lat += 3.25) {
    for (let lon = -180; lon < 180; lon += 3.25) {
      const jitter = Math.sin((lat + 31) * (lon + 17)) * 0.8;
      if (!isLand(lat + jitter, lon - jitter)) continue;
      const phi = lat * DEG;
      const lambda = lon * DEG;
      points.push({
        x: Math.cos(phi) * Math.sin(lambda),
        y: Math.sin(phi),
        z: Math.cos(phi) * Math.cos(lambda),
      });
    }
  }
  return points;
}

function isLand(lat: number, lon: number): boolean {
  return REGIONS.some(([cx, cy, rx, ry]) => {
    const dx = Math.min(Math.abs(lon - cx), 360 - Math.abs(lon - cx));
    return (dx * dx) / (rx * rx) + ((lat - cy) * (lat - cy)) / (ry * ry) < 1;
  });
}

function rotate(point: GlobePoint, orientation: Orientation): GlobePoint {
  const cosY = Math.cos(orientation.yaw);
  const sinY = Math.sin(orientation.yaw);
  const x1 = point.x * cosY + point.z * sinY;
  const z1 = -point.x * sinY + point.z * cosY;
  const cosX = Math.cos(orientation.pitch);
  const sinX = Math.sin(orientation.pitch);
  return { x: x1, y: point.y * cosX - z1 * sinX, z: point.y * sinX + z1 * cosX };
}

function drawGraticule(
  ctx: CanvasRenderingContext2D,
  orientation: Orientation,
  cx: number,
  cy: number,
  radius: number,
  gold: string,
) {
  const lines: { points: GlobePoint[]; accent?: boolean }[] = [];
  for (const lon of [-120, -60, 0, 60, 120]) {
    const points: GlobePoint[] = [];
    for (let lat = -86; lat <= 86; lat += 3) {
      const phi = lat * DEG;
      const lambda = lon * DEG;
      points.push({ x: Math.cos(phi) * Math.sin(lambda), y: Math.sin(phi), z: Math.cos(phi) * Math.cos(lambda) });
    }
    lines.push({ points, accent: lon === 0 });
  }
  for (const lat of [-45, 0, 45]) {
    const points: GlobePoint[] = [];
    for (let lon = -180; lon <= 180; lon += 3) {
      const phi = lat * DEG;
      const lambda = lon * DEG;
      points.push({ x: Math.cos(phi) * Math.sin(lambda), y: Math.sin(phi), z: Math.cos(phi) * Math.cos(lambda) });
    }
    lines.push({ points });
  }

  for (const line of lines) {
    ctx.strokeStyle = line.accent ? gold : "rgba(16,60,66,0.12)";
    ctx.lineWidth = line.accent ? 1.15 : 0.65;
    ctx.beginPath();
    let penDown = false;
    for (const point of line.points) {
      const rotated = rotate(point, orientation);
      if (rotated.z <= 0) {
        penDown = false;
        continue;
      }
      const x = cx + rotated.x * radius;
      const y = cy - rotated.y * radius;
      if (penDown) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
      penDown = true;
    }
    ctx.stroke();
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
