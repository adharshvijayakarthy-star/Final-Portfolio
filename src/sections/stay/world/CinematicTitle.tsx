import { createElement } from "react";
import { titlePhrases } from "./typography-score";

export type CinematicReveal = "film-mask" | "diagonal-mask" | "line-unfold" | "tracking-settle" | "offset-alignment" | "quiet-emergence";

type CinematicTitleProps = {
  as: "h1" | "h2";
  id?: string | undefined;
  text: string;
  reveal?: CinematicReveal | undefined;
  lines?: readonly string[] | undefined;
  groups?: readonly string[] | undefined;
};

/** One accessible heading; only whole phrases are choreographed, never characters. */
export function CinematicTitle({ as, id, text, reveal = "film-mask", lines, groups }: CinematicTitleProps) {
  const authored = titlePhrases[text] ?? lines ?? groups;
  // A bad score must never replace, omit, or repeat the source copy.
  const pieces = authored?.join(" ") === text ? authored : [text];
  const children = pieces.flatMap((piece, index) => [
      createElement("span", {
        key: `${index}`,
        "aria-hidden": true,
        "data-title-order": index,
        "data-title-phrase": "",
      }, piece),
      ...(index < pieces.length - 1 ? [" "] : []),
    ]);

  return createElement(as, {
    id,
    "data-reveal": reveal,
    "data-title-kind": as === "h1" ? "chapter" : text.length > 36 ? "intertitle" : "thought",
    "aria-label": text,
  }, children);
}
