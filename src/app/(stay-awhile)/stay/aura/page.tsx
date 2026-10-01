import { StayShell } from "@/sections/stay/native/StayShell";
import { SceneBoundary } from "@/sections/stay/world/SceneBoundary";
import { AuraRuntimeContent } from "@/sections/stay/world/JourneyRuntimeContent";
export const metadata = { title: "AURA — Stay Awhile" };
export default function Page() { return <StayShell current="aura"><SceneBoundary routeId="aura"><AuraRuntimeContent /></SceneBoundary></StayShell>; }
