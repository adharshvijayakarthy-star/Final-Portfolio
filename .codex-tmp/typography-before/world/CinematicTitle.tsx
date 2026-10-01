import { createElement, type ReactNode } from "react";

export type CinematicReveal = "masked" | "environmental" | "lines" | "tracking" | "groups" | "landmark" | "dissolve";

type CinematicTitleProps = {
  as: "h1" | "h2";
  id?: string | undefined;
  text: string;
  reveal?: CinematicReveal | undefined;
  lines?: readonly string[] | undefined;
  groups?: readonly string[] | undefined;
  exit?: boolean | undefined;
};

/** Keeps the heading semantic while allowing a few titles to move as authored groups. */
export function CinematicTitle({ as, id, text, reveal, lines, groups, exit = false }: CinematicTitleProps) {
  const pieces = lines ?? groups;
  const children: ReactNode = pieces
    ? pieces.flatMap((piece, index) => [
      createElement("span", {
        key: `${index}`,
        "aria-hidden": true,
        "data-title-order": index,
        ...(lines ? { "data-title-line": index } : { "data-title-group": index }),
      }, piece),
      ...(index < pieces.length - 1 ? [" "] : []),
    ])
    : text;

  return createElement(as, {
    id,
    ...(reveal ? { "data-reveal": reveal } : {}),
    ...(exit ? { "data-reveal-exit": "true" } : {}),
    ...(pieces ? { "aria-label": text } : {}),
  }, children);
}
