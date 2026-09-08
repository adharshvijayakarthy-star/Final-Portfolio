import { contact, contactHref } from "@/data/content";
import styles from "./ContactLines.module.css";

export function ContactLines() {
  return <ul className={styles.list}>{(Object.entries(contact) as [keyof typeof contact,string][]).map(([kind, value]) => {
    const href = contactHref(kind,value);
    const content = <><span className={styles.label}>{kind}</span><span className={styles.value}>{value}</span>{href && <span aria-hidden="true">↗</span>}</>;
    return <li key={kind}>{href ? <a href={href} className={styles.line} rel={href.startsWith("https:") ? "me noopener noreferrer" : undefined}>{content}</a> : <div className={styles.line} aria-label={`${kind}: not added yet`}>{content}<span className={styles.pending}>Not added yet</span></div>}</li>;
  })}</ul>;
}
