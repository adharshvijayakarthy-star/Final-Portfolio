import { Fragment } from "react";
import { contact } from "@/data/content";

/** Display-only cleanup: callers retain the original contact value for hrefs. */
export function ContactAddress({ value }: { value: string }) {
  if (value === contact.linkedin) return <>Adharsh Vijayakarthy</>;
  if (value === contact.github) return <>adharshvijayakarthy-star</>;
  const parts = value.replace(/^https:\/\/(www\.)?/, "").split(/(?=@)|(?<=\/)/);
  return <>{parts.map((part, index) => <Fragment key={index}>{index > 0 && <wbr />}{part}</Fragment>)}</>;
}
