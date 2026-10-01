import { notFound } from "next/navigation";
import StayAssetGate from "@/sections/stay/gate/StayAssetGate";
export const metadata = { robots: { index: false, follow: false } };

/** An isolated, development-only check of the delivered GLBs. */
export default function AssetGatePage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <StayAssetGate />;
}
