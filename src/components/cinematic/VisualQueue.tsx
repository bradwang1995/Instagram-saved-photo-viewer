import { motion } from "motion/react";
import { EyeOff, Image, Layers3 } from "lucide-react";
import { useMemo } from "react";
import type { MediaQueueItem } from "../../features/media/mediaQueue";

type VisualQueueProps = {
  items: MediaQueueItem[];
  selectedId?: string;
  hiddenCount: number;
  sourceFrameCounts: Record<string, number>;
  onSelect: (id: string) => void;
  onOpenHidden: () => void;
};

export function VisualQueue({
  items,
  selectedId,
  hiddenCount,
  sourceFrameCounts,
  onSelect,
  onOpenHidden,
}: VisualQueueProps) {
  const sourceCounts = useMemo(
    () => new Map(Object.entries(sourceFrameCounts)),
    [sourceFrameCounts],
  );

  return (
    <aside className="visual-queue" aria-label="Visual media queue">
      <header className="queue-heading">
        <div>
          <span className="queue-kicker">Session</span>
          <h2>Visual queue</h2>
          <span>{items.length.toLocaleString()} visible media</span>
        </div>
        <button className="queue-hidden-button" onClick={onOpenHidden}>
          <EyeOff size={15} aria-hidden="true" />
          {hiddenCount}
          <span className="sr-only"> hidden media</span>
        </button>
      </header>

      <div className="queue-scroll">
        {items.map((item, index) => {
          const active = item.media.id === selectedId;
          const creator = item.media.creatorHandle ?? item.post.embedAuthorName;
          const label =
            creator ?? item.post.collectionNames[0] ?? "Saved source";
          const sourceCount = sourceCounts.get(item.post.id) ?? 1;

          return (
            <motion.button
              layout="position"
              className={`queue-item${active ? " active" : ""}`}
              key={item.media.id}
              onClick={() => onSelect(item.media.id)}
              aria-current={active ? "true" : undefined}
              aria-label={`${label}, frame ${item.media.sourceIndex + 1} of ${sourceCount}`}
              whileTap={{ scale: 0.985 }}
            >
              <span className="queue-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="queue-thumbnail">
                {item.media.previewUrl ? (
                  <img src={item.media.previewUrl} alt="" loading="lazy" />
                ) : (
                  <Image size={18} aria-hidden="true" />
                )}
                {sourceCount > 1 ? (
                  <span
                    className="queue-stack-count"
                    title={`${sourceCount} media in this source`}
                  >
                    <Layers3 size={11} aria-hidden="true" /> {sourceCount}
                  </span>
                ) : null}
              </span>
              <span className="queue-copy">
                <strong>{label}</strong>
                <small>
                  Frame {item.media.sourceIndex + 1} ·{" "}
                  {item.post.collectionNames[0] ??
                    item.post.shortcode ??
                    "Unsorted"}
                </small>
              </span>
              <span className="queue-format">{item.media.type}</span>
            </motion.button>
          );
        })}

        {items.length === 0 ? (
          <div className="queue-empty">
            <Image size={24} aria-hidden="true" />
            <strong>No visible media</strong>
            <span>Clear a filter or restore something from Hidden.</span>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
