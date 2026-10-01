"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollController } from "./ScrollController";
import { useStayExperience } from "./StayExperienceProvider";
import { WorldRuntime } from "./WorldRuntime";
import { CinematicTextController } from "./CinematicTextController";
import type { Variant } from "./types";
import styles from "./stay-world.module.css";

export function StayWorldHost() {
  const experience = useStayExperience();
  const host = useRef<HTMLDivElement>(null);
  const hostCommits = useRef(0);
  useEffect(() => { if (host.current) host.current.dataset.stayHostCommits = String(++hostCommits.current); });
  const runtime = useRef<WorldRuntime | null>(null);
  const ambientPausedRef = useRef(experience?.ambientPaused ?? false);
  const [reduced, setReduced] = useState(false);
  const [status, setStatus] = useState<"poster" | "loading" | "ready" | "failed">("poster");
  const [reason, setReason] = useState("");
  const [variant, setVariant] = useState<Variant>("desktop");
  const registration = experience?.registration;
  const quiet = experience?.quiet ?? false;
  const ambientPaused = experience?.ambientPaused ?? false;
  const atlas = experience?.atlas ?? false;
  useEffect(() => { runtime.current?.setAtlas(atlas); }, [atlas]);
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
    if (!registration) return;
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
    const typography = new CinematicTextController(registration.root);
    let awaitingFrame = false;
    currentWorld.observePresentation((progress, targetProgress) => {
      if (!currentWorld.isPresenting(registration.id)) return;
      typography.present(progress, targetProgress);
      if (awaitingFrame && !cancelled) { awaitingFrame = false; setStatus("ready"); }
    });
    currentWorld.setAmbientPaused(ambientPausedRef.current);
    setStatus("loading");
    const scroll = new ScrollController(registration.root, progress => {
      currentWorld.setProgress(progress);
      // Native reading remains available while the incoming assets prepare.
      // Once resident, typography follows the same presented score as camera.
      if (!currentWorld.isPresenting(registration.id)) typography.present(progress, progress);
    }, () => currentWorld.requestRender());
    currentWorld.observeInput(() => scroll.flush());
    const resize = new ResizeObserver(() => currentWorld.resize()); resize.observe(target);
    const visibility = () => currentWorld.setVisible(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    const contextLost = (event: Event) => {
      event.preventDefault(); currentWorld.setVisible(false);
      currentWorld.dispose();
      if (runtime.current === currentWorld) runtime.current = null;
      typography.dispose();
      setReason("WebGL context was lost."); setStatus("failed");
    };
    currentWorld.renderer.domElement.addEventListener("webglcontextlost", contextLost);
    visibility();
    void currentWorld.attach(registration.id, variant).then(manifest => {
      if (cancelled || !manifest) return;
      awaitingFrame = true;
      currentWorld.requestRender();
    }).catch(error => {
      if (cancelled) return;
      typography.dispose();
      setReason(error instanceof Error ? error.message : String(error)); setStatus("failed");
      currentWorld.detachRoute();
    });
    return () => {
      cancelled = true; scroll.dispose(); resize.disconnect();
      currentWorld.observeInput(null);
      currentWorld.observePresentation(null); typography.dispose();
      document.removeEventListener("visibilitychange", visibility);
      currentWorld.renderer.domElement.removeEventListener("webglcontextlost", contextLost);
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
    {id && presentationStatus !== "ready" && <p className={styles.status} role="status">{quiet || reduced || saveData ? "Quiet reading view." : presentationStatus === "failed" ? `${id} illustration shown. ${reason}` : `${id} illustration shown while the world prepares.`}</p>}
  </div>;
}
