import Link from "next/link";

import type { ExperienceDefinition } from "@/data/site";

import styles from "./ExperiencePlaceholder.module.css";

/**
 * TEMPORARY — the shell behind an experience route that has not been built.
 *
 * Its job is to make the navigation real: both entrances on the landing page
 * lead somewhere that exists, says plainly what it is, and offers a way back.
 * It carries no portfolio content and asserts nothing about the work.
 *
 * The `data-world` scope means each placeholder already sits in the correct
 * palette, which is also a live check that the world token scopes resolve
 * outside the landing page.
 */
export function ExperiencePlaceholder({
  experience,
}: {
  experience: ExperienceDefinition;
}) {
  return (
    <div className={styles.shell} data-world={experience.world}>
      <div className={styles.inner}>
        <p className={styles.index}>{experience.index}</p>
        <h1 className={styles.title}>{experience.label}</h1>
        <p className={styles.note}>
          This experience has not been built yet.
        </p>
        <Link href="/" className={styles.back}>
          Back to the entrance
        </Link>
      </div>
    </div>
  );
}
