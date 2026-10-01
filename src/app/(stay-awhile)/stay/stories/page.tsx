import { StayShell } from "@/sections/stay/native/StayShell";
import { SceneBoundary } from "@/sections/stay/world/SceneBoundary";
import { StoriesRuntimeContent } from "@/sections/stay/world/JourneyRuntimeContent";
export const metadata = { title: "Stories — Stay Awhile" };
export default function Page() { return <StayShell current="stories"><SceneBoundary routeId="stories"><StoriesRuntimeContent /></SceneBoundary></StayShell>; }
