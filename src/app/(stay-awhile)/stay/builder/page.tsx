import { Builder } from "@/sections/stay/native/pages/Builder";
import scene from "@/sections/stay/native/pages/builder-geometry.json";
import { StayShell } from "@/sections/stay/native/StayShell";
import type { SceneGeometry } from "@/sections/stay/native/GardenScene";
export const metadata = { title: "The Builder — Stay Awhile" };
export default function Page() { return <StayShell current="builder" scene={scene as SceneGeometry}><Builder /></StayShell>; }
