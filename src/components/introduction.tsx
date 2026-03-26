import { useCallback, useState } from "react";
import { Link } from "./link";

type Props = {
  geminiApiKey: string;
  onChangeGeminiApiKey: (apiKey: string) => void;
};

export const Introduction = ({
  geminiApiKey,
  onChangeGeminiApiKey,
}: Props) => {
  const [opened, setOpened] = useState(true);

  const handleApiKeyChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChangeGeminiApiKey(event.target.value);
    },
    [onChangeGeminiApiKey]
  );

  return opened ? (
    <div className="absolute z-40 h-full w-full bg-black/30 px-24 py-40 font-M_PLUS_2">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-title"
        aria-describedby="intro-description"
        className="mx-auto my-auto max-h-full max-w-3xl overflow-auto rounded-16 bg-white p-24"
      >
        <div className="my-24">
          <div
            id="intro-title"
            className="my-8 typography-20 font-bold text-secondary"
          >
            Gemini Live VRM chat
          </div>
          <div id="intro-description">
            This build keeps the original ChatVRM browser viewer and input flow,
            but swaps the response path to Gemini Live native audio.
          </div>
        </div>

        <div className="my-24">
          <div className="my-8 typography-20 font-bold text-secondary">
            References
          </div>
          <div>
            VRM rendering uses{" "}
            <Link url="https://github.com/pixiv/three-vrm" label="@pixiv/three-vrm" />
            . The base application comes from{" "}
            <Link url="https://github.com/pixiv/ChatVRM" label="pixiv/ChatVRM" />.
            Gemini Live uses the official{" "}
            <Link
              url="https://ai.google.dev/gemini-api/docs/live-api"
              label="Gemini Live API"
            />{" "}
            via{" "}
            <Link
              url="https://www.npmjs.com/package/@google/genai"
              label="@google/genai"
            />
            .
          </div>
        </div>

        <div className="my-24">
          <label
            htmlFor="intro-gemini-api-key"
            className="my-8 block typography-20 font-bold text-secondary"
          >
            Gemini API key
          </label>
          <input
            id="intro-gemini-api-key"
            type="password"
            placeholder="AIza..."
            value={geminiApiKey}
            onChange={handleApiKeyChange}
            aria-describedby="intro-gemini-api-key-help"
            className="my-4 h-40 w-full rounded-4 bg-surface3 px-16 py-8 text-ellipsis hover:bg-surface3-hover"
          />
          <div id="intro-gemini-api-key-help">
            Create a key in{" "}
            <Link
              url="https://aistudio.google.com/apikey"
              label="Google AI Studio"
            />
            . This local version sends the key from the browser, similar to the
            original ChatVRM setup style.
          </div>
        </div>

        <div className="my-24">
          <div className="rounded-8 bg-surface3 px-16 py-12 text-sm text-secondary">
            Advanced settings such as the live model and voice name are
            available from the Settings panel after launch.
          </div>
        </div>

        <div className="my-24">
          <button
            onClick={() => setOpened(false)}
            className="rounded-oval bg-secondary px-24 py-8 font-bold text-white hover:bg-secondary-hover active:bg-secondary-press"
          >
            Start
          </button>
        </div>
      </div>
    </div>
  ) : null;
};
