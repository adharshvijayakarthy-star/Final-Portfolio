import { StayShell } from "@/sections/stay/native/StayShell";
import { SceneBoundary } from "@/sections/stay/world/SceneBoundary";
import { FutureRuntimeContent } from "@/sections/stay/world/JourneyRuntimeContent";
export const metadata = { title: "The Future — Stay Awhile" };
export default function Page() { return <StayShell current="future"><SceneBoundary routeId="future"><FutureRuntimeContent /></SceneBoundary></StayShell>; }
