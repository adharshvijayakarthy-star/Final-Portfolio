export type Variant = "desktop" | "mobile";
export type Vec3 = [number, number, number];
export type AssetRecord = {
  assetId: string;
  ownerRoute: string;
  variants: Record<Variant, { uri: string; nodeNames: string[]; clips: { name: string; duration: number }[] }>;
};
export type AssetManifest = { schemaVersion: number; assets: AssetRecord[] };
export type SceneManifest = {
  schemaVersion: number;
  routeId: string;
  assetIds: string[];
  guideAssetId: string;
  guideNodeNames: string[];
  worldOrigin: Vec3;
  posterProgress: number;
  camera: { fov: number; near: number; far: number; roll: number };
  cameraKnots: { band: [number, number]; start: Vec3; end: Vec3; look: Vec3 }[];
  clips: { name: string; duration: number; progressBand: [number, number] | null }[];
  instances: { assetId: string; instanceId: string; position: Vec3; rotation: Vec3; scale: Vec3; variantNode: string | null }[];
};

export async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json() as Promise<T>;
}
