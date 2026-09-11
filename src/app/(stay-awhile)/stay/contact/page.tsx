import { Contact } from "@/sections/stay/native/pages/Contact";
import scene from "@/sections/stay/native/pages/contact-geometry.json";
import { StayShell } from "@/sections/stay/native/StayShell";
import type { SceneGeometry } from "@/sections/stay/native/GardenScene";
export const metadata = { title: "Contact — Stay Awhile" };
export default function Page() { return <StayShell current="contact" scene={scene as SceneGeometry}><Contact /></StayShell>; }
