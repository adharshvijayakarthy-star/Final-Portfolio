import { Work } from "@/sections/stay/native/pages/Work";
import scene from "@/sections/stay/native/pages/work-geometry.json";
import { StayShell } from "@/sections/stay/native/StayShell";
import type { SceneGeometry } from "@/sections/stay/native/GardenScene";
export const metadata = { title: "The Work — Stay Awhile" };
export default function Page() { return <StayShell current="work" scene={scene as SceneGeometry}><Work /></StayShell>; }
