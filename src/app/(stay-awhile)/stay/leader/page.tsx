import { Leader } from "@/sections/stay/native/pages/Leader";
import scene from "@/sections/stay/native/pages/leader-geometry.json";
import { StayShell } from "@/sections/stay/native/StayShell";
import type { SceneGeometry } from "@/sections/stay/native/GardenScene";
export const metadata = { title: "The Leader — Stay Awhile" };
export default function Page() { return <StayShell current="leader" scene={scene as SceneGeometry}><Leader /></StayShell>; }
