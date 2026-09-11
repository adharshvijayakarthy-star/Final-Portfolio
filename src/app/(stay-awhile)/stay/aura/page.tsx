import { Aura } from "@/sections/stay/native/pages/Aura";
import scene from "@/sections/stay/native/pages/aura-geometry.json";
import { StayShell } from "@/sections/stay/native/StayShell";
import type { SceneGeometry } from "@/sections/stay/native/GardenScene";
export const metadata = { title: "AURA — Stay Awhile" };
export default function Page() { return <StayShell current="aura" scene={scene as SceneGeometry}><Aura /></StayShell>; }
