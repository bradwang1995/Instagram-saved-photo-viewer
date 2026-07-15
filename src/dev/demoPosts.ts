import type { MediaItem, SavedPost } from "../db/schema";

const DEMO_CREATORS = [
  "@north.archive",
  "@afterglow.studio",
  "@quietframes",
  "@field.notes",
];
const DEMO_COLLECTIONS = [
  "Night drives",
  "Landscapes",
  "Editorial",
  "Textures",
];
const DEMO_BASE = `${import.meta.env.BASE_URL}demo/`;
const DEMO_ASSETS = [
  `${DEMO_BASE}valley-water.webp`,
  `${DEMO_BASE}desert-road.webp`,
  `${DEMO_BASE}city-night.webp`,
  `${DEMO_BASE}mountain-light.webp`,
  `${DEMO_BASE}editorial-street.webp`,
  `${DEMO_BASE}night-mountain.webp`,
  `${DEMO_BASE}quiet-lake.webp`,
  `${DEMO_BASE}urban-lines.webp`,
  `${DEMO_BASE}warm-interior.webp`,
  `${DEMO_BASE}fashion-frame.webp`,
];

export function createDemoPosts(count = 8): SavedPost[] {
  return Array.from({ length: count }, (_, index) => {
    const position = index + 1;
    const shortcode = `DEMO${String(position).padStart(3, "0")}`;
    const canonicalUrl = `https://www.instagram.com/p/${shortcode}/`;
    const savedAt = new Date(
      Date.UTC(2026, 5, 30 - (index % 30), 12),
    ).toISOString();

    return {
      id: `post:${shortcode}`,
      url: canonicalUrl,
      canonicalUrl,
      shortcode,
      savedAt,
      importedAt: savedAt,
      updatedAt: savedAt,
      collectionNames: [DEMO_COLLECTIONS[index % DEMO_COLLECTIONS.length]],
      sourceFilePaths: ["demo-only.json"],
      sourceFormat: "json",
      localTags: [],
      embedAuthorName: DEMO_CREATORS[index % DEMO_CREATORS.length],
      title: `Cinematic study ${String(position).padStart(2, "0")}`,
      description:
        "Demo-only resolved media used to preview the Lightbox experience.",
      status: "unknown",
    };
  });
}

export function createDemoMediaItems(posts: SavedPost[]): MediaItem[] {
  return posts.flatMap((post, postIndex) => {
    const mediaCount = postIndex % 3 === 0 ? 3 : 2;

    return Array.from({ length: mediaCount }, (_, sourceIndex) => {
      const assetUrl =
        DEMO_ASSETS[(postIndex * 2 + sourceIndex) % DEMO_ASSETS.length];
      const timestamp = post.savedAt ?? post.importedAt;

      return {
        id: `${post.id}:media:${sourceIndex}`,
        sourcePostId: post.id,
        sourceIndex,
        type: "image" as const,
        sourceKind: "demo" as const,
        creatorHandle: post.embedAuthorName,
        caption: `${post.title} · frame ${sourceIndex + 1} of ${mediaCount}`,
        previewUrl: assetUrl,
        assetUrl,
        width: 1800,
        height: 1200,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    });
  });
}
