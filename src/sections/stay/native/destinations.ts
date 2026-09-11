/** Native Stay routes; content remains separate from Quick Discovery. */
export const destinations = [
  { id: "garden", route: "/stay/", available: true },
  { id: "person", route: "/stay/person/", available: true },
  { id: "builder", route: "/stay/builder/", available: true },
  { id: "thinker", route: "/stay/thinker/", available: true },
  { id: "leader", route: "/stay/leader/", available: true },
  { id: "stories", route: "/stay/stories/", available: true },
  { id: "work", route: "/stay/work/", available: true },
  { id: "future", route: "/stay/future/", available: true },
  { id: "aura", route: "/stay/aura/", available: true },
  { id: "contact", route: "/stay/contact/", available: true },
] as const;
export type StayDestination = (typeof destinations)[number]["id"];
