import { BuilderRuntimeContent } from "@/sections/stay/world/BuilderRuntimeContent";
import { SceneBoundary } from "@/sections/stay/world/SceneBoundary";
import { StayShell } from "@/sections/stay/native/StayShell";
export const metadata = { title: "The Builder — Stay Awhile" };
export default function Page() { return <StayShell current="builder"><SceneBoundary routeId="builder"><BuilderRuntimeContent /></SceneBoundary></StayShell>; }
