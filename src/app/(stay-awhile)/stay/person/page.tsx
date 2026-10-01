import { PersonRuntimeContent } from "@/sections/stay/world/PersonRuntimeContent";
import { SceneBoundary } from "@/sections/stay/world/SceneBoundary";
import { StayShell } from "@/sections/stay/native/StayShell";
export const metadata = { title: "The Person — Stay Awhile" };
export default function Page() { return <StayShell current="person"><SceneBoundary routeId="person"><PersonRuntimeContent /></SceneBoundary></StayShell>; }
