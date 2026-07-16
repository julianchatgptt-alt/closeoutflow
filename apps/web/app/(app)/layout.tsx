import { AppShell } from "../../components/shell/app-shell";

export default function InternalAppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
