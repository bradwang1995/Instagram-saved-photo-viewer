import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  EyeOff,
  Expand,
  Gauge,
  ImageOff,
  Pause,
  Play,
  Shuffle,
  SkipForward,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { TransitionPreset } from "../../db/schema";
import type { MediaQueueItem } from "../../features/media/mediaQueue";
import { InstagramBlockquoteEmbed } from "../posts/InstagramBlockquoteEmbed";

type CinematicStageProps = {
  item?: MediaQueueItem;
  index: number;
  total: number;
  sourceFrameCount: number;
  isPlaying: boolean;
  isShuffle: boolean;
  elapsedMs: number;
  dwellMs: number;
  transitionDurationMs: number;
  transitionPreset: TransitionPreset;
  onPrevious: () => void;
  onNext: () => void;
  onTogglePlaying: () => void;
  onToggleShuffle: () => void;
  onSkipSource: () => void;
  onHide: () => void;
  onOpenSettings: () => void;
  onFullscreen: () => void;
};

export function CinematicStage({
  item,
  index,
  total,
  sourceFrameCount,
  isPlaying,
  isShuffle,
  elapsedMs,
  dwellMs,
  transitionDurationMs,
  transitionPreset,
  onPrevious,
  onNext,
  onTogglePlaying,
  onToggleShuffle,
  onSkipSource,
  onHide,
  onOpenSettings,
  onFullscreen,
}: CinematicStageProps) {
  const stageRef = useRef<HTMLElement>(null);
  const [imageState, setImageState] = useState<"loading" | "ready" | "failed">(
    "loading",
  );

  useEffect(() => {
    setImageState("loading");
  }, [item?.media.id]);

  useGSAP(
    () => {
      const media =
        stageRef.current?.querySelector<HTMLElement>(".cinematic-media");
      if (!media || !item) return;

      const duration = Math.max(0.15, transitionDurationMs / 1000);
      gsap.killTweensOf(media);
      gsap.set(media, { clearProps: "all" });

      switch (transitionPreset) {
        case "directional-wipe":
          gsap.fromTo(
            media,
            { clipPath: "inset(0 100% 0 0)", opacity: 0.7 },
            {
              clipPath: "inset(0 0% 0 0)",
              opacity: 1,
              duration,
              ease: "power3.inOut",
            },
          );
          break;
        case "depth-zoom":
          gsap.fromTo(
            media,
            { scale: 1.12, opacity: 0 },
            { scale: 1, opacity: 1, duration, ease: "power3.out" },
          );
          break;
        case "film-burn":
          gsap.fromTo(
            media,
            { opacity: 0, filter: "sepia(1) brightness(2.2) contrast(0.7)" },
            {
              opacity: 1,
              filter: "sepia(0) brightness(1) contrast(1)",
              duration,
              ease: "expo.out",
            },
          );
          break;
        case "rgb-split":
          gsap.fromTo(
            media,
            { x: -22, opacity: 0, filter: "hue-rotate(48deg) saturate(1.8)" },
            {
              x: 0,
              opacity: 1,
              filter: "hue-rotate(0deg) saturate(1)",
              duration,
              ease: "power2.out",
            },
          );
          break;
        case "ken-burns":
          gsap.fromTo(
            media,
            { scale: 1.015, opacity: 0 },
            {
              scale: 1.075,
              opacity: 1,
              duration: Math.max(duration, dwellMs / 1000),
              ease: "none",
            },
          );
          break;
        default:
          gsap.fromTo(
            media,
            { opacity: 0 },
            { opacity: 1, duration, ease: "power2.out" },
          );
      }
    },
    {
      scope: stageRef,
      dependencies: [
        item?.media.id,
        transitionPreset,
        transitionDurationMs,
        dwellMs,
      ],
      revertOnUpdate: true,
    },
  );

  const creator = item?.media.creatorHandle ?? item?.post.embedAuthorName;
  const collection = item?.post.collectionNames[0];
  const progress = dwellMs > 0 ? Math.min(1, elapsedMs / dwellMs) : 0;

  return (
    <section
      className="cinematic-stage"
      ref={stageRef}
      aria-label="Cinematic media viewer"
    >
      <header className="stage-header">
        <div className="stage-identity">
          <span className="stage-kicker">
            {creator ?? collection ?? "Saved source"}
          </span>
          <strong>
            {item?.media.caption ?? item?.post.title ?? "Media preview"}
          </strong>
          {item ? (
            <span>
              Frame {item.media.sourceIndex + 1} of {sourceFrameCount} ·{" "}
              {item.media.sourceKind === "embed"
                ? "Instagram embed compatibility"
                : "Resolved media"}
            </span>
          ) : null}
        </div>
        <div className="stage-header-actions">
          <span className="stage-counter" aria-live="polite">
            {total === 0
              ? "00 / 00"
              : `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`}
          </span>
          <button
            className="cinematic-icon-button"
            onClick={onFullscreen}
            aria-label="Enter fullscreen"
            title="Enter fullscreen"
          >
            <Expand size={17} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="stage-canvas">
        {item?.media.assetUrl ? (
          <>
            {imageState === "loading" ? (
              <div className="stage-loading">Preparing frame…</div>
            ) : null}
            <img
              key={item.media.id}
              className={`cinematic-media${imageState === "ready" ? " ready" : ""}`}
              src={item.media.assetUrl}
              alt={
                item.media.caption ??
                `Saved media by ${creator ?? "unknown creator"}`
              }
              onLoad={() => setImageState("ready")}
              onError={() => setImageState("failed")}
            />
            {imageState === "failed" ? (
              <UnavailableState sourceUrl={item.post.canonicalUrl} />
            ) : null}
          </>
        ) : item ? (
          <InstagramBlockquoteEmbed key={item.media.id} post={item.post} />
        ) : (
          <UnavailableState />
        )}

        {item ? (
          <div className="stage-quick-actions">
            <button
              className="cinematic-icon-button"
              onClick={onHide}
              aria-label="Hide this media"
              title="Hide this media (H)"
            >
              <EyeOff size={17} aria-hidden="true" />
            </button>
            <a
              className="cinematic-icon-button"
              href={item.post.canonicalUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Open source on Instagram"
              title="Open source on Instagram"
            >
              <ExternalLink size={17} aria-hidden="true" />
            </a>
          </div>
        ) : null}
      </div>

      <footer className="stage-controls" aria-label="Playback controls">
        <div className="transport-row">
          <button
            className={`cinematic-icon-button${isShuffle ? " active" : ""}`}
            onClick={onToggleShuffle}
            aria-pressed={isShuffle}
            aria-label="Shuffle media"
            title="Shuffle media"
          >
            <Shuffle size={18} aria-hidden="true" />
          </button>
          <button
            className="cinematic-icon-button"
            onClick={onPrevious}
            disabled={total < 2}
            aria-label="Previous media"
            title="Previous media"
          >
            <ChevronLeft size={21} aria-hidden="true" />
          </button>
          <button
            className="play-or-pause"
            onClick={onTogglePlaying}
            disabled={total < 2}
            aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
          >
            {isPlaying ? (
              <Pause size={24} fill="currentColor" aria-hidden="true" />
            ) : (
              <Play size={24} fill="currentColor" aria-hidden="true" />
            )}
          </button>
          <button
            className="cinematic-icon-button"
            onClick={onNext}
            disabled={total < 2}
            aria-label="Next media"
            title="Next media"
          >
            <ChevronRight size={21} aria-hidden="true" />
          </button>
          <button
            className="cinematic-icon-button"
            onClick={onSkipSource}
            disabled={!item || total < 2}
            aria-label="Skip remaining media in this post"
            title="Skip this source post (S)"
          >
            <SkipForward size={18} aria-hidden="true" />
          </button>
          <button
            className="cinematic-icon-button stage-settings-trigger"
            onClick={onOpenSettings}
            aria-label="Open playback settings"
            title="Playback settings"
          >
            <Gauge size={18} aria-hidden="true" />
            <span>{Math.round(dwellMs / 1000)}s</span>
          </button>
        </div>

        <div className="playback-timeline">
          <progress
            max={1}
            value={progress}
            aria-label="Current slide progress"
          />
          <div>
            <span>{formatClock(elapsedMs)}</span>
            <span>
              {isPlaying ? "Playing" : "Paused"} ·{" "}
              {humanizePreset(transitionPreset)}
            </span>
            <span>{formatClock(dwellMs)}</span>
          </div>
        </div>
      </footer>
    </section>
  );
}

function UnavailableState({ sourceUrl }: { sourceUrl?: string }) {
  return (
    <div className="stage-unavailable">
      <span className="unavailable-icon">
        <ImageOff size={34} aria-hidden="true" />
      </span>
      <h2>{sourceUrl ? "Preview unavailable" : "No media in this session"}</h2>
      <p>
        {sourceUrl
          ? "This source is iframe-only, private, removed, or blocked. The library keeps its provenance without pretending the media was resolved."
          : "Import a saved-post JSON file or loosen the current filters."}
      </p>
      {sourceUrl ? (
        <a href={sourceUrl} target="_blank" rel="noreferrer">
          Open original source <ExternalLink size={15} aria-hidden="true" />
        </a>
      ) : null}
    </div>
  );
}

function formatClock(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `00:${String(seconds).padStart(2, "0")}`;
}

function humanizePreset(preset: TransitionPreset) {
  return preset
    .split("-")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
