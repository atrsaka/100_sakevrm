import Image from "next/image";
import { buildUrl } from "@/utils/buildUrl";

export const GitHubLink = () => {
  return (
    <div className="absolute right-0 z-10 m-24">
      <a
        draggable={false}
        href="https://github.com/Sunwood-ai-labs/GeminiVRM"
        rel="noopener noreferrer"
        target="_blank"
      >
        <div className="flex rounded-16 bg-[#1F2328] p-8 hover:bg-[#33383E] active:bg-[565A60]">
          <Image
            alt="https://github.com/Sunwood-ai-labs/GeminiVRM"
            height={24}
            width={24}
            src={buildUrl("/github-mark-white.svg")}
          />
          <div className="mx-4 font-bold text-white">Source</div>
        </div>
      </a>
    </div>
  );
};
