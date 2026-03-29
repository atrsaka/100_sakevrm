import { IconButton } from "./iconButton";

type Props = {
  userMessage: string;
  isMicRecording: boolean;
  isChatProcessing: boolean;
  placeholder?: string;
  onChangeUserMessage: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onClickSendButton: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onClickMicButton: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export const MessageInput = ({
  userMessage,
  isMicRecording,
  isChatProcessing,
  placeholder = "Type a message",
  onChangeUserMessage,
  onClickMicButton,
  onClickSendButton,
}: Props) => {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-12 pb-12 sm:px-16 sm:pb-16">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8">
        <div className="pointer-events-auto w-full rounded-[28px] border border-white/65 bg-base/92 p-10 text-black shadow-[0_20px_50px_rgba(64,43,23,0.18)] backdrop-blur-md sm:p-12">
          <div className="grid grid-flow-col grid-cols-[min-content_1fr_min-content] gap-[8px] sm:gap-[10px]">
            <IconButton
              iconName="24/Microphone"
              className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled"
              isProcessing={isMicRecording}
              disabled={isChatProcessing}
              onClick={onClickMicButton}
            />
            <input
              type="text"
              placeholder={placeholder}
              onChange={onChangeUserMessage}
              disabled={isChatProcessing}
              className="disabled bg-surface1 hover:bg-surface1-hover focus:bg-surface1 disabled:bg-surface1-disabled disabled:text-primary-disabled min-h-[52px] w-full rounded-16 px-16 text-text-primary typography-16 font-bold"
              value={userMessage}
            />

            <IconButton
              iconName="24/Send"
              className="bg-secondary hover:bg-secondary-hover active:bg-secondary-press disabled:bg-secondary-disabled"
              isProcessing={isChatProcessing}
              disabled={isChatProcessing || !userMessage}
              onClick={onClickSendButton}
            />
          </div>
        </div>
        <div className="pointer-events-none px-8 text-center font-Montserrat text-[10px] uppercase tracking-[0.16em] text-white/80 drop-shadow-[0_1px_6px_rgba(0,0,0,0.28)] sm:text-[11px]">
          powered by VRoid, Gemini Live, and @pixiv/three-vrm
        </div>
      </div>
    </div>
  );
};
