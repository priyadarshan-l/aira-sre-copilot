"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type SimulationMode = "production" | "simulation";

interface SimulationContextType {
  mode: SimulationMode;
  setMode: (mode: SimulationMode) => void;
  toggleMode: () => void;
  isSimulation: boolean;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<SimulationMode>("production");

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "production" ? "simulation" : "production"));
  }, []);

  const isSimulation = mode === "simulation";

  return (
    <SimulationContext.Provider value={{ mode, setMode, toggleMode, isSimulation }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error("useSimulation must be used within a SimulationProvider");
  }
  return context;
}
