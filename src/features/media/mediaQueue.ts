import { createFallbackMediaItem } from "../../db/db";
import type { MediaItem, MediaPreference, SavedPost } from "../../db/schema";

export type MediaQueueItem = {
  media: MediaItem;
  post: SavedPost;
  preference?: MediaPreference;
};

export type MediaQueueFilters = {
  query: string;
  creator: string;
  collection: string;
  dateFrom: string;
  dateTo: string;
  includeHidden: boolean;
};

export function buildMediaQueue(
  posts: SavedPost[],
  mediaItems: MediaItem[],
  preferences: MediaPreference[],
): MediaQueueItem[] {
  const mediaByPost = new Map<string, MediaItem[]>();
  const preferenceById = new Map(
    preferences.map((preference) => [preference.mediaId, preference]),
  );

  for (const media of mediaItems) {
    const current = mediaByPost.get(media.sourcePostId) ?? [];
    current.push(media);
    mediaByPost.set(media.sourcePostId, current);
  }

  return [...posts]
    .sort(
      (a, b) =>
        dateValue(b.savedAt ?? b.importedAt) -
        dateValue(a.savedAt ?? a.importedAt),
    )
    .flatMap((post) => {
      const postMedia = mediaByPost.get(post.id) ?? [
        createFallbackMediaItem(post, post.importedAt),
      ];

      return [...postMedia]
        .sort((a, b) => a.sourceIndex - b.sourceIndex)
        .map((media) => ({
          media,
          post,
          preference: preferenceById.get(media.id),
        }));
    });
}

export function filterMediaQueue(
  queue: MediaQueueItem[],
  filters: MediaQueueFilters,
): MediaQueueItem[] {
  const query = filters.query.trim().toLowerCase();
  const from = filters.dateFrom
    ? new Date(`${filters.dateFrom}T00:00:00`).getTime()
    : undefined;
  const to = filters.dateTo
    ? new Date(`${filters.dateTo}T23:59:59.999`).getTime()
    : undefined;

  return queue.filter(({ media, post, preference }) => {
    if (preference?.visibility === "hidden" && !filters.includeHidden)
      return false;
    if (filters.creator && media.creatorHandle !== filters.creator)
      return false;
    if (
      filters.collection &&
      !post.collectionNames.includes(filters.collection)
    )
      return false;

    const savedAt = dateValue(post.savedAt ?? post.importedAt);
    if (from !== undefined && savedAt < from) return false;
    if (to !== undefined && savedAt > to) return false;

    if (query) {
      const haystack = [
        media.creatorHandle,
        media.caption,
        post.title,
        post.description,
        post.shortcode,
        ...post.collectionNames,
        ...post.localTags,
        ...(preference?.localTags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    return true;
  });
}

function dateValue(value?: string): number {
  if (!value) return 0;
  const result = new Date(value).getTime();
  return Number.isNaN(result) ? 0 : result;
}
