"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollController } from "./ScrollController";
import { useStayExperience } from "./StayExperienceProvider";
import { WorldRuntime } from "./WorldRuntime";
import type { Variant } from "./types";
import styles from "./stay-world.module.css";

export function StayWorldHost() {
  const experience = useStayExperience();
  const host = useRef<HTMLDivElement>(null);
  const runtime = useRef<WorldRuntime | null>(null);
  const ambientPausedRef = useRef(experience?.ambientPaused ?? false);
  const [reduced, setReduced] = useState(false);
  const [status, setStatus] = useState<"poster" | "loading" | "ready" | "failed">("poster");
  const [reason, setReason] = useState("");
  const [variant, setVariant] = useState<Variant>("desktop");
  const registration = experience?.registration;
  const quiet = experience?.quiet ?? false;
  const ambientPaused = experience?.ambientPaused ?? false;
  const saveData = typeof navigator !== "undefined" && Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
  const presentationStatus = !registration || reduced || quiet || saveData ? "poster" : status;
  useEffect(() => {
    ambientPausedRef.current = ambientPaused;
    runtime.current?.setAmbientPaused(ambientPaused);
  }, [ambientPaused]);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const media = matchMedia("(max-width: 767px), (pointer: coarse)");
    const update = () => setVariant(media.matches ? "mobile" : "desktop");
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const target = host.current;
    if (!target || reduced || quiet) {
      runtime.current?.dispose(); runtime.current = null;
      return;
    }
    if (!registration) { runtime.current?.detachRoute(); return; }
    if (saveData) return;
    let cancelled = false;
    let world = runtime.current;
    if (!world) {
      try { world = new WorldRuntime(target); runtime.current = world; }
      catch (error) {
        const message = String(error);
        queueMicrotask(() => {
          if (!cancelled) { setReason(message); setStatus("failed"); }
        });
        return () => { cancelled = true; };
      }
    }
    const currentWorld = world;
    currentWorld.setAmbientPaused(ambientPausedRef.current);
    setStatus("loading");
    const scroll = new ScrollController(registration.root, progress => currentWorld.setProgress(progress));
    const resize = new ResizeObserver(() => currentWorld.resize()); resize.observe(target);
    const visibility = () => currentWorld.setVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    const contextLost = (event: Event) => {
      event.preventDefault(); currentWorld.setVisible(false);
      setReason("WebGL context was lost."); setStatus("failed");
    };
    currentWorld.renderer.domElement.addEventListener("webglcontextlost", contextLost);
    visibility();
    void currentWorld.attach(registration.id, variant).then(manifest => {
      if (cancelled || !manifest) return;
      scroll.dispose();
      // A fresh measurement samples the same restored native scroll position.
      const measured = new ScrollController(registration.root, progress => currentWorld.setProgress(progress));
      cleanupScroll = () => measured.dispose();
      setStatus("ready");
    }).catch(error => {
      if (cancelled) return;
      setReason(error instanceof Error ? error.message : String(error)); setStatus("failed");
      currentWorld.detachRoute();
    });
    let cleanupScroll = () => scroll.dispose();
    return () => {
      cancelled = true; cleanupScroll(); resize.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      currentWorld.renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      currentWorld.detachRoute();
    };
  }, [registration, reduced, quiet, variant, saveData]);
  useEffect(() => () => { runtime.current?.dispose(); runtime.current = null; }, []);
  const id = registration?.id;
  return <div className={styles.world} data-world-status={presentationStatus} data-world-route={id ?? "none"}>
    {id && <picture className={styles.poster}>
      <source media="(max-width: 767px)" srcSet={`/assets/stay/v1/${id}-mobile.webp`} />
      <img src={`/assets/stay/v1/${id}-desktop.webp`} alt="" />
    </picture>}
    <div ref={host} className={styles.canvas} aria-hidden="true" />
    {id && presentationStatus !== "ready" && <p className={styles.status} role="status">{quiet || reduced ? "Quiet reading view." : presentationStatus === "failed" ? `${id} illustration shown. ${reason}` : `${id} illustration shown while the world prepares.`}</p>}
  </div>;
}
