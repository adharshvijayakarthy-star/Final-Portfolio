import { Person } from "@/sections/stay/native/pages/Person";
import scene from "@/sections/stay/native/pages/person-geometry.json";
import { StayShell } from "@/sections/stay/native/StayShell";
import type { SceneGeometry } from "@/sections/stay/native/GardenScene";
export const metadata = { title: "The Person — Stay Awhile" };
export default function Page() { return <StayShell current="person" scene={scene as SceneGeometry}><Person /></StayShell>; }
