import { StayShell } from "@/sections/stay/native/StayShell";
import { SceneBoundary } from "@/sections/stay/world/SceneBoundary";
import { WorkRuntimeContent } from "@/sections/stay/world/JourneyRuntimeContent";
export const metadata = { title: "The Work — Stay Awhile" };
export default function Page() { return <StayShell current="work"><SceneBoundary routeId="work"><WorkRuntimeContent /></SceneBoundary></StayShell>; }
