"use client";

import Image from "next/image";
import { useRef } from "react";
import styles from "./QuickDiscovery.module.css";

export function CertificateArchive({
  title,
  src,
  alt,
}: {
  title: string;
  src: string;
  alt: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className={styles.certificateTrigger}
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        <Image className={styles.certificateImage} src={src} alt="" width={900} height={1200} loading="lazy" />
        <span className={styles.certificateOverlay}>
          <strong>{title}</strong>
          <small>EXPAND ↗</small>
        </span>
      </button>
      <dialog
        ref={dialogRef}
        className={styles.certificateDialog}
        aria-label={title + " certificate placeholder"}
      >
        <div className={styles.certificateDialogInner}>
          <Image className={styles.certificateExpandedImage} src={src} alt={alt} width={900} height={1200} />
          <div className={styles.certificateDialogCopy}>
            <strong>{title}</strong>
            <span>Temporary placeholder · original certificate image pending</span>
          </div>
          <form method="dialog">
            <button type="submit" className={styles.certificateClose}>CLOSE</button>
          </form>
        </div>
      </dialog>
    </>
  );
}
