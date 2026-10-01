"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import { destinations, type StayDestination } from "./destinations";
import { MotionScope } from "./motion-scope";
import { useStayExperience } from "../world/StayExperienceProvider";

type Navigation = {
  current: StayDestination; open: boolean; leaving: boolean; target: StayDestination | null;
  visited: string[]; trails: string[]; openMap: () => void; close: () => void;
  go: (href: string) => void; arrive: (immediate?: boolean) => void;
};
const Context = createContext<Navigation | null>(null);
export const useStayNavigation = () => useContext(Context);
function read(key: string): string[] {
  try { const value: unknown = JSON.parse(sessionStorage.getItem(key) ?? "[]"); return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []; } catch { return []; }
}
export function StayNavigation({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const current: StayDestination = destinations.find(destination => destination.route === currentPath)?.id ?? "garden";
  // Only explicit Stay travel resets position; browser Back retains native restoration.
  const pendingArrival = useRef("");
  const [openFor, setOpenFor] = useState<StayDestination | null>(null), [target, setTarget] = useState<StayDestination | null>(null), [leaving, setLeaving] = useState(false);
  const [visited, setVisited] = useState<string[]>([]), [trails, setTrails] = useState<string[]>([]);
  const [previousCurrent, setPreviousCurrent] = useState(current);
  const scope = useRef<MotionScope | null>(null), hrefRef = useRef(""), busy = useRef(false);
  const departing = useRef(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  if (previousCurrent !== current) {
    setPreviousCurrent(current);
    setOpenFor(null);
    setTarget(null);
    setLeaving(false);
  }
  const open = openFor === current;
  const experience = useStayExperience();
  const setAtlas = experience?.setAtlas;
  const quiet = experience?.quiet ?? false;
  useEffect(() => { setAtlas?.(open); }, [open, setAtlas]);
  const resetMotion = useCallback(() => { scope.current?.dispose(); scope.current = new MotionScope(); busy.current = false; departing.current = false; }, []);
  const cancel = useCallback(() => { resetMotion(); setTarget(null); setLeaving(false); }, [resetMotion]);
  const close = useCallback(() => {
    cancel(); setOpenFor(null);
    scope.current?.frame(() => { if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true }); });
  }, [cancel]);
  const openMap = useCallback(() => {
    if (!open) returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpenFor(current);
  }, [current, open]);
  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "m" || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select, [contenteditable='true']"))) return;
      event.preventDefault();
      if (open) close(); else openMap();
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [close, open, openMap]);
  useEffect(() => {
    resetMotion();
    if (pendingArrival.current.split("#")[0] === destinations.find(d => d.id === current)?.route) {
      const arrival = pendingArrival.current;
      const reset = !arrival.includes("#"); pendingArrival.current = "";
      if (reset) window.scrollTo({ top: 0, behavior: "instant" });
      // Let the native dialog close and restore its trigger before moving focus
      // to the committed destination. Its close-time focus restore can otherwise
      // override a same-frame heading focus.
      scope.current?.after(120, () => {
        const hash = arrival.split("#")[1];
        const target = hash ? document.getElementById(hash) : document.querySelector<HTMLElement>("[data-stay-route] h1");
        if (target instanceof HTMLElement) { target.tabIndex = -1; target.focus({ preventScroll: true }); }
      });
    }
    let alive = true;
    const list = read("aura.stay.v1.visited"); if (!list.includes(current)) list.push(current);
    queueMicrotask(() => {
      if (!alive) return;
      setVisited(list);
      setTrails(read("aura.stay.v1.trails"));
    });
    try { sessionStorage.setItem("aura.stay.v1.visited", JSON.stringify(list)); } catch { /* Optional history. */ }
    return () => { alive = false; scope.current?.dispose(); };
  }, [current, resetMotion]);
  const arrive = useCallback((immediate = false) => {
    if (!hrefRef.current || departing.current) return;
    departing.current = true;
    setLeaving(true);
    scope.current?.after(immediate ? 0 : 260, () => {
      pendingArrival.current = hrefRef.current;
      router.push(hrefRef.current as Route);
      // Restore the current page if a route cannot commit; never strand a veil.
      scope.current?.after(12000, close);
    });
  }, [router, close]);
  const go = useCallback((href: string) => {
    const path = href.split("#")[0];
    const destination = destinations.find(d => d.route === path);
    if (!destination) return;
    if (busy.current) cancel();
    if (destination.id === current) { close(); if (href.includes("#")) router.push(href as Route); return; }
    if (quiet || matchMedia("(prefers-reduced-motion: reduce)").matches) { close(); pendingArrival.current = href; router.push(href as Route); return; }
    busy.current = true; hrefRef.current = href;
    const trail = `${current}>${destination.id}`;
    const nextTrails = trails.includes(trail) ? trails : [...trails, trail];
    setTrails(nextTrails);
    try { sessionStorage.setItem("aura.stay.v1.trails", JSON.stringify(nextTrails)); } catch { /* Optional history. */ }
    if (!open) returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpenFor(current);
    if (open) setTarget(destination.id);
    else scope.current?.after(700, () => setTarget(destination.id));
  }, [current, open, trails, router, close, cancel, quiet]);
  return <Context.Provider value={{ current, open, leaving, target, visited, trails, openMap, close, go, arrive }}>{children}</Context.Provider>;
}
