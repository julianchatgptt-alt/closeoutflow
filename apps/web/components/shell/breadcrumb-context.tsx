"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ProjectBreadcrumb = {
  id: string;
  name: string;
};

type BreadcrumbContextValue = {
  project: ProjectBreadcrumb | null;
  setProject: (project: ProjectBreadcrumb | null) => void;
};

const BreadcrumbContext = createContext<BreadcrumbContextValue | null>(null);

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [project, setProjectState] = useState<ProjectBreadcrumb | null>(null);
  const setProject = useCallback((value: ProjectBreadcrumb | null) => setProjectState(value), []);
  const value = useMemo(() => ({ project, setProject }), [project, setProject]);

  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>;
}

export function useBreadcrumbContext() {
  const value = useContext(BreadcrumbContext);
  if (!value) throw new Error("useBreadcrumbContext must be used within BreadcrumbProvider");
  return value;
}
