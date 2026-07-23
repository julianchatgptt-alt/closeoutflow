"use client";

import { useEffect } from "react";

import { useBreadcrumbContext } from "./breadcrumb-context";

export function TemplateBreadcrumb({
  children,
  template
}: {
  children: React.ReactNode;
  template: { id: string; name: string };
}) {
  const { setTemplate } = useBreadcrumbContext();

  useEffect(() => {
    setTemplate(template);
    return () => setTemplate(null);
  }, [template, setTemplate]);

  return children;
}
