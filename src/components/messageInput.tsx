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
  placeholder = "メッセージを入力",
  onChangeUserMessage,
  onClickMicButton,
  onClickSendButton,
}: Props) => {
      return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-12 pb-12 sm:px-16 sm:pb-16">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8">
        <div className="pointer-events-auto w-full rounded-4 border border-[rgba(140,130,220,0.35)] bg-gradient-to-r from-[rgba(90,80,180,0.18)] via-[rgba(120,100,200,0.14)] to-[rgba(70,100,200,0.18)] p-8 text-white shadow-[0_8px_32px_rgba(40,30,100,0.22),inset_0_1px_0_rgba(180,170,255,0.2)] backdrop-blur-xl sm:p-10">
          <div className="grid grid-flow-col grid-cols-[min-content_1fr_min-content] gap-[8px] sm:gap-[10px]">
            <IconButton
              iconName="24/Microphone"
              className="rounded-4 border border-[rgba(130,120,230,0.45)] bg-[rgba(60,50,140,0.15)] text-white hover:border-[rgba(150,140,255,0.7)] hover:bg-[rgba(70,60,160,0.25)] hover:shadow-[0_0_14px_rgba(120,100,240,0.35)] active:border-[rgba(160,150,255,0.8)] active:bg-[rgba(80,70,180,0.3)] disabled:border-[rgba(130,120,230,0.15)] disabled:bg-[rgba(60,50,140,0.05)] disabled:text-white/30 disabled:shadow-none backdrop-blur-sm shadow-[0_0_6px_rgba(120,100,240,0.12)] transition-all duration-200 focus-visible:ring-[rgba(140,130,240,0.6)] focus-visible:ring-offset-transparent"
              isProcessing={isMicRecording}
              disabled={isChatProcessing}
              onClick={onClickMicButton}
            />
            <input
              type="text"
              placeholder={placeholder}
              onChange={onChangeUserMessage}
              disabled={isChatProcessing}
              className="disabled min-h-[52px] w-full rounded-4 border border-[rgba(130,120,230,0.3)] bg-[rgba(50,40,130,0.12)] px-16 text-white typography-16 font-bold placeholder:text-white/40 hover:border-[rgba(140,130,240,0.5)] hover:bg-[rgba(60,50,140,0.18)] hover:shadow-[0_0_10px_rgba(120,100,240,0.15)] focus:border-[rgba(150,140,255,0.6)] focus:bg-[rgba(60,50,140,0.2)] focus:shadow-[0_0_14px_rgba(120,100,240,0.25)] focus-visible:outline-none focus-visible:ring-0 disabled:border-[rgba(130,120,230,0.12)] disabled:bg-[rgba(50,40,130,0.05)] disabled:text-white/30 disabled:shadow-none backdrop-blur-sm shadow-[0_0_4px_rgba(120,100,240,0.08)] transition-all duration-200"
              value={userMessage}
            />

            <IconButton
              iconName="24/Send"
              className="rounded-4 border border-[rgba(130,120,230,0.45)] bg-[rgba(60,50,140,0.15)] text-white hover:border-[rgba(150,140,255,0.7)] hover:bg-[rgba(70,60,160,0.25)] hover:shadow-[0_0_14px_rgba(120,100,240,0.35)] active:border-[rgba(160,150,255,0.8)] active:bg-[rgba(80,70,180,0.3)] disabled:border-[rgba(130,120,230,0.15)] disabled:bg-[rgba(60,50,140,0.05)] disabled:text-white/30 disabled:shadow-none backdrop-blur-sm shadow-[0_0_6px_rgba(120,100,240,0.12)] transition-all duration-200 focus-visible:ring-[rgba(140,130,240,0.6)] focus-visible:ring-offset-transparent"
              isProcessing={isChatProcessing}
              disabled={isChatProcessing || !userMessage}
              onClick={onClickSendButton}
            />
          </div>
        </div>
        <div className="pointer-events-none px-8 text-center font-Montserrat text-[10px] uppercase tracking-[0.16em] text-white/80 drop-shadow-[0_1px_6px_rgba(0,0,0,0.28)] sm:text-[11px]">
          powered by VRoid, Gemini Live, @pixiv/three-vrm
        </div>
      </div>
    </div>
  );
};
