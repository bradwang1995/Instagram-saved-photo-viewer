import { describe, expect, it } from "vitest";
import type { MediaItem, MediaPreference, SavedPost } from "../db/schema";
import {
  buildMediaQueue,
  filterMediaQueue,
} from "../features/media/mediaQueue";

describe("media-first queue", () => {
  it("flattens every media item in source order before the next post", () => {
    const older = post("older", "2026-01-01T00:00:00.000Z");
    const newer = post("newer", "2026-02-01T00:00:00.000Z");
    const media = [
      item(older, 0),
      item(newer, 1),
      item(newer, 0),
      item(older, 1),
    ];

    expect(
      buildMediaQueue([older, newer], media, []).map((entry) => entry.media.id),
    ).toEqual([
      "post:newer:media:0",
      "post:newer:media:1",
      "post:older:media:0",
      "post:older:media:1",
    ]);
  });

  it("keeps hidden preferences separate and filters by creator", () => {
    const source = post("source", "2026-02-01T00:00:00.000Z");
    const media = [item(source, 0, "@alpha"), item(source, 1, "@beta")];
    const preferences: MediaPreference[] = [
      {
        mediaId: media[0].id,
        visibility: "hidden",
        rating: -1,
        localTags: [],
        updatedAt: "2026-02-02T00:00:00.000Z",
      },
    ];
    const queue = buildMediaQueue([source], media, preferences);

    expect(
      filterMediaQueue(queue, {
        query: "",
        creator: "@beta",
        collection: "",
        dateFrom: "",
        dateTo: "",
        includeHidden: false,
      }),
    ).toHaveLength(1);
    expect(
      filterMediaQueue(queue, {
        query: "",
        creator: "",
        collection: "",
        dateFrom: "",
        dateTo: "",
        includeHidden: false,
      }),
    ).toHaveLength(1);
    expect(
      filterMediaQueue(queue, {
        query: "",
        creator: "",
        collection: "",
        dateFrom: "",
        dateTo: "",
        includeHidden: true,
      }),
    ).toHaveLength(2);
  });
});

function post(shortcode: string, savedAt: string): SavedPost {
  return {
    id: `post:${shortcode}`,
    url: `https://www.instagram.com/p/${shortcode}/`,
    canonicalUrl: `https://www.instagram.com/p/${shortcode}/`,
    shortcode,
    savedAt,
    importedAt: savedAt,
    updatedAt: savedAt,
    collectionNames: ["Demo"],
    sourceFilePaths: ["test.json"],
    sourceFormat: "json",
    localTags: [],
    status: "unknown",
  };
}

function item(
  source: SavedPost,
  sourceIndex: number,
  creatorHandle = "@alpha",
): MediaItem {
  return {
    id: `${source.id}:media:${sourceIndex}`,
    sourcePostId: source.id,
    sourceIndex,
    type: "image",
    sourceKind: "demo",
    creatorHandle,
    createdAt: source.importedAt,
    updatedAt: source.updatedAt,
  };
}
