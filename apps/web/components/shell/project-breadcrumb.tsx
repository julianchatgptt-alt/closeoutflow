"use client";

import { useEffect } from "react";

import { useBreadcrumbContext } from "./breadcrumb-context";

export function ProjectBreadcrumb({
  children,
  project
}: {
  children: React.ReactNode;
  project: { id: string; name: string };
}) {
  const { setProject } = useBreadcrumbContext();

  useEffect(() => {
    setProject(project);
    return () => setProject(null);
  }, [project, setProject]);

  return children;
}
