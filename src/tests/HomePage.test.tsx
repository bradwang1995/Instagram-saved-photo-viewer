import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
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

describe("Photo archive preview", () => {
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

  it("selects a frame from the horizontal preview and hides it", async () => {
    render(<HomePage />);
    await act(async () => undefined);

    expect(screen.getAllByTestId("archive-media-card")).toHaveLength(3);
    const secondFrame = screen.getByRole("button", {
      name: "@north.archive, frame 2 of 2",
    });
    fireEvent.click(secondFrame);

    const selectedCard = secondFrame.closest("article");
    expect(selectedCard).toHaveClass("is-selected");
    fireEvent.click(
      within(selectedCard as HTMLElement).getByRole("button", {
        name: "Hide this media",
      }),
    );
    await waitFor(() =>
      expect(testState.setMediaVisibility).toHaveBeenCalledWith(
        "post:A:media:1",
        "hidden",
      ),
    );
    expect(
      screen.getByText("Frame hidden from future sessions."),
    ).toBeInTheDocument();
  });

  it("filters the visual field by creator", async () => {
    render(<HomePage />);
    await act(async () => undefined);
    fireEvent.click(screen.getByRole("button", { name: "Filter" }));
    fireEvent.change(screen.getByLabelText("Creator"), {
      target: { value: "@quietframes" },
    });
    expect(screen.getAllByTestId("archive-media-card")).toHaveLength(1);
    expect(screen.getByText("1 media · 1 sources")).toBeInTheDocument();
  });

  it("shows the import-first landing when the library is empty", async () => {
    testState.posts = [];
    testState.queue = [];
    render(<HomePage />);
    await act(async () => undefined);

    expect(screen.getByText("Import saved posts")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Choose Instagram saved posts JSON file",
      }),
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
