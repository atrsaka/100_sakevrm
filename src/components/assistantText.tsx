type Props = {
  message: string;
  status?: string;
};

export const AssistantText = ({ message, status }: Props) => {
  return (
    <div className="absolute bottom-0 left-0 mb-104  w-full">
      <div className="mx-auto max-w-4xl w-full p-16">
        <div className="bg-white rounded-8">
          <div className="px-24 py-8 bg-secondary rounded-t-8 text-white font-bold tracking-wider">
            CHARACTER
          </div>
          <div className="px-24 py-16">
            {status ? (
              <div className="mb-8 text-xs font-semibold uppercase tracking-wide text-primary">
                {status}
              </div>
            ) : null}
            <div className="line-clamp-4 text-secondary typography-16 font-bold">
              {message.replace(/\[([a-zA-Z]*?)\]/g, "")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
