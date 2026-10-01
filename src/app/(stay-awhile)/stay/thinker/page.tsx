import { StayShell } from "@/sections/stay/native/StayShell";
import { SceneBoundary } from "@/sections/stay/world/SceneBoundary";
import { ThinkerRuntimeContent } from "@/sections/stay/world/ThinkerRuntimeContent";
export const metadata = { title: "The Thinker — Stay Awhile" };
export default function Page() { return <StayShell current="thinker"><SceneBoundary routeId="thinker"><ThinkerRuntimeContent /></SceneBoundary></StayShell>; }
