"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { StayDestination } from "../native/destinations";
import { StayWorldHost } from "./StayWorldHost";

type Registration = { id: StayDestination; root: HTMLElement; token: number };
type Experience = {
  registration: Registration | null;
  quiet: boolean;
  setQuiet: (value: boolean) => void;
  ambientPaused: boolean;
  atlas: boolean;
  setAtlas: (value: boolean) => void;
  setAmbientPaused: (value: boolean) => void;
  register: (id: StayDestination, root: HTMLElement) => () => void;
};
const Context = createContext<Experience | null>(null);
let nextToken = 0;
export const useStayExperience = () => useContext(Context);

export function StayExperienceProvider({ children }: { children: ReactNode }) {
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [quiet, setQuiet] = useState(false);
  const [ambientPaused, setAmbientPaused] = useState(false);
  const [atlas, setAtlas] = useState(false);
  const register = useCallback((id: StayDestination, root: HTMLElement) => {
    const value = { id, root, token: ++nextToken };
    setRegistration(value);
    return () => setRegistration(current => current?.token === value.token ? null : current);
  }, []);
  return <Context.Provider value={{ registration, quiet, setQuiet, ambientPaused, setAmbientPaused, atlas, setAtlas, register }}>
    <StayWorldHost />{children}
  </Context.Provider>;
}
