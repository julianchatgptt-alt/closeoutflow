import type { SVGProps } from "react";

type LogoVariant = "brand" | "monochrome" | "inverse";

export function CloseoutMark({
  size = 32,
  compact = false,
  title,
  className = ""
}: {
  size?: number;
  compact?: boolean;
  title?: string;
  className?: string;
}) {
  const accessibility = title ? { role: "img", "aria-label": title } : { "aria-hidden": true };

  return (
    <svg
      {...accessibility}
      className={`shrink-0 ${className}`}
      focusable="false"
      height={size}
      viewBox="0 0 48 48"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={compact ? "M9 14v26" : "M8 14v26"}
        fill="none"
        stroke="currentColor"
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth={compact ? 6.5 : 6}
      />
      <path
        d={compact ? "M17 8h12l9 9-7 7" : "M16 8h13l9 9-7 7"}
        fill="none"
        stroke="currentColor"
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth={compact ? 6.5 : 6}
      />
      <path
        d={compact ? "M9 31h13l8 8 12-15" : "M8 31h14l8 8 12-15"}
        fill="none"
        stroke="currentColor"
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth={compact ? 6.5 : 6}
      />
      {!compact ? (
        <path
          d="M29 8v9h9"
          fill="none"
          opacity="0.34"
          stroke="currentColor"
          strokeLinecap="square"
          strokeLinejoin="miter"
          strokeWidth="2"
        />
      ) : null}
    </svg>
  );
}

export function CloseoutLogo({
  compact = false,
  variant = "brand",
  className = ""
}: {
  compact?: boolean;
  variant?: LogoVariant;
  className?: string;
}) {
  const markColor =
    variant === "inverse"
      ? "text-white"
      : variant === "monochrome"
        ? "text-current"
        : "text-primary";
  const wordColor = variant === "inverse" ? "text-white" : "text-foreground";

  return (
    <span
      aria-label="Closeout"
      className={`inline-flex min-w-0 items-center ${compact ? "gap-2.5" : "gap-3.5"} ${className}`}
      role="img"
    >
      <CloseoutMark className={markColor} compact={compact} size={compact ? 27 : 38} />
      <span
        aria-hidden="true"
        className={`${compact ? "text-[15px]" : "text-[22px]"} ${wordColor} font-semibold leading-none tracking-[-0.025em]`}
      >
        Closeout
      </span>
    </span>
  );
}

export function StaticCloseoutMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 48 48" {...props}>
      <path
        d="M8 14v26"
        fill="none"
        stroke="currentColor"
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth="6"
      />
      <path
        d="M16 8h13l9 9-7 7"
        fill="none"
        stroke="currentColor"
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth="6"
      />
      <path
        d="M8 31h14l8 8 12-15"
        fill="none"
        stroke="currentColor"
        strokeLinecap="square"
        strokeLinejoin="miter"
        strokeWidth="6"
      />
    </svg>
  );
}
