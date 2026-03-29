import { InteractionMode } from "@/features/podcast/podcastConfig";

type Props = {
  message: string;
  status?: string;
  speakerName?: string;
  interactionMode?: InteractionMode;
};

export const AssistantText = ({
  message,
  status,
  speakerName,
  interactionMode = "chat",
}: Props) => {
  const normalizedMessage = message.replace(/\[([a-zA-Z]*?)\]/g, "");
  const shouldShowMessage = normalizedMessage !== "" && normalizedMessage !== status;
  const bottomOffsetClass =
    interactionMode === "podcast"
      ? "bottom-[128px] sm:bottom-[136px]"
      : "bottom-[104px] sm:bottom-[112px]";

  return (
    <div className={`absolute inset-x-0 z-10 ${bottomOffsetClass}`}>
      <div className="mx-auto w-full max-w-3xl px-12 sm:px-16">
        <div
          className="overflow-hidden rounded-[22px] border border-white/70 bg-white/92 shadow-[0_18px_40px_rgba(83,38,46,0.18)] backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="bg-secondary px-20 py-8 text-sm font-bold tracking-wide text-white sm:px-24">
            {speakerName || "CHARACTER"}
          </div>
          <div className="px-20 py-14 sm:px-24 sm:py-16">
            {status ? (
              <div className="mb-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary sm:text-xs">
                {status}
              </div>
            ) : null}
            {shouldShowMessage ? (
              <div className="line-clamp-3 text-secondary typography-16 font-bold sm:line-clamp-4">
                {normalizedMessage}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
