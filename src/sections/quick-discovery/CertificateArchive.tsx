"use client";

import Image from "next/image";
import { useRef } from "react";
import { certificatePlaceholderNotice, type Certificate } from "@/data/certificates";
import styles from "./QuickDiscovery.module.css";

export function CertificateArchive({ certificate }: { certificate: Certificate }) {
  const { quickTitle: title, image: { src, alt, width, height } } = certificate;
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className={styles.certificateTrigger}
        aria-haspopup="dialog"
        onClick={() => dialogRef.current?.showModal()}
      >
        <Image className={styles.certificateImage} src={src} alt="" width={width} height={height} loading="lazy" />
        <span className={styles.certificateOverlay}>
          <strong>{title}</strong>
          <small>EXPAND ↗</small>
        </span>
      </button>
      <dialog
        ref={dialogRef}
        className={styles.certificateDialog}
        aria-label={title + (certificate.placeholder ? " certificate placeholder" : " certificate")}
      >
        <div className={styles.certificateDialogInner}>
          <Image className={styles.certificateExpandedImage} src={src} alt={alt} width={width} height={height} />
          <div className={styles.certificateDialogCopy}>
            <strong>{title}</strong>
            {certificate.placeholder && <span>{certificatePlaceholderNotice}</span>}
            {certificate.issuer && <span>{certificate.issuer}</span>}
            {certificate.date && <span>{certificate.date}</span>}
            {certificate.link && <a href={certificate.link} target="_blank" rel="noopener noreferrer">View certificate ↗</a>}
          </div>
          <form method="dialog">
            <button type="submit" className={styles.certificateClose}>CLOSE</button>
          </form>
        </div>
      </dialog>
    </>
  );
}
