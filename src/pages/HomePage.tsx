import { AnimatePresence, motion } from "motion/react";
import {
  CalendarDays,
  Camera,
  CircleEllipsis,
  EyeOff,
  FilterX,
  HardDrive,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CinematicStage } from "../components/cinematic/CinematicStage";
import { HiddenMediaDrawer } from "../components/cinematic/HiddenMediaDrawer";
import { PlaybackSettingsPanel } from "../components/cinematic/PlaybackSettingsPanel";
import { VisualQueue } from "../components/cinematic/VisualQueue";
import { restoreAllMedia, setMediaVisibility } from "../db/mediaRepository";
import { clearLocalDatabase } from "../db/postRepository";
import { getSettings, updateSettings } from "../db/settingsRepository";
import {
  DEFAULT_SETTINGS,
  type ImportJob,
  type TransitionPreset,
} from "../db/schema";
import { importSavedPostsJsonFile } from "../features/import/importJson";
import {
  filterMediaQueue,
  type MediaQueueItem,
} from "../features/media/mediaQueue";
import { shuffleArray } from "../features/slideshow/shuffle";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useMediaLibrary } from "../hooks/useMediaLibrary";

export function HomePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const { posts, queue, isLoading, error, isDemo, refresh } = useMediaLibrary();
  const [selectedMediaId, setSelectedMediaId] = useState<string>();
  const [query, setQuery] = useState("");
  const [creator, setCreator] = useState("");
  const [collection, setCollection] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showDateFilters, setShowDateFilters] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [dwellMs, setDwellMs] = useState(DEFAULT_SETTINGS.slideshowIntervalMs);
  const [transitionDurationMs, setTransitionDurationMs] = useState(
    DEFAULT_SETTINGS.slideshowTransitionDurationMs,
  );
  const [transitionPreset, setTransitionPreset] = useState<TransitionPreset>(
    DEFAULT_SETTINGS.slideshowTransitionPreset,
  );
  const [loopMode, setLoopMode] = useState(DEFAULT_SETTINGS.slideshowLoopMode);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHiddenOpen, setIsHiddenOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [latestJob, setLatestJob] = useState<ImportJob>();
  const [actionError, setActionError] = useState("");
  const [undoItem, setUndoItem] = useState<MediaQueueItem>();

  useEffect(() => {
    void getSettings().then((settings) => {
      setDwellMs(settings.slideshowIntervalMs);
      setTransitionDurationMs(settings.slideshowTransitionDurationMs);
      setTransitionPreset(settings.slideshowTransitionPreset);
      setLoopMode(settings.slideshowLoopMode);
    });
  }, []);

  const creators = useMemo(
    () =>
      Array.from(
        new Set(
          queue
            .map((item) => item.media.creatorHandle)
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort(),
    [queue],
  );
  const collections = useMemo(
    () =>
      Array.from(new Set(posts.flatMap((post) => post.collectionNames))).sort(),
    [posts],
  );
  const hiddenItems = useMemo(
    () => queue.filter((item) => item.preference?.visibility === "hidden"),
    [queue],
  );
  const sourceFrameCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of queue)
      counts[item.post.id] = (counts[item.post.id] ?? 0) + 1;
    return counts;
  }, [queue]);
  const filteredQueue = useMemo(
    () =>
      filterMediaQueue(queue, {
        query,
        creator,
        collection,
        dateFrom,
        dateTo,
        includeHidden: false,
      }),
    [collection, creator, dateFrom, dateTo, query, queue],
  );
  const playbackQueue = useMemo(
    () => (isShuffle ? shuffleArray(filteredQueue) : filteredQueue),
    [filteredQueue, isShuffle, shuffleSeed],
  );

  const selectedIndex = Math.max(
    0,
    playbackQueue.findIndex((item) => item.media.id === selectedMediaId),
  );
  const selectedItem =
    playbackQueue.find((item) => item.media.id === selectedMediaId) ??
    playbackQueue[0];
  const sourceFrameCount = selectedItem
    ? queue.filter((item) => item.post.id === selectedItem.post.id).length
    : 0;
  const hasFilters = Boolean(
    query || creator || collection || dateFrom || dateTo,
  );

  useEffect(() => {
    if (!selectedItem) {
      setSelectedMediaId(undefined);
      setIsPlaying(false);
      return;
    }
    if (selectedMediaId !== selectedItem.media.id) {
      setSelectedMediaId(selectedItem.media.id);
    }
  }, [selectedItem, selectedMediaId]);

  const move = useCallback(
    (direction: 1 | -1) => {
      if (!selectedItem || playbackQueue.length < 2) return;

      if (loopMode === "source-post") {
        const sourceItems = playbackQueue.filter(
          (item) => item.post.id === selectedItem.post.id,
        );
        const sourceIndex = sourceItems.findIndex(
          (item) => item.media.id === selectedItem.media.id,
        );
        const next =
          sourceItems[
            (sourceIndex + direction + sourceItems.length) % sourceItems.length
          ];
        setSelectedMediaId(next.media.id);
        setElapsedMs(0);
        return;
      }

      const currentIndex = playbackQueue.findIndex(
        (item) => item.media.id === selectedItem.media.id,
      );
      const target = currentIndex + direction;
      if (target < 0 || target >= playbackQueue.length) {
        if (loopMode === "off") {
          setIsPlaying(false);
          return;
        }
        setSelectedMediaId(
          playbackQueue[(target + playbackQueue.length) % playbackQueue.length]
            .media.id,
        );
      } else {
        setSelectedMediaId(playbackQueue[target].media.id);
      }
      setElapsedMs(0);
    },
    [loopMode, playbackQueue, selectedItem],
  );

  const skipSource = useCallback(() => {
    if (!selectedItem || playbackQueue.length < 2) return;
    const currentIndex = playbackQueue.findIndex(
      (item) => item.media.id === selectedItem.media.id,
    );
    for (let offset = 1; offset < playbackQueue.length; offset += 1) {
      const candidate =
        playbackQueue[(currentIndex + offset) % playbackQueue.length];
      if (candidate.post.id !== selectedItem.post.id) {
        setSelectedMediaId(candidate.media.id);
        setElapsedMs(0);
        return;
      }
    }
  }, [playbackQueue, selectedItem]);

  useEffect(() => {
    setElapsedMs(0);
    if (!isPlaying || playbackQueue.length < 2) return undefined;

    let startedAt = Date.now();
    const timer = window.setInterval(() => {
      const nextElapsed = Date.now() - startedAt;
      if (nextElapsed >= dwellMs) {
        startedAt = Date.now();
        setElapsedMs(0);
        move(1);
      } else {
        setElapsedMs(nextElapsed);
      }
    }, 80);
    return () => window.clearInterval(timer);
  }, [dwellMs, isPlaying, move, playbackQueue.length, selectedItem?.media.id]);

  useEffect(() => {
    function pauseWhenHidden() {
      if (document.hidden) setIsPlaying(false);
    }
    document.addEventListener("visibilitychange", pauseWhenHidden);
    return () =>
      document.removeEventListener("visibilitychange", pauseWhenHidden);
  }, []);

  async function hideCurrent() {
    if (!selectedItem) return;
    const currentIndex = playbackQueue.findIndex(
      (item) => item.media.id === selectedItem.media.id,
    );
    const nextItem =
      playbackQueue.length > 1
        ? playbackQueue[(currentIndex + 1) % playbackQueue.length]
        : undefined;
    setUndoItem(selectedItem);
    if (nextItem) setSelectedMediaId(nextItem.media.id);
    await setMediaVisibility(selectedItem.media.id, "hidden");
    await refresh();
  }

  async function restoreMedia(mediaId: string) {
    await setMediaVisibility(mediaId, "visible");
    await refresh();
    if (undoItem?.media.id === mediaId) setUndoItem(undefined);
  }

  async function restoreEverything() {
    await restoreAllMedia();
    await refresh();
  }

  useKeyboardShortcuts({
    ArrowRight: () => move(1),
    ArrowLeft: () => move(-1),
    " ": (event) => {
      event.preventDefault();
      setIsPlaying((value) => !value);
    },
    h: () => void hideCurrent(),
    H: () => void hideCurrent(),
    u: () => undoItem && void restoreMedia(undoItem.media.id),
    U: () => undoItem && void restoreMedia(undoItem.media.id),
    s: skipSource,
    S: skipSource,
    Escape: () => {
      if (isSettingsOpen) setIsSettingsOpen(false);
      else if (isHiddenOpen) setIsHiddenOpen(false);
      else if (isMenuOpen) setIsMenuOpen(false);
      else setIsPlaying(false);
    },
  });

  async function importJson(file?: File) {
    if (!file) return;
    setIsImporting(true);
    setActionError("");
    try {
      const job = await importSavedPostsJsonFile(file);
      setLatestJob(job);
      if (isDemo) {
        window.location.search = "";
        return;
      }
      await refresh();
      setSelectedMediaId(undefined);
    } catch (caughtError) {
      setActionError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not import that JSON file.",
      );
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function clearLibrary() {
    if (
      !window.confirm(
        "Clear this local library, media preferences, and settings? Instagram is not affected.",
      )
    )
      return;
    await clearLocalDatabase();
    setSelectedMediaId(undefined);
    setUndoItem(undefined);
    setIsPlaying(false);
    setIsMenuOpen(false);
    await refresh();
  }

  function clearFilters() {
    setQuery("");
    setCreator("");
    setCollection("");
    setDateFrom("");
    setDateTo("");
  }

  function persistPlayback(patch: Parameters<typeof updateSettings>[0]) {
    void updateSettings(patch);
  }

  return (
    <div className="cinematic-workspace" ref={workspaceRef}>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => void importJson(event.target.files?.[0])}
      />

      <header className="cinematic-header">
        <a
          className="cinematic-brand"
          href={import.meta.env.BASE_URL}
          aria-label="Cinematic Lightbox home"
        >
          <span className="cinematic-brand-mark">
            <Camera size={20} aria-hidden="true" />
          </span>
          <span>
            <strong>Instagram Viewer</strong>
            <small>Cinematic Lightbox</small>
          </span>
        </a>
        <div className="library-status">
          <span className="status-dot" aria-hidden="true" />
          <strong>{isDemo ? "DEMO SESSION" : "LIBRARY LOCAL"}</strong>
          <span>
            {queue.length.toLocaleString()} media ·{" "}
            {posts.length.toLocaleString()} sources
          </span>
        </div>
        <div className="header-actions">
          <span className="privacy-note">
            <ShieldCheck size={15} aria-hidden="true" /> On-device preferences
          </span>
          <button
            className="import-button"
            disabled={isImporting}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={17} aria-hidden="true" />{" "}
            {isImporting ? "Importing…" : "Import JSON"}
          </button>
          <div className="menu-anchor">
            <button
              className="cinematic-icon-button menu-button"
              onClick={() => setIsMenuOpen((value) => !value)}
              aria-expanded={isMenuOpen}
              aria-label="Open library menu"
            >
              <CircleEllipsis size={20} />
            </button>
            <AnimatePresence>
              {isMenuOpen ? (
                <motion.div
                  className="library-menu"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <div>
                    <HardDrive size={15} />
                    <span>
                      <strong>Local storage</strong>
                      <small>
                        References and preferences stay in this browser.
                      </small>
                    </span>
                  </div>
                  {isDemo ? (
                    <button
                      onClick={() => {
                        window.location.search = "";
                      }}
                    >
                      Exit cinematic demo
                    </button>
                  ) : null}
                  <button
                    className="danger-menu-item"
                    onClick={() => void clearLibrary()}
                  >
                    <Trash2 size={15} /> Clear local library
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <section className="session-toolbar" aria-label="Session filters">
        <label className="cinematic-search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">
            Search creator, collection, or local tag
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search creator, collection, or local tag"
          />
          {query ? (
            <button onClick={() => setQuery("")} aria-label="Clear search">
              <X size={15} />
            </button>
          ) : null}
        </label>
        <label className="toolbar-select">
          <span>Creator</span>
          <select
            value={creator}
            onChange={(event) => setCreator(event.target.value)}
          >
            <option value="">All creators</option>
            {creators.map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="toolbar-select">
          <span>Collection</span>
          <select
            value={collection}
            onChange={(event) => setCollection(event.target.value)}
          >
            <option value="">All collections</option>
            {collections.map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <button
          className={`date-filter-button${showDateFilters ? " active" : ""}`}
          onClick={() => setShowDateFilters((value) => !value)}
          aria-expanded={showDateFilters}
        >
          <CalendarDays size={17} /> Date
        </button>
        {hasFilters ? (
          <button className="clear-filter-button" onClick={clearFilters}>
            <FilterX size={17} />
            <span>Clear</span>
          </button>
        ) : null}
      </section>

      <AnimatePresence>
        {showDateFilters ? (
          <motion.section
            className="date-filter-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <label>
              <span>Saved from</span>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </label>
            <label>
              <span>Saved to</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </label>
            <span>
              Saved time is an advanced filter; creator and visual recognition
              remain primary.
            </span>
          </motion.section>
        ) : null}
      </AnimatePresence>

      {latestJob ? (
        <div className="workspace-notice success">
          <ShieldCheck size={16} />{" "}
          {latestJob.totalUniquePostsFound.toLocaleString()} unique sources
          imported locally.
        </div>
      ) : null}
      {error || actionError ? (
        <div className="workspace-notice error">{actionError || error}</div>
      ) : null}

      {isLoading ? (
        <div className="cinematic-loading">Indexing local library…</div>
      ) : null}

      {!isLoading && posts.length === 0 ? (
        <section className="cinematic-onboarding">
          <span className="onboarding-icon">
            <Camera size={30} aria-hidden="true" />
          </span>
          <span className="onboarding-kicker">Private screening room</span>
          <h1>Turn saved posts into a visual session.</h1>
          <p>
            Import Instagram’s saved-post JSON. The current export resolves
            source references only; media-level thumbnails and carousel frames
            appear when a legitimate media manifest is available.
          </p>
          <div>
            <button
              className="import-button"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={17} /> Choose JSON file
            </button>
            <button
              className="demo-button"
              onClick={() => {
                window.location.search = "?demo=1";
              }}
            >
              Preview cinematic demo
            </button>
          </div>
          <small>
            <ShieldCheck size={14} /> No Instagram credentials. No scraping.
            Preferences stay on this device.
          </small>
        </section>
      ) : null}

      {!isLoading && posts.length > 0 ? (
        <section className="lightbox-layout">
          <CinematicStage
            item={selectedItem}
            index={selectedIndex}
            total={playbackQueue.length}
            sourceFrameCount={sourceFrameCount}
            isPlaying={isPlaying}
            isShuffle={isShuffle}
            elapsedMs={elapsedMs}
            dwellMs={dwellMs}
            transitionDurationMs={transitionDurationMs}
            transitionPreset={transitionPreset}
            onPrevious={() => move(-1)}
            onNext={() => move(1)}
            onTogglePlaying={() => setIsPlaying((value) => !value)}
            onToggleShuffle={() => {
              setShuffleSeed((value) => value + 1);
              setIsShuffle((value) => !value);
            }}
            onSkipSource={skipSource}
            onHide={() => void hideCurrent()}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onFullscreen={() =>
              void workspaceRef.current?.requestFullscreen?.()
            }
          />
          <VisualQueue
            items={playbackQueue}
            selectedId={selectedItem?.media.id}
            hiddenCount={hiddenItems.length}
            sourceFrameCounts={sourceFrameCounts}
            onSelect={(id) => {
              setSelectedMediaId(id);
              setElapsedMs(0);
            }}
            onOpenHidden={() => setIsHiddenOpen(true)}
          />
        </section>
      ) : null}

      <AnimatePresence>
        {undoItem ? (
          <motion.div
            className="undo-toast"
            role="status"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
          >
            <EyeOff size={17} aria-hidden="true" />
            <span>Frame hidden from future sessions.</span>
            <button onClick={() => void restoreMedia(undoItem.media.id)}>
              Undo
            </button>
            <button aria-label="Dismiss" onClick={() => setUndoItem(undefined)}>
              <X size={15} />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <PlaybackSettingsPanel
        open={isSettingsOpen}
        dwellMs={dwellMs}
        transitionDurationMs={transitionDurationMs}
        transitionPreset={transitionPreset}
        loopMode={loopMode}
        onClose={() => setIsSettingsOpen(false)}
        onDwellChange={(value) => {
          setDwellMs(value);
          persistPlayback({ slideshowIntervalMs: value });
        }}
        onTransitionDurationChange={(value) => {
          setTransitionDurationMs(value);
          persistPlayback({ slideshowTransitionDurationMs: value });
        }}
        onTransitionPresetChange={(value) => {
          setTransitionPreset(value);
          persistPlayback({ slideshowTransitionPreset: value });
        }}
        onLoopModeChange={(value) => {
          setLoopMode(value);
          persistPlayback({ slideshowLoopMode: value });
        }}
        onReset={() => {
          setDwellMs(DEFAULT_SETTINGS.slideshowIntervalMs);
          setTransitionDurationMs(
            DEFAULT_SETTINGS.slideshowTransitionDurationMs,
          );
          setTransitionPreset(DEFAULT_SETTINGS.slideshowTransitionPreset);
          setLoopMode(DEFAULT_SETTINGS.slideshowLoopMode);
          persistPlayback({
            slideshowIntervalMs: DEFAULT_SETTINGS.slideshowIntervalMs,
            slideshowTransitionDurationMs:
              DEFAULT_SETTINGS.slideshowTransitionDurationMs,
            slideshowTransitionPreset:
              DEFAULT_SETTINGS.slideshowTransitionPreset,
            slideshowLoopMode: DEFAULT_SETTINGS.slideshowLoopMode,
          });
        }}
      />
      <HiddenMediaDrawer
        open={isHiddenOpen}
        items={hiddenItems}
        onClose={() => setIsHiddenOpen(false)}
        onRestore={(id) => void restoreMedia(id)}
        onRestoreAll={() => void restoreEverything()}
      />
    </div>
  );
}
