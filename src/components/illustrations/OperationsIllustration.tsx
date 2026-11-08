import { cn } from "@/lib/utils";

export type OperationsIllustrationVariant =
  | "property"
  | "people"
  | "access"
  | "finance"
  | "search"
  | "generic";

const illustrationLabels: Record<OperationsIllustrationVariant, string> = {
  property: "Property and place illustration",
  people: "People and relationships illustration",
  access: "Access and checkpoint illustration",
  finance: "Finance and collection illustration",
  search: "No matching records illustration",
  generic: "Operations workspace illustration",
};

export function OperationsIllustration({
  variant = "generic",
  className,
}: {
  variant?: OperationsIllustrationVariant;
  className?: string;
}) {
  return (
    <svg
      aria-label={illustrationLabels[variant]}
      className={cn("h-auto w-full max-w-[9.5rem]", className)}
      viewBox="0 0 168 112"
      fill="none"
      role="img"
    >
      <path
        d="M15 96.5h138"
        stroke="var(--vms-line)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="137" cy="24" r="17" fill="var(--vms-coral-soft)" />
      <path
        d="M130 24h14M137 17v14"
        stroke="var(--vms-coral)"
        strokeOpacity=".45"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {variant === "property" ? (
        <>
          <path
            d="M38 91V42.5L76 24l38 18.5V91"
            fill="var(--vms-surface)"
            stroke="var(--vms-ink)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M49 52h17v13H49zM78 52h17v13H78zM64 74h15v17H64z"
            fill="var(--vms-surface-subtle)"
            stroke="var(--vms-ink-muted)"
          />
          <path
            d="M25 91h82"
            stroke="var(--vms-ink)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M122 91V59l17-8v40"
            fill="var(--vms-surface-subtle)"
            stroke="var(--vms-ink-muted)"
          />
          <path
            d="M38 42.5h76"
            stroke="var(--vms-coral)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      ) : null}

      {variant === "people" ? (
        <>
          <circle
            cx="61"
            cy="47"
            r="10"
            fill="var(--vms-surface)"
            stroke="var(--vms-ink)"
            strokeWidth="2"
          />
          <circle
            cx="102"
            cy="49"
            r="8"
            fill="var(--vms-surface)"
            stroke="var(--vms-ink-muted)"
            strokeWidth="2"
          />
          <path
            d="M43 91c1.5-17 8-26 18-26s16.5 9 18 26"
            fill="var(--vms-surface)"
            stroke="var(--vms-ink)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M91 91c1-12 4.5-20 11-20 7.5 0 11 8 12 20"
            fill="var(--vms-surface-subtle)"
            stroke="var(--vms-ink-muted)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M72 50c11 1 19 1 29 1"
            stroke="var(--vms-coral)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="3 4"
          />
        </>
      ) : null}

      {variant === "access" ? (
        <>
          <rect
            x="49"
            y="26"
            width="70"
            height="65"
            rx="6"
            fill="var(--vms-surface)"
            stroke="var(--vms-ink)"
            strokeWidth="2"
          />
          <path
            d="M63 40h42M63 51h28M63 62h18"
            stroke="var(--vms-ink-muted)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M84 71v11M78 76h12"
            stroke="var(--vms-coral)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M31 42v49M137 42v49M31 50h18M119 50h18"
            stroke="var(--vms-line-strong)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle
            cx="129"
            cy="34"
            r="6"
            fill="var(--vms-success-subtle)"
            stroke="var(--vms-success)"
            strokeWidth="2"
          />
        </>
      ) : null}

      {variant === "finance" ? (
        <>
          <path
            d="M50 25h60l12 12v54H50z"
            fill="var(--vms-surface)"
            stroke="var(--vms-ink)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M110 25v13h12M64 48h42M64 58h30M64 72h22"
            stroke="var(--vms-ink-muted)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle
            cx="108"
            cy="75"
            r="14"
            fill="var(--vms-success-subtle)"
            stroke="var(--vms-success)"
            strokeWidth="2"
          />
          <path
            d="m102 75 4 4 8-9"
            stroke="var(--vms-success)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : null}

      {variant === "search" ? (
        <>
          <rect
            x="34"
            y="30"
            width="82"
            height="54"
            rx="6"
            fill="var(--vms-surface)"
            stroke="var(--vms-ink-muted)"
            strokeWidth="2"
          />
          <path
            d="M47 45h52M47 56h37M47 67h26"
            stroke="var(--vms-line-strong)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle
            cx="108"
            cy="69"
            r="18"
            fill="var(--vms-surface)"
            stroke="var(--vms-coral)"
            strokeWidth="3"
          />
          <path
            d="m121 82 13 13"
            stroke="var(--vms-coral)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      ) : null}

      {variant === "generic" ? (
        <>
          <rect
            x="43"
            y="29"
            width="82"
            height="58"
            rx="7"
            fill="var(--vms-surface)"
            stroke="var(--vms-ink)"
            strokeWidth="2"
          />
          <path
            d="M57 50h55M57 62h39M57 74h25"
            stroke="var(--vms-ink-muted)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M57 40h23"
            stroke="var(--vms-coral)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      ) : null}
    </svg>
  );
}
