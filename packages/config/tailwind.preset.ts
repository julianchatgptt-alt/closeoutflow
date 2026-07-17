const semantic = (name: string) => `hsl(var(--${name}))`;

const preset = {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        background: semantic("background"),
        surface: {
          DEFAULT: semantic("surface"),
          raised: semantic("surface-raised"),
          sunken: semantic("surface-sunken")
        },
        foreground: semantic("foreground"),
        border: { DEFAULT: semantic("border"), strong: semantic("border-strong") },
        input: semantic("input"),
        ring: semantic("ring"),
        primary: {
          DEFAULT: semantic("primary"),
          hover: semantic("primary-hover"),
          active: semantic("primary-active"),
          foreground: semantic("primary-foreground")
        },
        muted: { DEFAULT: semantic("muted"), foreground: semantic("muted-foreground") },
        subtle: { foreground: semantic("subtle-foreground") },
        accent: { DEFAULT: semantic("accent"), foreground: semantic("accent-foreground") },
        destructive: {
          DEFAULT: semantic("destructive"),
          foreground: semantic("destructive-foreground")
        },
        success: tokenGroup("success"),
        warning: tokenGroup("warning"),
        danger: tokenGroup("danger"),
        info: tokenGroup("info"),
        "neutral-status": tokenGroup("neutral-status"),
        owner: tokenGroup("owner")
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)"
      },
      boxShadow: {
        card: "var(--shadow-card)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)"
      },
      fontFamily: { sans: "var(--font-sans)", mono: "var(--font-mono)" },
      zIndex: {
        sticky: "var(--z-sticky)",
        sidebar: "var(--z-sidebar)",
        header: "var(--z-header)",
        dropdown: "var(--z-dropdown)",
        overlay: "var(--z-overlay)",
        modal: "var(--z-modal)",
        command: "var(--z-command)",
        toast: "var(--z-toast)",
        tooltip: "var(--z-tooltip)"
      }
    }
  }
} as const;

function tokenGroup(name: string) {
  return {
    DEFAULT: semantic(`${name}-foreground`),
    foreground: semantic(`${name}-foreground`),
    subtle: semantic(`${name}-subtle`),
    border: semantic(`${name}-border`)
  };
}

export default preset;
