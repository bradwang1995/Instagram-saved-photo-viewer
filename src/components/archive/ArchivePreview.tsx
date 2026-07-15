import { useGSAP } from "@gsap/react";
import {
  EyeOff,
  Grid2X2,
  MoveHorizontal,
  Play,
  Search,
  Settings2,
  Upload,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent,
} from "react";
import gsap from "gsap";
import type { MediaQueueItem } from "../../features/media/mediaQueue";
import { ArchiveMediaCard } from "./ArchiveMediaCard";

export type ArchiveViewMode = "ribbon" | "grid";

type ArchivePreviewProps = {
  items: MediaQueueItem[];
  selectedId?: string;
  hiddenCount: number;
  sourceFrameCounts: Record<string, number>;
  viewMode: ArchiveViewMode;
  hasFilters: boolean;
  isDemo: boolean;
  isImporting: boolean;
  onSelect: (mediaId: string) => void;
  onHide: (item: MediaQueueItem) => void;
  onImport: () => void;
  onOpenFilters: () => void;
  onOpenSettings: () => void;
  onViewModeChange: (mode: ArchiveViewMode) => void;
  onStartSlideshow: () => void;
};

export function ArchivePreview({
  items,
  selectedId,
  hiddenCount,
  sourceFrameCounts,
  viewMode,
  hasFilters,
  isDemo,
  isImporting,
  onSelect,
  onHide,
  onImport,
  onOpenFilters,
  onOpenSettings,
  onViewModeChange,
  onStartSlideshow,
}: ArchivePreviewProps) {
  const rootRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollFrame = useRef<number>();
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.media.id === selectedId),
  );
  const selectedItem = items[selectedIndex];
  const creator =
    selectedItem?.media.creatorHandle ??
    selectedItem?.post.embedAuthorName ??
    "Instagram source";
  const progress = items.length ? ((selectedIndex + 1) / items.length) * 100 : 0;

  const label = useMemo(() => {
    if (items.length === 0) return "No visible media";
    return `${items.length.toLocaleString()} media · ${new Set(items.map((item) => item.post.id)).size.toLocaleString()} sources`;
  }, [items]);

  useGSAP(
    () => {
      gsap.fromTo(
        ".archive-watermark span",
        { yPercent: 105 },
        {
          yPercent: 0,
          duration: 1.05,
          stagger: 0.055,
          ease: "power4.out",
        },
      );
      gsap.fromTo(
        ".archive-dock",
        { yPercent: 120 },
        { yPercent: 0, duration: 0.8, delay: 0.45, ease: "power3.out" },
      );
    },
    { scope: rootRef },
  );

  useEffect(() => {
    if (viewMode !== "ribbon") return;
    const scroller = scrollerRef.current;
    if (!scroller || !selectedId) return;
    const card = Array.from(
      scroller.querySelectorAll<HTMLElement>("[data-media-id]"),
    ).find((node) => node.dataset.mediaId === selectedId);
    if (!card) return;
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const viewportCenter = scroller.scrollLeft + scroller.clientWidth / 2;
    if (Math.abs(cardCenter - viewportCenter) > scroller.clientWidth * 0.42) {
      scroller.scrollTo({
        left: Math.max(0, cardCenter - scroller.clientWidth / 2),
        behavior: "smooth",
      });
    }
  }, [selectedId, viewMode]);

  function selectCenteredCard() {
    const scroller = scrollerRef.current;
    if (!scroller || viewMode !== "ribbon") return;
    const center = scroller.getBoundingClientRect().left + scroller.clientWidth / 2;
    let closest: { id: string; distance: number } | undefined;
    for (const card of scroller.querySelectorAll<HTMLElement>("[data-media-id]")) {
      const rect = card.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - center);
      const id = card.dataset.mediaId;
      if (id && (!closest || distance < closest.distance)) {
        closest = { id, distance };
      }
    }
    if (closest && closest.id !== selectedId) onSelect(closest.id);
  }

  function handleScroll() {
    if (scrollFrame.current) window.cancelAnimationFrame(scrollFrame.current);
    scrollFrame.current = window.requestAnimationFrame(selectCenteredCard);
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    if (viewMode !== "ribbon") return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    event.currentTarget.scrollLeft += event.deltaY * 1.2;
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    gsap.to(".archive-watermark", {
      xPercent: x * -2.8,
      yPercent: y * -1.8,
      duration: 1.1,
      overwrite: "auto",
      ease: "power2.out",
    });
  }

  return (
    <section
      ref={rootRef}
      className={`archive-preview is-${viewMode}`}
      onPointerMove={handlePointerMove}
    >
      <header className="archive-header">
        <a className="archive-logo" href={import.meta.env.BASE_URL}>
          <strong>INS/ARCHIVE</strong>
          <span>Private image viewer</span>
        </a>
        <div className="archive-session-meta">
          <span className="archive-live-dot" />
          <strong>{isDemo ? "Demo archive" : "Local archive"}</strong>
          <span>{label}</span>
        </div>
        <button className="archive-import-link" type="button" onClick={onImport}>
          <Upload size={15} aria-hidden="true" />
          {isImporting ? "Importing…" : "Import JSON"}
        </button>
      </header>

      <h1 className="archive-watermark" aria-hidden="true">
        <span>YOUR</span>
        <span>ARCHIVE</span>
      </h1>

      <div
        ref={scrollerRef}
        className="archive-scroller"
        data-testid="archive-scroller"
        onWheel={handleWheel}
        onScroll={handleScroll}
      >
        <div className="archive-track">
          {items.length ? (
            items.map((item, index) => (
              <ArchiveMediaCard
                key={item.media.id}
                item={item}
                index={index}
                total={items.length}
                sourceFrameCount={sourceFrameCounts[item.post.id] ?? 1}
                selected={item.media.id === selectedId}
                mountEmbed={Math.abs(index - selectedIndex) <= 2}
                onSelect={() => onSelect(item.media.id)}
                onHide={() => onHide(item)}
              />
            ))
          ) : (
            <div className="archive-empty-field">
              <strong>No frames match.</strong>
              <span>Open Filter and clear the current search.</span>
            </div>
          )}
        </div>
      </div>

      <div className="archive-identity" aria-live="polite">
        <strong>{creator}</strong>
        <span>{selectedItem?.post.collectionNames[0] ?? "Saved posts"}</span>
      </div>

      <div className="archive-dock">
        <div className="dock-progress">
          <span>
            {String(selectedIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
          </span>
          <div aria-hidden="true">
            <i style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="dock-modes" aria-label="Preview layout">
          <button
            className={viewMode === "ribbon" ? "is-active" : ""}
            type="button"
            onClick={() => onViewModeChange("ribbon")}
          >
            <MoveHorizontal size={15} aria-hidden="true" /> Ribbon
          </button>
          <button
            className={viewMode === "grid" ? "is-active" : ""}
            type="button"
            onClick={() => onViewModeChange("grid")}
          >
            <Grid2X2 size={14} aria-hidden="true" /> Index
          </button>
        </div>

        <div className="dock-actions">
          <button
            className={hasFilters ? "is-active" : ""}
            type="button"
            onClick={onOpenFilters}
          >
            <Search size={15} aria-hidden="true" /> Filter
          </button>
          <button type="button" onClick={onOpenSettings}>
            {hiddenCount ? <EyeOff size={15} aria-hidden="true" /> : <Settings2 size={15} aria-hidden="true" />}
            {hiddenCount ? `${hiddenCount} hidden` : "Settings"}
          </button>
          <button
            className="dock-play"
            type="button"
            disabled={items.length === 0}
            onClick={onStartSlideshow}
          >
            Slideshow <Play size={14} fill="currentColor" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
