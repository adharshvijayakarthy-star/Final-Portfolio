"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { destinations, type StayDestination } from "./destinations";
import { MotionScope } from "./motion-scope";

type Navigation = {
  current: StayDestination; open: boolean; leaving: boolean; target: StayDestination | null;
  visited: string[]; trails: string[]; openMap: () => void; close: () => void;
  go: (href: string) => void; arrive: () => void;
};
const Context = createContext<Navigation | null>(null);
// Only explicit Stay travel resets position; browser back/forward keeps its scroll.
let pendingArrival = "";
export const useStayNavigation = () => useContext(Context);
function read(key: string): string[] {
  try { const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]"); return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []; } catch { return []; }
}
export function StayNavigation({ current, children }: { current: StayDestination; children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false), [target, setTarget] = useState<StayDestination | null>(null), [leaving, setLeaving] = useState(false);
  const [visited, setVisited] = useState<string[]>([]), [trails, setTrails] = useState<string[]>([]);
  const scope = useRef<MotionScope | null>(null), hrefRef = useRef(""), busy = useRef(false);
  const departing = useRef(false);
  const returnFocus = useRef<HTMLElement | null>(null);
  const cancel = useCallback(() => { scope.current?.dispose(); scope.current = new MotionScope(); busy.current = false; departing.current = false; setTarget(null); setLeaving(false); }, []);
  const close = useCallback(() => {
    cancel(); setOpen(false);
    scope.current?.frame(() => { if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true }); });
  }, [cancel]);
  const openMap = useCallback(() => {
    if (!open) returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
  }, [open]);
  useEffect(() => {
    cancel(); setOpen(false);
    if (pendingArrival.split("#")[0] === destinations.find(d => d.id === current)?.route) {
      const reset = !pendingArrival.includes("#"); pendingArrival = "";
      if (reset) scope.current?.frame(() => window.scrollTo({ top: 0, behavior: "instant" }));
    }
    const list = read("aura.stay.visited"); if (!list.includes(current)) list.push(current);
    setVisited(list); setTrails(read("aura.stay.trails"));
    try { localStorage.setItem("aura.stay.visited", JSON.stringify(list)); } catch { /* Optional history. */ }
    return () => scope.current?.dispose();
  }, [current, cancel]);
  const arrive = useCallback(() => {
    if (!hrefRef.current || departing.current) return;
    departing.current = true;
    setLeaving(true);
    scope.current?.after(260, () => {
      pendingArrival = hrefRef.current;
      router.push(hrefRef.current as Route);
      // Restore the current page if a route cannot commit; never strand a veil.
      scope.current?.after(12000, close);
    });
  }, [router, close]);
  const go = useCallback((href: string) => {
    const path = href.split("#")[0];
    const destination = destinations.find(d => d.route === path);
    if (!destination || busy.current) return;
    if (destination.id === current) { close(); if (href.includes("#")) router.push(href as Route); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { close(); pendingArrival = href; router.push(href as Route); return; }
    busy.current = true; hrefRef.current = href;
    const trail = `${current}>${destination.id}`;
    const nextTrails = trails.includes(trail) ? trails : [...trails, trail];
    setTrails(nextTrails);
    try { localStorage.setItem("aura.stay.trails", JSON.stringify(nextTrails)); } catch { /* Optional history. */ }
    if (!open) returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
    if (open) setTarget(destination.id);
    else scope.current?.after(700, () => setTarget(destination.id));
  }, [current, open, trails, router, close]);
  return <Context.Provider value={{ current, open, leaving, target, visited, trails, openMap, close, go, arrive }}>{children}</Context.Provider>;
}
