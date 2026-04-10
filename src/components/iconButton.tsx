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
      className={`border border-[rgba(130,120,230,0.45)] bg-[rgba(60,50,140,0.15)] backdrop-blur-xl hover:border-[rgba(150,140,255,0.7)] hover:bg-[rgba(70,60,160,0.25)] hover:shadow-[0_0_16px_rgba(120,100,240,0.35),0_0_4px_rgba(120,100,240,0.2),inset_0_1px_0_rgba(200,190,255,0.2)] active:border-[rgba(160,150,255,0.8)] active:bg-[rgba(80,70,180,0.3)] disabled:border-[rgba(130,120,230,0.15)] disabled:bg-[rgba(60,50,140,0.05)] disabled:text-white/30 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(140,130,240,0.6)] focus-visible:ring-offset-1 focus-visible:ring-offset-transparent text-white shadow-[0_0_8px_rgba(120,100,240,0.15),inset_0_1px_0_rgba(180,170,255,0.12)] transition-all duration-200 rounded-4 text-sm p-8 min-h-[48px] min-w-[48px] text-center inline-flex items-center justify-center mr-2 ${
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
