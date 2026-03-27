import { useEffect, useRef } from "react";
import { Message } from "@/features/messages/messages";
type Props = {
  messages: Message[];
};
export const ChatLog = ({ messages }: Props) => {
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({
      behavior: "auto",
      block: "center",
    });
  }, []);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [messages]);
  return (
    <div className="absolute w-col-span-6 max-w-full h-[100svh] pb-64">
      <div className="max-h-full px-16 pt-104 pb-64 overflow-y-auto scroll-hidden">
        {messages.map((msg, i) => {
          return (
            <div key={i} ref={messages.length - 1 === i ? chatScrollRef : null}>
              <Chat message={msg} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Chat = ({ message }: { message: Message }) => {
  const roleColor =
    message.role === "assistant"
      ? "bg-secondary text-white "
      : message.source === "youtube"
        ? "bg-primary text-white"
        : "bg-base text-primary";
  const roleText =
    message.role === "assistant"
      ? "text-secondary"
      : message.source === "youtube"
        ? "text-primary"
        : "text-primary";
  const offsetX = message.role === "user" ? "pl-40" : "pr-40";
  const label =
    message.role === "assistant"
      ? "CHARACTER"
      : message.source === "youtube"
        ? `YOUTUBE ${message.name ?? "Viewer"}`
        : message.name ?? "YOU";
  const bodyText = message.displayContent ?? message.content;

  return (
    <div className={`mx-auto max-w-sm my-16 ${offsetX}`}>
      <div
        className={`px-24 py-8 rounded-t-8 font-bold tracking-wider ${roleColor}`}
      >
        {label}
      </div>
      <div className="px-24 py-16 bg-white rounded-b-8">
        <div className={`typography-16 font-bold ${roleText}`}>{bodyText}</div>
      </div>
    </div>
  );
};
