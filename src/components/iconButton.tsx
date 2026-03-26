import { ButtonHTMLAttributes } from "react";

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

type MaterialSymbolConfig = {
  ligature: string;
  filled?: boolean;
  className?: string;
};

const ICON_LABELS: Record<Exclude<IconName, "24/Dot">, string> = {
  "24/Microphone": "Microphone",
  "24/Send": "Send",
  "24/Menu": "Menu",
  "24/CommentFill": "Chat Log",
  "24/CommentOutline": "Chat Log",
  "24/Close": "Close",
};

const MATERIAL_SYMBOLS: Record<IconName, MaterialSymbolConfig> = {
  "24/Microphone": { ligature: "mic" },
  "24/Send": { ligature: "send" },
  "24/Menu": { ligature: "menu" },
  "24/CommentFill": { ligature: "chat_bubble", filled: true },
  "24/CommentOutline": { ligature: "chat_bubble" },
  "24/Close": { ligature: "close" },
  "24/Dot": { ligature: "more_horiz", className: "animate-pulse" },
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
  const { ligature, filled, className } = MATERIAL_SYMBOLS[iconName];

  return (
    <span
      aria-hidden={true}
      className={`material-symbols-outlined h-6 w-6 shrink-0 leading-none ${
        filled ? "material-symbols-filled" : ""
      } ${className ?? ""}`}
    >
      {ligature}
    </span>
  );
}
