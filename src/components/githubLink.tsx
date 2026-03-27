import Image from "next/image";
import { buildUrl } from "@/utils/buildUrl";

export const GitHubLink = () => {
  const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL || buildUrl("/docs/");

  return (
    <div className="absolute right-0 z-10 m-24 grid gap-[8px] justify-items-end">
      <a
        draggable={false}
        href={docsUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        <div className="flex items-center gap-4 rounded-16 bg-[#0B57D0] p-8 hover:bg-[#0A4CB8] active:bg-[#083D93]">
          <span
            aria-hidden="true"
            className="material-symbols-outlined h-6 w-6 shrink-0 leading-none text-white"
          >
            description
          </span>
          <div className="font-bold text-white">Docs</div>
        </div>
      </a>
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
