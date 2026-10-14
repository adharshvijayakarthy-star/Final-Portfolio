"use client";

import { createContext, Profiler, useCallback, useContext, useRef, useState, type ProfilerOnRenderCallback, type ReactNode } from "react";
import type { StayDestination } from "../native/destinations";
import { StayWorldHost } from "./StayWorldHost";
import type { TravelFamily } from "./travel-score";
type TravelController = { begin: (family: TravelFamily, commit: () => void) => boolean; cancel: () => void };

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
  beginTravel: (family: TravelFamily, commit: () => void) => boolean;
  cancelTravel: () => void;
  registerTravel: (controller: TravelController) => () => void;
};
const Context = createContext<Experience | null>(null);
let nextToken = 0;
export const useStayExperience = () => useContext(Context);

export function StayExperienceProvider({ children }: { children: ReactNode }) {
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [quiet, setQuiet] = useState(false);
  const [ambientPaused, setAmbientPaused] = useState(false);
  const [atlas, setAtlas] = useState(false);
  const travel = useRef<TravelController | null>(null);
  const profiling = useRef({ root: null as HTMLElement | null, commits: 0, milliseconds: 0 });
  // React's standard production build disables Profiler callbacks. Development
  // evidence is labelled separately from the world's production frame samples.
  const profile = useCallback<ProfilerOnRenderCallback>((_id, phase, duration) => {
    const sample = profiling.current;
    sample.commits++; sample.milliseconds += duration;
    if (sample.root) sample.root.dataset.stayReactProfile = JSON.stringify({ environment: "development", commits: sample.commits, renderMs: sample.milliseconds, lastRenderMs: duration, phase });
  }, []);
  const beginTravel = useCallback((family: TravelFamily, commit: () => void) => travel.current?.begin(family, commit) ?? false, []);
  const cancelTravel = useCallback(() => travel.current?.cancel(), []);
  const registerTravel = useCallback((controller: TravelController) => {
    travel.current = controller;
    return () => { if (travel.current === controller) travel.current = null; };
  }, []);
  const register = useCallback((id: StayDestination, root: HTMLElement) => {
    const value = { id, root, token: ++nextToken };
    profiling.current.root = root;
    setRegistration(value);
    return () => {
      if (profiling.current.root === root) profiling.current.root = null;
      delete root.dataset.stayReactProfile;
      setRegistration(current => current?.token === value.token ? null : current);
    };
  }, []);
  return <Context.Provider value={{ registration, quiet, setQuiet, ambientPaused, setAmbientPaused, atlas, setAtlas, register, beginTravel, cancelTravel, registerTravel }}>
    <Profiler id="Stay" onRender={profile}><StayWorldHost />{children}</Profiler>
  </Context.Provider>;
}
