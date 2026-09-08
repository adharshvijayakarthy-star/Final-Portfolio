"use client";

import { useEffect } from "react";

import { startQuickDiscovery } from "./engine";

/**
 * The client boundary for Quick Discovery, and the only one on the route.
 *
 * It renders nothing. Keeping the runtime in a leaf component means the
 * markup above it stays a server component: the whole scroll ships as static
 * HTML, and only the engine crosses into the client bundle.
 */
export function SceneRuntime() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-qd-root]");
    if (!root) return;
    return startQuickDiscovery(root);
  }, []);

  return null;
}
