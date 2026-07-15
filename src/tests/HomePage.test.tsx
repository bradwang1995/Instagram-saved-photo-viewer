import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, type MediaItem, type SavedPost } from "../db/schema";
import type { MediaQueueItem } from "../features/media/mediaQueue";
import { HomePage } from "../pages/HomePage";

const testState = vi.hoisted(() => ({
  posts: [] as SavedPost[],
  queue: [] as MediaQueueItem[],
  refresh: vi.fn(),
  setMediaVisibility: vi.fn(),
}));

vi.mock("../hooks/useMediaLibrary", () => ({
  useMediaLibrary: () => ({
    posts: testState.posts,
    queue: testState.queue,
    isLoading: false,
    error: undefined,
    isDemo: true,
    refresh: testState.refresh,
  }),
}));
vi.mock("../db/mediaRepository", () => ({
  setMediaVisibility: testState.setMediaVisibility,
  restoreAllMedia: vi.fn(),
}));
vi.mock("../db/settingsRepository", () => ({
  getSettings: vi.fn().mockResolvedValue(DEFAULT_SETTINGS),
  updateSettings: vi.fn().mockResolvedValue(DEFAULT_SETTINGS),
}));
vi.mock("../db/postRepository", () => ({ clearLocalDatabase: vi.fn() }));
vi.mock("../features/import/importJson", () => ({
  importSavedPostsJsonFile: vi.fn(),
}));
vi.mock("../features/slideshow/shuffle", () => ({
  shuffleArray: <T,>(items: T[]) => [...items].reverse(),
}));

describe("Cinematic Lightbox workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const first = createPost("A", "@north.archive", "Night drives");
    const second = createPost("B", "@quietframes", "Landscapes");
    testState.posts = [first, second];
    testState.queue = [
      createQueueItem(first, 0, 2),
      createQueueItem(first, 1, 2),
      createQueueItem(second, 0, 1),
    ];
    testState.refresh.mockResolvedValue(undefined);
    testState.setMediaVisibility.mockResolvedValue(undefined);
  });

  it("navigates individual frames and hides the selected media item", async () => {
    const { container } = render(<HomePage />);

    expect(container.querySelectorAll(".queue-item")).toHaveLength(3);
    expect(
      screen.getByText("Frame 1 of 2 · Resolved media"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "@north.archive, frame 2 of 2" }),
    );
    expect(
      screen.getByText("Frame 2 of 2 · Resolved media"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next media" }));
    expect(
      screen.getByText("Frame 1 of 1 · Resolved media"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Hide this media" }));
    await waitFor(() =>
      expect(testState.setMediaVisibility).toHaveBeenCalledWith(
        "post:B:media:0",
        "hidden",
      ),
    );
    expect(
      screen.getByText("Frame hidden from future sessions."),
    ).toBeInTheDocument();
  });

  it("filters the session by creator", () => {
    render(<HomePage />);
    fireEvent.change(screen.getByLabelText("Creator"), {
      target: { value: "@quietframes" },
    });
    expect(screen.getByText("1 visible media")).toBeInTheDocument();
    expect(
      screen.getByText("Frame 1 of 1 · Resolved media"),
    ).toBeInTheDocument();
  });
});

function createPost(
  shortcode: string,
  creator: string,
  collection: string,
): SavedPost {
  const canonicalUrl = `https://www.instagram.com/p/${shortcode}/`;
  return {
    id: `post:${shortcode}`,
    url: canonicalUrl,
    canonicalUrl,
    shortcode,
    savedAt: "2026-01-20T12:00:00.000Z",
    importedAt: "2026-01-20T12:00:00.000Z",
    updatedAt: "2026-01-20T12:00:00.000Z",
    collectionNames: [collection],
    sourceFilePaths: ["test.json"],
    sourceFormat: "json",
    localTags: [],
    embedAuthorName: creator,
    status: "unknown",
  };
}

function createQueueItem(
  post: SavedPost,
  sourceIndex: number,
  sourceCount: number,
): MediaQueueItem {
  const media: MediaItem = {
    id: `${post.id}:media:${sourceIndex}`,
    sourcePostId: post.id,
    sourceIndex,
    type: "image",
    sourceKind: "demo",
    creatorHandle: post.embedAuthorName,
    caption: `${post.embedAuthorName} frame ${sourceIndex + 1} of ${sourceCount}`,
    previewUrl: `https://example.com/${post.shortcode}-${sourceIndex}.jpg`,
    assetUrl: `https://example.com/${post.shortcode}-${sourceIndex}.jpg`,
    createdAt: post.importedAt,
    updatedAt: post.updatedAt,
  };
  return { media, post };
}
