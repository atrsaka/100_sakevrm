type Props = {
  message: string;
  status?: string;
  speakerName?: string;
};

export const AssistantText = ({ message, status, speakerName }: Props) => {
  const normalizedMessage = message.replace(/\[([a-zA-Z]*?)\]/g, "");
  const shouldShowMessage = normalizedMessage !== "" && normalizedMessage !== status;

  return (
    <div className="absolute bottom-0 left-0 mb-104  w-full">
      <div className="mx-auto max-w-4xl w-full p-16">
        <div
          className="bg-white rounded-8"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="px-24 py-8 bg-secondary rounded-t-8 text-white font-bold tracking-wider">
            {speakerName || "CHARACTER"}
          </div>
          <div className="px-24 py-16">
            {status ? (
              <div className="mb-8 text-xs font-semibold uppercase tracking-wide text-primary">
                {status}
              </div>
            ) : null}
            {shouldShowMessage ? (
              <div className="line-clamp-4 text-secondary typography-16 font-bold">
                {normalizedMessage}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
