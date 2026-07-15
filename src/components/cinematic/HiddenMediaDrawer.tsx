import { AnimatePresence, motion } from "motion/react";
import { Eye, Image, RotateCcw, X } from "lucide-react";
import type { MediaQueueItem } from "../../features/media/mediaQueue";

type HiddenMediaDrawerProps = {
  open: boolean;
  items: MediaQueueItem[];
  onClose: () => void;
  onRestore: (id: string) => void;
  onRestoreAll: () => void;
};

export function HiddenMediaDrawer({
  open,
  items,
  onClose,
  onRestore,
  onRestoreAll,
}: HiddenMediaDrawerProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            className="sheet-backdrop"
            aria-label="Close hidden media"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className="hidden-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hidden-media-title"
            initial={{ opacity: 0, x: 36 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 36 }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
          >
            <header>
              <div>
                <span>Local preference</span>
                <h2 id="hidden-media-title">Hidden media</h2>
                <p>{items.length} items stay excluded from normal sessions.</p>
              </div>
              <button
                className="cinematic-icon-button"
                onClick={onClose}
                aria-label="Close hidden media"
              >
                <X size={18} />
              </button>
            </header>

            {items.length > 0 ? (
              <>
                <div className="hidden-grid">
                  {items.map((item) => (
                    <article className="hidden-card" key={item.media.id}>
                      <div className="hidden-preview">
                        {item.media.previewUrl ? (
                          <img
                            src={item.media.previewUrl}
                            alt=""
                            loading="lazy"
                          />
                        ) : (
                          <Image size={24} aria-hidden="true" />
                        )}
                      </div>
                      <div>
                        <strong>
                          {item.media.creatorHandle ??
                            item.post.collectionNames[0] ??
                            "Saved source"}
                        </strong>
                        <span>
                          Frame {item.media.sourceIndex + 1} ·{" "}
                          {item.post.shortcode ?? "source"}
                        </span>
                      </div>
                      <button onClick={() => onRestore(item.media.id)}>
                        <Eye size={15} aria-hidden="true" /> Restore
                      </button>
                    </article>
                  ))}
                </div>
                <button className="restore-all" onClick={onRestoreAll}>
                  <RotateCcw size={15} aria-hidden="true" /> Restore all hidden
                  media
                </button>
              </>
            ) : (
              <div className="hidden-empty">
                <Eye size={28} aria-hidden="true" />
                <strong>Nothing hidden</strong>
                <span>
                  Use H during playback to curate quickly. Every hide can be
                  undone.
                </span>
              </div>
            )}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
