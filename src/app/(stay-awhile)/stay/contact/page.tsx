import { StayShell } from "@/sections/stay/native/StayShell";
import { SceneBoundary } from "@/sections/stay/world/SceneBoundary";
import { ContactRuntimeContent } from "@/sections/stay/world/JourneyRuntimeContent";
export const metadata = { title: "Contact — Stay Awhile" };
export default function Page() { return <StayShell current="contact"><SceneBoundary routeId="contact"><ContactRuntimeContent /></SceneBoundary></StayShell>; }
