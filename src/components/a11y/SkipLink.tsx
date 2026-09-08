import styles from "./SkipLink.module.css";

export const MAIN_CONTENT_ID = "main-content";

/**
 * The first focusable element in the document.
 *
 * This matters more here than on an ordinary site: the eventual page carries a
 * long cinematic scroll, so a keyboard user must be able to reach the content
 * without tabbing through decorative chrome. It is a plain <a>, not a button —
 * the browser's own fragment navigation moves focus correctly.
 */
export function SkipLink() {
  return (
    <a className={styles.skipLink} href={`#${MAIN_CONTENT_ID}`}>
      Skip to content
    </a>
  );
}
