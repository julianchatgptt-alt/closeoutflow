import { SettingsNavigation } from "../../../components/shell/settings-navigation";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <SettingsNavigation>{children}</SettingsNavigation>;
}
