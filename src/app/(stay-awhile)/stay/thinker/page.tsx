import { Thinker } from "@/sections/stay/native/pages/Thinker";
import scene from "@/sections/stay/native/pages/thinker-geometry.json";
import { StayShell } from "@/sections/stay/native/StayShell";
import type { SceneGeometry } from "@/sections/stay/native/GardenScene";
export const metadata = { title: "The Thinker — Stay Awhile" };
export default function Page() { return <StayShell current="thinker" scene={scene as SceneGeometry}><Thinker /></StayShell>; }
