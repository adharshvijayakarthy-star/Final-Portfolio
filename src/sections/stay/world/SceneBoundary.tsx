"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { StayDestination } from "../native/destinations";
import { useStayExperience } from "./StayExperienceProvider";

/** Registers a committed real page without moving its semantic children into WebGL. */
export function SceneBoundary({ routeId, children }: { routeId: StayDestination; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const experience = useStayExperience();
  const register = experience?.register;
  const quiet = experience?.quiet ?? false;
  useEffect(() => {
    if (!root.current || !register) return;
    return register(routeId, root.current);
  }, [register, routeId]);
  return <div ref={root} data-stay-route={routeId} data-stay-quiet={quiet ? "true" : undefined}>{children}</div>;
}
