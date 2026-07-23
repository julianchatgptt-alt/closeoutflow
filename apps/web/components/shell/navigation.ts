import {
  BarChart3,
  Building2,
  ClipboardList,
  ContactRound,
  FolderKanban,
  LayoutDashboard,
  Settings,
  UsersRound
} from "lucide-react";

export const globalNavigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/companies", label: "Companies", icon: Building2 },
  { href: "/contacts", label: "Contacts", icon: ContactRound },
  { href: "/templates", label: "Templates", icon: ClipboardList },
  { href: "/reports", label: "Reports", icon: BarChart3, disabled: true, phase: 11 },
  { href: "/settings/team", label: "Team", icon: UsersRound },
  { href: "/settings/organization", label: "Settings", icon: Settings }
] as const;

export const projectNavigation = [
  { segment: "", label: "Overview", phase: 5 },
  { segment: "team", label: "Team", phase: 5 },
  { segment: "companies", label: "Companies", phase: 5 },
  { segment: "contacts", label: "Contacts", phase: 5 },
  { segment: "activity", label: "Activity", phase: 5 },
  { segment: "settings", label: "Settings", phase: 5 },
  { segment: "requirements", label: "Requirements", phase: 6 },
  { segment: "documents", label: "Documents", phase: 8 },
  { segment: "reviews", label: "Reviews", phase: 9 },
  { segment: "equipment", label: "Equipment", phase: 12 },
  { segment: "warranties", label: "Warranties", phase: 12 },
  { segment: "inspections", label: "Inspections", phase: 12, previewOnly: true },
  { segment: "training", label: "Training", phase: 12, previewOnly: true },
  { segment: "lien-waivers", label: "Lien Waivers", phase: 12, previewOnly: true },
  { segment: "drawings", label: "Drawings", phase: 12, previewOnly: true },
  { segment: "package", label: "Package", phase: 13, previewOnly: true }
] as const;

export const settingsNavigation = [
  { href: "/settings/organization", label: "Organization", phase: 4 },
  { href: "/settings/team", label: "Team", phase: 4 },
  { href: "/settings/roles", label: "Roles", phase: 4 },
  { href: "/templates", label: "Requirement Templates", phase: 6 },
  { href: "/settings/trades", label: "Trades & Divisions", phase: 6, disabled: true },
  { href: "/settings/billing", label: "Billing", phase: 16, disabled: true },
  { href: "/settings/integrations", label: "Integrations", phase: 15, disabled: true },
  { href: "/settings/api-keys", label: "API Keys", phase: 16, disabled: true },
  { href: "/settings/security", label: "Security & Audit", phase: 16, disabled: true }
] as const;

export const commandRoutes = globalNavigation
  .filter((item) => !("disabled" in item))
  .map(({ href, label }) => ({ href, label }));
