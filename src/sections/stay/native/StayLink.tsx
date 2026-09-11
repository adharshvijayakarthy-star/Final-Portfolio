"use client";
import Link from "next/link";
import type { ComponentProps } from "react";
import { useStayNavigation } from "./StayNavigation";
import { destinations } from "./destinations";

/** Ordinary Next links remain valid before the animated navigation layer mounts. */
export function StayLink({ onClick, ...props }: ComponentProps<typeof Link>) {
  const navigation = useStayNavigation();
  // This Windows static export emits nested segment filenames. On-demand native
  // navigation uses the valid full payload; avoid speculative segment requests.
  return <Link prefetch={false} {...props} onClick={event => {
    onClick?.(event);
    if (!navigation || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || props.target === "_blank" || typeof props.href !== "string") return;
    if (!destinations.some(destination => destination.route === String(props.href).split("#")[0])) return;
    event.preventDefault(); navigation.go(props.href);
  }} />;
}
