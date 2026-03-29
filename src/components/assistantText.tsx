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
      ? "bottom-[136px] sm:bottom-[148px]"
      : "bottom-[116px] sm:bottom-[128px]";

  return (
    <div className={`absolute inset-x-0 z-10 ${bottomOffsetClass}`}>
      <div className="mx-auto w-full max-w-3xl px-[12px] sm:px-[16px]">
        <div
          className="overflow-hidden rounded-[26px] border border-white/90 bg-[rgba(255,248,251,0.97)] shadow-[0_24px_56px_rgba(58,25,37,0.28)] backdrop-blur-md ring-1 ring-[#6a466f]/10"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="bg-secondary px-[20px] py-[10px] text-[12px] font-bold tracking-[0.18em] text-white sm:px-[24px] sm:py-[12px] sm:text-[13px]">
            {speakerName || "CHARACTER"}
          </div>
          <div className="min-h-[88px] bg-[linear-gradient(180deg,rgba(255,255,255,0.99)_0%,rgba(255,242,247,0.97)_100%)] px-[20px] py-[20px] sm:min-h-[96px] sm:px-[24px] sm:py-[24px]">
            {status ? (
              <div className="mb-8 text-[12px] font-semibold leading-relaxed text-[#8d6178] sm:text-[13px]">
                {status}
              </div>
            ) : null}
            {shouldShowMessage ? (
              <div className="line-clamp-3 text-secondary typography-16 font-semibold leading-[1.7] sm:line-clamp-4">
                {normalizedMessage}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
