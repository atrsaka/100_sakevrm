import { ButtonHTMLAttributes, SVGProps } from "react";

export type IconName =
  | "24/Microphone"
  | "24/Send"
  | "24/Menu"
  | "24/CommentFill"
  | "24/CommentOutline"
  | "24/Close"
  | "24/Dot";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  iconName: Exclude<IconName, "24/Dot">;
  isProcessing: boolean;
  label?: string;
};

const ICON_LABELS: Record<Exclude<IconName, "24/Dot">, string> = {
  "24/Microphone": "Microphone",
  "24/Send": "Send",
  "24/Menu": "Menu",
  "24/CommentFill": "Chat log",
  "24/CommentOutline": "Chat log",
  "24/Close": "Close",
};

export const IconButton = ({
  iconName,
  isProcessing,
  label,
  ...rest
}: Props) => {
  const renderedIconName: IconName = isProcessing ? "24/Dot" : iconName;
  const accessibleLabel = rest["aria-label"] ?? label ?? getIconLabel(iconName);
  const buttonType = rest.type ?? "button";

  return (
    <button
      {...rest}
      type={buttonType}
      aria-label={accessibleLabel}
      className={`bg-primary hover:bg-primary-hover active:bg-primary-press disabled:bg-primary-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-black/20 text-white rounded-16 text-sm p-8 min-h-[48px] min-w-[48px] text-center inline-flex items-center justify-center mr-2 ${
        rest.className ?? ""
      }`}
    >
      <AppIcon iconName={renderedIconName} />
      {label && <div className="mx-4 font-bold">{label}</div>}
    </button>
  );
};

function getIconLabel(iconName: Exclude<IconName, "24/Dot">) {
  return ICON_LABELS[iconName];
}

function AppIcon({ iconName }: { iconName: IconName }) {
  const commonProps: SVGProps<SVGSVGElement> = {
    "aria-hidden": true,
    className: "h-6 w-6 shrink-0",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: 2,
    viewBox: "0 0 24 24",
  };

  switch (iconName) {
    case "24/Microphone":
      return (
        <svg {...commonProps}>
          <rect x="9" y="3.5" width="6" height="11" rx="3" />
          <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0" />
          <path d="M12 17v3.5" />
          <path d="M9 20.5h6" />
        </svg>
      );
    case "24/Send":
      return (
        <svg {...commonProps}>
          <path d="M4 11.5 20 4l-4.5 16-3.5-6-8-2.5Z" />
          <path d="M12 14 20 4" />
        </svg>
      );
    case "24/Menu":
      return (
        <svg {...commonProps}>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      );
    case "24/CommentFill":
      return (
        <svg {...commonProps} fill="currentColor" stroke="none">
          <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v7a2.5 2.5 0 0 1-2.5 2.5h-4.1L8 18.8V15H7.5A2.5 2.5 0 0 1 5 12.5v-7Z" />
        </svg>
      );
    case "24/CommentOutline":
      return (
        <svg {...commonProps}>
          <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v7a2.5 2.5 0 0 1-2.5 2.5h-4.1L8 18.8V15H7.5A2.5 2.5 0 0 1 5 12.5v-7Z" />
        </svg>
      );
    case "24/Close":
      return (
        <svg {...commonProps}>
          <path d="M6 6 18 18" />
          <path d="M18 6 6 18" />
        </svg>
      );
    case "24/Dot":
      return (
        <svg
          aria-hidden={true}
          className="h-6 w-6 shrink-0 animate-pulse"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <circle cx="6" cy="12" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="18" cy="12" r="1.75" />
        </svg>
      );
    default:
      return null;
  }
}
