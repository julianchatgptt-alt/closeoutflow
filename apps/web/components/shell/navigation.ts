import {
  BarChart3,
  Building2,
  ClipboardList,
  ContactRound,
  FolderKanban,
  LayoutDashboard,
  Settings,
  UsersRound,
  type LucideIcon
} from "lucide-react";

export type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Set only for destinations whose system does not exist yet. */
  disabled?: boolean;
  phase?: number;
};

export type NavigationGroup = {
  id: string;
  label: string;
  items: readonly NavigationItem[];
};

/**
 * The sidebar is grouped rather than one flat list: "Work" carries the surfaces
 * a project team uses daily, "Organization" carries the quieter utility
 * destinations. Templates stay first-class under Work — they are a core Phase 6
 * capability, not a setting.
 *
 * Destinations whose systems do not exist yet are `disabled` and carry a
 * "Later" chip. They are never presented as if they were reachable.
 */
export const navigationGroups: readonly NavigationGroup[] = [
  {
    id: "work",
    label: "Work",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/projects", label: "Projects", icon: FolderKanban },
      { href: "/companies", label: "Companies", icon: Building2 },
      { href: "/contacts", label: "Contacts", icon: ContactRound },
      { href: "/templates", label: "Templates", icon: ClipboardList }
    ]
  },
  {
    id: "organization",
    label: "Organization",
    items: [
      { href: "/settings/team", label: "Team", icon: UsersRound },
      { href: "/settings/organization", label: "Settings", icon: Settings },
      { href: "/reports", label: "Reports", icon: BarChart3, disabled: true, phase: 11 }
    ]
  }
];

export const globalNavigation: readonly NavigationItem[] = navigationGroups.flatMap(
  (group) => group.items
);

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

/** Only real, reachable destinations are offered in the command palette. */
export const commandRoutes = globalNavigation
  .filter((item) => !item.disabled)
  .map(({ href, label }) => ({ href, label }));
