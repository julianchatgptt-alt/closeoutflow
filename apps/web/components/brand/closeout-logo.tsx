import type { SVGProps } from "react";

type LogoVariant = "brand" | "monochrome" | "inverse";

const detailedMarkPath =
  "M14 6H34L42 14L34 22L28 16H20L16 20V28L20 32H28L34 26L42 34L34 42H14L6 34V14Z";
const compactMarkPath =
  "M14 6H33L41 14L34 21L29 16H21L16 21V27L21 32H29L34 27L41 34L33 42H14L6 34V14Z";

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
      <path d={compact ? compactMarkPath : detailedMarkPath} fill="currentColor" />
      {!compact && size >= 24 ? (
        <>
          <path d="M14 6L20 16L16 20L6 14Z" fill="#000000" opacity="0.14" />
          <path d="M6 34L16 28L20 32L14 42Z" fill="#000000" opacity="0.14" />
          <path d="M34 6L42 14L34 22L28 16Z" fill="#ffffff" opacity="0.1" />
        </>
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
      <path d={detailedMarkPath} fill="currentColor" />
      <path d="M14 6L20 16L16 20L6 14Z" fill="#000000" opacity="0.14" />
      <path d="M6 34L16 28L20 32L14 42Z" fill="#000000" opacity="0.14" />
      <path d="M34 6L42 14L34 22L28 16Z" fill="#ffffff" opacity="0.1" />
    </svg>
  );
}
