import { db, notifyDbChanged } from "./db";
import type { MediaItem, MediaPreference } from "./schema";

export async function getAllMediaItems(): Promise<MediaItem[]> {
  return db.mediaItems.orderBy("sourceIndex").toArray();
}

export async function getAllMediaPreferences(): Promise<MediaPreference[]> {
  return db.mediaPreferences.toArray();
}

export async function setMediaVisibility(
  mediaId: string,
  visibility: MediaPreference["visibility"],
): Promise<MediaPreference> {
  const existing = await db.mediaPreferences.get(mediaId);
  const now = new Date().toISOString();
  const preference: MediaPreference = {
    mediaId,
    visibility,
    rating: visibility === "hidden" ? -1 : 0,
    hiddenAt: visibility === "hidden" ? now : undefined,
    localTags: existing?.localTags ?? [],
    updatedAt: now,
  };

  await db.mediaPreferences.put(preference);
  notifyDbChanged();
  return preference;
}

export async function restoreAllMedia(): Promise<void> {
  const hidden = await db.mediaPreferences
    .where("visibility")
    .equals("hidden")
    .toArray();

  if (hidden.length === 0) return;

  const now = new Date().toISOString();
  await db.mediaPreferences.bulkPut(
    hidden.map((preference) => ({
      ...preference,
      visibility: "visible" as const,
      rating: 0 as const,
      hiddenAt: undefined,
      updatedAt: now,
    })),
  );
  notifyDbChanged();
}
