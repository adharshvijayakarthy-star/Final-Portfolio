import type { Metadata } from "next";
import BlenderViewer from "./BlenderViewer";
import styles from "./prototype.module.css";

export const metadata: Metadata = {
  title: "Blender pipeline test",
  robots: { index: false, follow: false },
};

export default function BlenderPrototype() {
  return (
    <main id="main-content" className={styles.page}>
      <h1>Blender → GLB → browser</h1>
      <p>Phase 0 · isolated technical test. Drag to orbit, scroll to zoom, right-drag to pan.</p>
      <BlenderViewer />
    </main>
  );
}
