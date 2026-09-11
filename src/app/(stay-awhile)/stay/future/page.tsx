import { Future } from "@/sections/stay/native/pages/Future";
import scene from "@/sections/stay/native/pages/future-geometry.json";
import { StayShell } from "@/sections/stay/native/StayShell";
import type { SceneGeometry } from "@/sections/stay/native/GardenScene";
export const metadata = { title: "The Future — Stay Awhile" };
export default function Page() { return <StayShell current="future" scene={scene as SceneGeometry}><Future /></StayShell>; }
