import {
  BarChart3,
  Building2,
  FolderKanban,
  LayoutDashboard,
  Settings,
  UsersRound
} from "lucide-react";

export const globalNavigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/reports", label: "Reports", icon: BarChart3, disabled: true, phase: 11 },
  { href: "/team", label: "Team", icon: UsersRound },
  { href: "/settings/general", label: "Settings", icon: Settings }
] as const;

export const projectNavigation = [
  { segment: "", label: "Overview", phase: 5 },
  { segment: "requirements", label: "Requirements", phase: 6 },
  { segment: "documents", label: "Documents", phase: 8 },
  { segment: "reviews", label: "Reviews", phase: 9 },
  { segment: "equipment", label: "Equipment", phase: 12 },
  { segment: "warranties", label: "Warranties", phase: 12 },
  { segment: "inspections", label: "Inspections", phase: 12, previewOnly: true },
  { segment: "training", label: "Training", phase: 12, previewOnly: true },
  { segment: "lien-waivers", label: "Lien Waivers", phase: 12, previewOnly: true },
  { segment: "drawings", label: "Drawings", phase: 12, previewOnly: true },
  { segment: "package", label: "Package", phase: 13, previewOnly: true },
  { segment: "contacts", label: "Contacts", phase: 5, previewOnly: true },
  { segment: "activity", label: "Activity", phase: 10, previewOnly: true }
] as const;

export const settingsNavigation = [
  { href: "/settings/general", label: "General", phase: 4 },
  { href: "/settings/members", label: "Members", phase: 4 },
  { href: "/settings/templates", label: "Requirement Templates", phase: 6 },
  { href: "/settings/trades", label: "Trades & Divisions", phase: 6, disabled: true },
  { href: "/settings/billing", label: "Billing", phase: 16, disabled: true },
  { href: "/settings/integrations", label: "Integrations", phase: 15, disabled: true },
  { href: "/settings/api-keys", label: "API Keys", phase: 16, disabled: true },
  { href: "/settings/security", label: "Security & Audit", phase: 16, disabled: true }
] as const;

export const commandRoutes = globalNavigation
  .filter((item) => !("disabled" in item))
  .map(({ href, label }) => ({ href, label }));
