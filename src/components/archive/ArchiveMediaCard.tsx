import { ExternalLink, EyeOff, LoaderCircle } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { MediaQueueItem } from "../../features/media/mediaQueue";
import { getInstagramEmbedUrl } from "../../features/embed/instagramEmbedUrl";

type ArchiveMediaCardProps = {
  item: MediaQueueItem;
  index: number;
  total: number;
  sourceFrameCount: number;
  selected: boolean;
  mountEmbed: boolean;
  onSelect: () => void;
  onHide: () => void;
};

export function ArchiveMediaCard({
  item,
  index,
  total,
  sourceFrameCount,
  selected,
  mountEmbed,
  onSelect,
  onHide,
}: ArchiveMediaCardProps) {
  const { media, post } = item;
  const resolvedUrl = media.assetUrl ?? media.previewUrl;
  const creator =
    media.creatorHandle ?? post.embedAuthorName ?? "Instagram source";
  const collection = post.collectionNames[0] ?? "Saved posts";
  const aspect =
    media.width && media.height ? media.width / media.height : 0.78;
  const cardStyle = {
    "--media-aspect": Math.max(0.62, Math.min(aspect, 1.65)).toFixed(3),
    "--card-order": index,
  } as CSSProperties;

  function selectFromKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  }

  return (
    <motion.article
      className={`archive-card${selected ? " is-selected" : ""}`}
      data-media-id={media.id}
      data-testid="archive-media-card"
      style={cardStyle}
      initial={{ opacity: 0, y: 70, rotate: index % 2 ? 1.2 : -1.1 }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: selected ? 0 : index % 2 ? 0.7 : -0.6,
      }}
      transition={{
        duration: 0.72,
        delay: Math.min(index * 0.035, 0.45),
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -12, rotate: 0 }}
    >
      <div
        className="archive-card-hit"
        role="button"
        tabIndex={0}
        aria-label={`${creator}, frame ${media.sourceIndex + 1} of ${sourceFrameCount}`}
        onClick={onSelect}
        onKeyDown={selectFromKeyboard}
      >
        <div className="archive-media-surface">
          {resolvedUrl ? (
            <img
              src={resolvedUrl}
              alt={media.caption ?? `${creator} saved frame`}
              loading={index < 6 ? "eager" : "lazy"}
              draggable={false}
            />
          ) : mountEmbed ? (
            <CroppedInstagramPreview item={item} />
          ) : (
            <div className="archive-source-plate">
              <span>Instagram source</span>
              <strong>{post.shortcode ?? String(index + 1).padStart(4, "0")}</strong>
              <small>Move here to load the live preview</small>
            </div>
          )}
          <span className="archive-media-shade" aria-hidden="true" />
          <span className="archive-card-number">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      </div>

      <footer className="archive-card-caption">
        <div>
          <strong>{creator}</strong>
          <span>
            {collection} · frame {media.sourceIndex + 1}/{sourceFrameCount}
          </span>
        </div>
        <div className="archive-card-actions">
          <button
            type="button"
            aria-label="Hide this media"
            title="Hide this media"
            onClick={(event) => {
              event.stopPropagation();
              onHide();
            }}
          >
            <EyeOff size={15} aria-hidden="true" />
          </button>
          <a
            href={post.canonicalUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open source on Instagram"
            title="Open source on Instagram"
          >
            <ExternalLink size={15} aria-hidden="true" />
          </a>
        </div>
      </footer>

      <span className="archive-card-total" aria-hidden="true">
        /{String(total).padStart(2, "0")}
      </span>
    </motion.article>
  );
}

function CroppedInstagramPreview({ item }: { item: MediaQueueItem }) {
  const [isLoading, setIsLoading] = useState(true);
  const embedUrl = getInstagramEmbedUrl(item.post);

  useEffect(() => setIsLoading(true), [embedUrl]);

  return (
    <div className="archive-embed-crop">
      {isLoading ? (
        <div className="archive-embed-loading">
          <LoaderCircle size={20} className="spin" aria-hidden="true" />
          <span>Loading source preview</span>
        </div>
      ) : null}
      <iframe
        src={embedUrl}
        title={`Instagram preview ${item.post.shortcode ?? item.post.id}`}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}
