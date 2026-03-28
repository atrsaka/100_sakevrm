import { useEffect, useRef, useState } from "react";
import { Viewer } from "@/features/vrmViewer/viewer";
import {
  DEFAULT_PODCAST_PARTICIPANTS,
  type PodcastParticipant,
  type PodcastSpeakerId,
} from "@/features/podcast/podcastConfig";
import { buildUrl } from "@/utils/buildUrl";

export type PodcastViewerRegistry = Partial<Record<PodcastSpeakerId, Viewer>>;

export type PodcastStageProps = {
  participants?: readonly [PodcastParticipant, PodcastParticipant];
  activeSpeakerId?: PodcastSpeakerId | null;
  onViewersReady?: (viewers: PodcastViewerRegistry) => void;
  className?: string;
};

const DEFAULT_PARTICIPANTS: [PodcastParticipant, PodcastParticipant] = [
  DEFAULT_PODCAST_PARTICIPANTS.yukito,
  DEFAULT_PODCAST_PARTICIPANTS.kiyoka,
];

type PodcastStageCardProps = {
  align: "left" | "right";
  participant: PodcastParticipant;
  isActive: boolean;
  viewer: Viewer;
};

export function PodcastStage({
  participants = DEFAULT_PARTICIPANTS,
  activeSpeakerId = null,
  onViewersReady,
  className,
}: PodcastStageProps) {
  const [leftParticipant, rightParticipant] = participants;
  const [leftViewer] = useState(() => new Viewer());
  const [rightViewer] = useState(() => new Viewer());
  const onViewersReadyRef = useRef(onViewersReady);

  useEffect(() => {
    onViewersReadyRef.current = onViewersReady;
  }, [onViewersReady]);

  useEffect(() => {
    if (!onViewersReadyRef.current) {
      return;
    }

    onViewersReadyRef.current({
      [leftParticipant.id]: leftViewer,
      [rightParticipant.id]: rightViewer,
    });
  }, [
    leftParticipant.id,
    leftViewer,
    rightParticipant.id,
    rightViewer,
  ]);

  if (!leftParticipant || !rightParticipant) {
    return null;
  }

  return (
    <section
      aria-label="Podcast stage"
      className={["absolute inset-0 z-0", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="pointer-events-none absolute inset-x-0 top-16 z-20 hidden justify-center px-16 sm:flex">
        <div className="rounded-full border border-white/70 bg-black/45 px-16 py-8 text-xs font-bold uppercase tracking-[0.24em] text-white shadow-lg backdrop-blur-sm">
          {activeSpeakerId
            ? `Podcast Stage - ${
                activeSpeakerId === leftParticipant.id
                  ? leftParticipant.displayName
                  : rightParticipant.displayName
              } on mic`
          : "Podcast Stage"}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-y-[20%] left-1/2 z-[3] hidden w-24 -translate-x-1/2 rounded-full bg-white/15 blur-3xl sm:block" />
      <div className="flex h-full w-full overflow-hidden">
        <PodcastStageCard
          align="left"
          participant={leftParticipant}
          viewer={leftViewer}
          isActive={activeSpeakerId === leftParticipant.id}
        />
        <PodcastStageCard
          align="right"
          participant={rightParticipant}
          viewer={rightViewer}
          isActive={activeSpeakerId === rightParticipant.id}
        />
      </div>
    </section>
  );
}

function PodcastStageCard({
  align,
  participant,
  isActive,
  viewer,
}: PodcastStageCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelUrl = buildUrl(participant.vrmPath);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    viewer.setup(canvas);
    void viewer.loadVrm(modelUrl);

    return () => {
      viewer.unloadVRM();
    };
  }, [modelUrl, viewer]);

  return (
    <article
      className={`relative flex h-full min-h-0 flex-1 overflow-hidden transition duration-300 ${
        align === "left"
          ? "-mr-16 sm:-mr-20 md:-mr-24"
          : "-ml-16 sm:-ml-20 md:-ml-24"
      } ${
        isActive
          ? "z-[2] brightness-105"
          : "z-[1] opacity-90"
      }`}
      aria-label={`${participant.displayName} stage, ${
        isActive ? "speaking" : "listening"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 z-[1] transition duration-300 ${
          isActive
            ? "bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_62%)]"
            : "bg-transparent"
        }`}
      />
      <header
        className={`absolute top-12 z-10 flex items-center gap-8 rounded-full bg-black/45 px-10 py-5 text-[10px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur-sm sm:top-20 sm:px-12 sm:py-6 sm:text-xs ${
          align === "left" ? "left-12 sm:left-16" : "right-12 sm:right-16"
        }`}
      >
        <span>{participant.displayName}</span>
        {isActive ? (
          <span className="rounded-full bg-amber-300 px-8 py-2 text-[10px] text-black">
            Speaking
          </span>
        ) : (
          <span className="rounded-full bg-white/20 px-8 py-2 text-[10px] text-white/90">
            Listening
          </span>
        )}
      </header>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-black/30 to-transparent" />
      <canvas
        ref={canvasRef}
        className={`h-full w-full touch-none transition duration-300 ${
          isActive ? "scale-[1.03]" : "scale-100"
        } ${
          align === "left"
            ? "-translate-x-[4%] sm:-translate-x-[3%] [mask-image:linear-gradient(to_right,black_0%,black_76%,transparent_100%)]"
            : "translate-x-[4%] sm:translate-x-[3%] [mask-image:linear-gradient(to_left,black_0%,black_76%,transparent_100%)]"
        }`}
        aria-label={`${participant.displayName} avatar canvas`}
      />
    </article>
  );
}
