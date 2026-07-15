import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAllMediaItems,
  getAllMediaPreferences,
} from "../db/mediaRepository";
import type { MediaItem, MediaPreference } from "../db/schema";
import { createDemoMediaItems } from "../dev/demoPosts";
import { buildMediaQueue } from "../features/media/mediaQueue";
import { isDemoMode, usePosts } from "./usePosts";

export function useMediaLibrary() {
  const postsState = usePosts();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [preferences, setPreferences] = useState<MediaPreference[]>([]);
  const [mediaError, setMediaError] = useState<string>();
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const demo = isDemoMode();

  const refreshMedia = useCallback(async () => {
    try {
      setMediaError(undefined);
      const [storedItems, storedPreferences] = await Promise.all([
        getAllMediaItems(),
        getAllMediaPreferences(),
      ]);
      setMediaItems(
        demo ? createDemoMediaItems(postsState.posts) : storedItems,
      );
      setPreferences(storedPreferences);
    } catch (error) {
      setMediaError(
        error instanceof Error ? error.message : "Could not load media.",
      );
    } finally {
      setIsMediaLoading(false);
    }
  }, [demo, postsState.posts]);

  useEffect(() => {
    void refreshMedia();
    window.addEventListener("instagram-viewer:db-changed", refreshMedia);
    return () =>
      window.removeEventListener("instagram-viewer:db-changed", refreshMedia);
  }, [refreshMedia]);

  const queue = useMemo(
    () => buildMediaQueue(postsState.posts, mediaItems, preferences),
    [mediaItems, postsState.posts, preferences],
  );

  return {
    ...postsState,
    isLoading: postsState.isLoading || isMediaLoading,
    queue,
    preferences,
    isDemo: demo,
    error: postsState.error ?? mediaError,
    refresh: async () => {
      await postsState.refresh();
      await refreshMedia();
    },
  };
}
