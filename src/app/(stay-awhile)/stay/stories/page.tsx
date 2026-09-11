import { Stories } from "@/sections/stay/native/pages/Stories";
import scene from "@/sections/stay/native/pages/stories-geometry.json";
import { StayShell } from "@/sections/stay/native/StayShell";
import type { SceneGeometry } from "@/sections/stay/native/GardenScene";
export const metadata = { title: "Stories — Stay Awhile" };
export default function Page() { return <StayShell current="stories" scene={scene as SceneGeometry}><Stories /></StayShell>; }
