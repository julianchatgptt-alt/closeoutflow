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
        border: {
          DEFAULT: semantic("border"),
          strong: semantic("border-strong"),
          hairline: semantic("hairline")
        },
        hairline: semantic("hairline"),
        nav: {
          DEFAULT: semantic("nav-item-fg"),
          active: semantic("nav-item-active-bg"),
          "active-accent": semantic("nav-item-active-accent"),
          "active-foreground": semantic("nav-item-active-fg")
        },
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
        raised: "var(--shadow-raised)",
        overlay: "var(--shadow-overlay)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)"
      },
      maxWidth: {
        content: "var(--content-max)",
        "content-wide": "var(--content-wide)",
        "content-reading": "var(--content-max-reading)",
        "content-form": "var(--content-max-form)"
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
