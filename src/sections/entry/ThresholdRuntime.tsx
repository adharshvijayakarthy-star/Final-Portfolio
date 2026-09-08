"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/data/content";
import { bindQuickMorph } from "./morph";

import styles from "./Threshold.module.css";

/**
 * The living half of the threshold.
 *
 * Everything here is additive: the scene is already complete, readable and
 * navigable from the server-rendered markup. This adds the canvas particle
 * field (embers rising through the crystal world, petals falling through the
 * garden), the custom cursor, and the pointer-reactive material response on
 * the two objects.
 *
 * It writes only data attributes and custom properties onto existing DOM —
 * never class or keyframe names, which CSS Modules hashes.
 *
 * Reduced motion: no drift, no parallax, no cursor smoothing, and the canvas
 * paints one settled frame instead of running a loop.
 */

const QUICK_PARALLAX = 7;
const STAY_PARALLAX = 5;

interface Ember {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  ph: number;
  sp: number;
  warm: boolean;
}

interface Petal {
  x: number;
  y: number;
  r: number;
  vy: number;
  sway: number;
  ph: number;
  rot: number;
  vr: number;
  a: number;
  blur: number;
  drift: number;
  react: number;
  vx: number;
  vk: number;
  spin: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function ThresholdRuntime() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const cursorEl = cursorRef.current;
    if (!canvas) return;

    const scene = canvas.closest<HTMLElement>("[data-aura-scene]");
    if (!scene) return;
    const unbindMorph = bindQuickMorph(scene, () => router.push(routes.quick));
    router.prefetch(routes.quick);

    const ctx = canvas.getContext("2d");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motionQuery.matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    const rnd = (a: number, b: number) => a + Math.random() * (b - a);

    let width = 0;
    let height = 0;
    let embers: Ember[] = [];
    let petals: Petal[] = [];
    let emberRect: Rect = { x: 0, y: 0, w: 0, h: 0 };
    let petalRect: Rect = { x: 0, y: 0, w: 0, h: 0 };
    const pointer = { x: -9999, y: -9999 };
    let quickHot = 0;
    let quickHotTarget = 0;
    let stayHot = 0;
    let stayHotTarget = 0;
    let raf = 0;
    let started = 0;

    /* --- layout ---------------------------------------------------- */

    // The scene is authored at 1440x900; both worlds scale uniformly to fit
    // whichever dimension runs out first, clamped so they never collapse or
    // overflow absurdly on extreme viewports.
    const applyScale = () => {
      const scale = Math.max(
        0.66,
        Math.min(1.12, Math.min(window.innerWidth / 1440, window.innerHeight / 900)),
      );
      scene.style.setProperty("--world-scale", String(scale));
    };

    // Both the desktop and the mobile composition are in the DOM; only one is
    // displayed. Measure whichever is actually laid out.
    const regionRect = (kind: string): Rect => {
      const sceneBox = scene.getBoundingClientRect();
      const nodes = scene.querySelectorAll<HTMLElement>(`[data-region="${kind}"]`);
      for (const node of nodes) {
        if (node.offsetParent === null && node.offsetWidth === 0) continue;
        const box = node.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) continue;
        return {
          x: box.left - sceneBox.left,
          y: box.top - sceneBox.top,
          w: box.width,
          h: box.height,
        };
      }
      return { x: 0, y: 0, w: width, h: height };
    };

    const sizeCanvas = () => {
      const box = scene.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = box.width;
      height = box.height;
      canvas.width = Math.round(box.width * dpr);
      canvas.height = Math.round(box.height * dpr);
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
      emberRect = regionRect("ember");
      petalRect = regionRect("petal");

      embers = Array.from({ length: 36 }, () => ({
        x: emberRect.x + rnd(0.05, 0.7) * emberRect.w,
        y: emberRect.y + rnd(0.45, 1) * emberRect.h,
        r: rnd(0.5, 1.6),
        vy: rnd(0.09, 0.34),
        vx: rnd(-0.06, 0.06),
        ph: rnd(0, 6.3),
        sp: rnd(0.6, 1.7),
        warm: Math.random() < 0.35,
      }));

      petals = Array.from({ length: 23 }, () => {
        const depth = rnd(0, 1);
        return {
          x: petalRect.x + rnd(0.02, 0.98) * petalRect.w,
          y: petalRect.y + rnd(-0.2, 1) * petalRect.h,
          r: 2.2 + depth * 5.6,
          vy: 0.16 + depth * 0.5,
          sway: rnd(0.4, 1.1),
          ph: rnd(0, 6.3),
          rot: rnd(0, Math.PI),
          vr: rnd(-0.006, 0.006),
          a: 0.28 + depth * 0.5,
          blur: (1 - depth) * 2.6,
          drift: rnd(-0.18, 0.1),
          // Lighter, nearer petals are disturbed more than heavy distant ones.
          react: rnd(0.3, 1.15) * (0.45 + depth * 0.75),
          vx: 0,
          vk: 0,
          spin: 0,
        };
      });
    };

    /* --- painting -------------------------------------------------- */

    const paintPetal = (context: CanvasRenderingContext2D, petal: Petal, alpha: number) => {
      context.save();
      if (petal.blur > 0.6) context.filter = `blur(${petal.blur.toFixed(1)}px)`;
      context.translate(petal.x, petal.y);
      context.rotate(petal.rot);
      context.scale(1, 0.6);
      context.beginPath();
      context.fillStyle = `rgba(238,204,206,${alpha.toFixed(3)})`;
      context.arc(0, 0, petal.r, 0, 6.283);
      context.fill();
      context.restore();
    };

    /** One settled frame — the environment present but still. */
    const paintStatic = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      for (const petal of petals.slice(0, 8)) paintPetal(ctx, petal, petal.a);
      for (const ember of embers.slice(0, 8)) {
        ctx.beginPath();
        ctx.fillStyle = "rgba(196,32,48,.5)";
        ctx.arc(ember.x, ember.y, ember.r, 0, 6.283);
        ctx.fill();
      }
      ctx.filter = "none";
    };

    const frame = (now: number) => {
      raf = 0;
      if (reduced || document.hidden) return;
      raf = requestAnimationFrame(frame);
      if (!ctx) return;
      const elapsed = now - started;
      ctx.clearRect(0, 0, width, height);

      // Ease the heat values so hover ramps the environment up rather than
      // snapping it.
      quickHot += (quickHotTarget - quickHot) * 0.07;
      stayHot += (stayHotTarget - stayHot) * 0.05;

      // Embers join after the shards have landed.
      if (elapsed > 1150) {
        const visible = Math.round(embers.length * (0.45 + 0.55 * quickHot));
        embers.forEach((ember, index) => {
          ember.y -= ember.vy * (1 + quickHot * 0.9);
          ember.x += ember.vx + Math.sin(now * 0.0006 * ember.sp + ember.ph) * 0.12;
          if (ember.y < emberRect.y + emberRect.h * 0.08) {
            ember.y = emberRect.y + emberRect.h * (0.86 + Math.random() * 0.2);
            ember.x = emberRect.x + (0.05 + Math.random() * 0.68) * emberRect.w;
          }
          if (index > visible) return;
          const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(now * 0.0011 * ember.sp + ember.ph));
          const alpha = twinkle * (0.4 + 0.6 * quickHot) * (quickHot > 0.02 ? 1 : 0.55);
          ctx.beginPath();
          ctx.fillStyle = ember.warm
            ? `rgba(238,132,86,${(alpha * 0.9).toFixed(3)})`
            : `rgba(196,32,48,${alpha.toFixed(3)})`;
          ctx.arc(ember.x, ember.y, ember.r * (1 + quickHot * 0.25), 0, 6.283);
          ctx.fill();
          if (ember.r > 1.2 && alpha > 0.5) {
            ctx.beginPath();
            ctx.fillStyle = `rgba(224,96,64,${(alpha * 0.12).toFixed(3)})`;
            ctx.arc(ember.x, ember.y, ember.r * 4.5, 0, 6.283);
            ctx.fill();
          }
        });
      }

      // Petals follow once the garden has drawn itself.
      if (elapsed > 1400) {
        for (const petal of petals) {
          petal.y += petal.vy * (1 + stayHot * 0.1) + petal.vk;
          petal.x +=
            petal.drift +
            Math.sin(now * 0.0004 * petal.sway + petal.ph) * (0.5 + petal.sway * 0.5) +
            petal.vx;
          petal.rot += petal.vr + petal.spin;

          // Local disturbance only: petals near the pointer are pushed aside
          // and lifted, the rest of the garden carries on unaware.
          const dx = petal.x - pointer.x;
          const dy = petal.y - pointer.y;
          const radius = 132 + stayHot * 86;
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq < radius * radius) {
            const distance = Math.sqrt(distanceSq) + 0.001;
            const force = (1 - distance / radius) * petal.react * (0.5 + stayHot * 0.8);
            petal.vx += (dx / distance) * force * 0.085 + (petal.react - 0.6) * force * 0.02;
            petal.vk -= force * 0.032;
            petal.spin += (dx > 0 ? 1 : -1) * force * 0.0009;
          }
          petal.vx *= 0.962;
          petal.vk *= 0.94;
          petal.spin *= 0.95;

          if (petal.y > petalRect.y + petalRect.h + 24) {
            petal.y = petalRect.y - 20 - Math.random() * 60;
            petal.x = petalRect.x + (0.02 + Math.random() * 0.96) * petalRect.w;
          }
          if (petal.x < petalRect.x - 60) petal.x = petalRect.x + petalRect.w + 20;
          if (petal.x > petalRect.x + petalRect.w + 60) petal.x = petalRect.x - 20;

          paintPetal(ctx, petal, petal.a * (0.85 + stayHot * 0.15));
        }
        ctx.filter = "none";
      }
    };

    /* --- the two objects ------------------------------------------- */

    const bindDisc = (node: HTMLElement) => {
      const isQuick = node.dataset["disc"] === "quick";
      const hotAttr = isQuick ? "quickHot" : "stayHot";
      const gleam = node.querySelector<HTMLElement>("[data-gleam]");
      const maxShift = isQuick ? QUICK_PARALLAX : STAY_PARALLAX;

      const enter = () => {
        scene.dataset[hotAttr] = "true";
        if (isQuick) quickHotTarget = 1;
        else stayHotTarget = 1;
        if (cursorEl) cursorEl.dataset["mode"] = isQuick ? "quick" : "stay";
        // Replay the gleam sweep by removing and re-adding the flag.
        if (gleam && !reduced) {
          delete gleam.dataset["play"];
          void gleam.offsetWidth;
          gleam.dataset["play"] = "true";
        }
      };

      const leave = () => {
        delete scene.dataset[hotAttr];
        if (isQuick) quickHotTarget = 0;
        else stayHotTarget = 0;
        if (cursorEl) cursorEl.dataset["mode"] = "default";
        node.style.removeProperty("--disc-x");
        node.style.removeProperty("--disc-y");
      };

      const move = (event: PointerEvent) => {
        const box = node.getBoundingClientRect();
        const lx = event.clientX - box.left;
        const ly = event.clientY - box.top;
        // The object leans toward the cursor — physical, and capped low.
        if (!reduced && !coarse) {
          const nx = (lx / box.width - 0.5) * 2;
          const ny = (ly / box.height - 0.5) * 2;
          node.style.setProperty("--disc-x", `${(nx * maxShift).toFixed(2)}px`);
          node.style.setProperty("--disc-y", `${(ny * maxShift).toFixed(2)}px`);
        }
        node.style.setProperty("--light-x", `${lx.toFixed(0)}px`);
        node.style.setProperty("--light-y", `${ly.toFixed(0)}px`);
      };

      node.addEventListener("pointerenter", enter);
      node.addEventListener("pointerleave", leave);
      node.addEventListener("focus", enter);
      node.addEventListener("blur", leave);
      node.addEventListener("pointermove", move, { passive: true });

      return () => {
        node.removeEventListener("pointerenter", enter);
        node.removeEventListener("pointerleave", leave);
        node.removeEventListener("focus", enter);
        node.removeEventListener("blur", leave);
        node.removeEventListener("pointermove", move);
      };
    };

    /* --- wiring ---------------------------------------------------- */

    applyScale();
    sizeCanvas();
    seed();

    const unbind = Array.from(
      scene.querySelectorAll<HTMLElement>("[data-disc]"),
      (node) => bindDisc(node),
    );

    // The cursor eases toward the pointer rather than pinning to it — that
    // slight lag is what makes it read as a considered object. Under reduced
    // motion it snaps, so there is no trailing movement to track.
    const cursorPos = { x: 0, y: 0, tx: 0, ty: 0, live: false };
    let cursorRaf = 0;

    const cursorTick = () => {
      cursorRaf = 0;
      if (reduced || document.hidden) return;
      cursorPos.x += (cursorPos.tx - cursorPos.x) * 0.32;
      cursorPos.y += (cursorPos.ty - cursorPos.y) * 0.32;
      if (cursorEl) {
        cursorEl.style.transform = `translate3d(${cursorPos.x.toFixed(1)}px,${cursorPos.y.toFixed(1)}px,0)`;
      }
      cursorRaf = requestAnimationFrame(cursorTick);
    };

    const onPointerMove = (event: PointerEvent) => {
      const box = scene.getBoundingClientRect();
      pointer.x = event.clientX - box.left;
      pointer.y = event.clientY - box.top;
      if (!cursorEl || coarse) return;

      cursorPos.tx = event.clientX;
      cursorPos.ty = event.clientY;
      if (!cursorPos.live) {
        cursorPos.live = true;
        cursorPos.x = event.clientX;
        cursorPos.y = event.clientY;
        cursorEl.style.opacity = "1";
        if (!reduced) cursorRaf = requestAnimationFrame(cursorTick);
      }
      if (reduced) {
        cursorEl.style.transform = `translate3d(${event.clientX}px,${event.clientY}px,0)`;
      }
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // The synthetic cursor replaces the native one only for a real mouse.
    if (cursorEl && !coarse) {
      scene.dataset["cursorActive"] = "true";
    } else if (cursorEl) {
      cursorEl.style.display = "none";
    }

    const onResize = () => {
      applyScale();
      sizeCanvas();
      seed();
      if (reduced) paintStatic();
    };
    window.addEventListener("resize", onResize);

    const resume = () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(cursorRaf);
      raf = cursorRaf = 0;
      reduced = motionQuery.matches;
      if (document.hidden) return;
      if (reduced) {
        paintStatic();
        scene.querySelectorAll<HTMLElement>('[data-disc]').forEach(node => {
          node.style.removeProperty('--disc-x'); node.style.removeProperty('--disc-y');
        });
      } else {
        raf = requestAnimationFrame(frame);
        if (cursorPos.live && !coarse) cursorRaf = requestAnimationFrame(cursorTick);
      }
    };
    motionQuery.addEventListener('change', resume);
    document.addEventListener('visibilitychange', resume);

    if (reduced) {
      paintStatic();
    } else {
      started = performance.now();
      raf = requestAnimationFrame(frame);
    }

    return () => {
      unbindMorph();
      motionQuery.removeEventListener('change', resume);
      document.removeEventListener('visibilitychange', resume);
      cancelAnimationFrame(raf);
      cancelAnimationFrame(cursorRaf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      for (const off of unbind) off();
      delete scene.dataset["cursorActive"];
      delete scene.dataset["quickHot"];
      delete scene.dataset["stayHot"];
    };
  }, [router]);

  return (
    <>
      <canvas ref={canvasRef} className={styles.particles} aria-hidden="true" />
      <div ref={cursorRef} className={styles.cursor} data-mode="default" aria-hidden="true">
        <div className={styles.cursorInner}>
          <div className={styles.cursorRing} />
          <div className={styles.cursorDot} />
          <div className={styles.cursorGlyph}>&#8594;</div>
        </div>
      </div>
    </>
  );
}
