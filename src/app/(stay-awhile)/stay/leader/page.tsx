import { StayShell } from "@/sections/stay/native/StayShell";
import { SceneBoundary } from "@/sections/stay/world/SceneBoundary";
import { LeaderRuntimeContent } from "@/sections/stay/world/LeaderRuntimeContent";
export const metadata = { title: "The Leader — Stay Awhile" };
export default function Page() { return <StayShell current="leader"><SceneBoundary routeId="leader"><LeaderRuntimeContent /></SceneBoundary></StayShell>; }
