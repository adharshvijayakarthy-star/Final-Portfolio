"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { MotionScope, type DestinationController } from "./motion-scope";

export function DestinationFrame({ children, start, name }: { children: ReactNode; start?: DestinationController; name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || !start) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    // Restore authored styles when Strict Mode remounts or preferences change.
    const originals = Array.from(root.querySelectorAll<HTMLElement | SVGElement>("*")).map(el => [el, el.getAttribute("style")] as const);
    let scope: MotionScope;
    const restore = () => originals.forEach(([el, value]) => value === null ? el.removeAttribute("style") : el.setAttribute("style", value));
    function run() { scope?.dispose(); restore(); scope = new MotionScope(); start!(root!, scope, media.matches); }
    run(); media.addEventListener("change", run);
    return () => { media.removeEventListener("change", run); scope.dispose(); restore(); };
  }, [start]);
  return <div ref={ref} data-stay-destination={name}>{children}</div>;
}
