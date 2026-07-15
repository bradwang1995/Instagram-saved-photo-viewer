# PhotoYoshi Archive Field Design QA

- Product reference: `https://photoyoshi.com/`
- Reference captures: `artifacts/photoyoshi-reference-desktop.png`, `artifacts/photoyoshi-reference-scroll-1.png`, `artifacts/photoyoshi-reference-scroll-2.png`, and `artifacts/photoyoshi-reference-mobile.png`
- Previous product state: `artifacts/before-photoyoshi-redesign.png`
- Final implementation: `artifacts/photoyoshi-archive-desktop-final.png` and `artifacts/photoyoshi-archive-mobile-final.png`
- Same-viewport comparison: `artifacts/photoyoshi-mobile-comparison.png`
- Interaction evidence: `artifacts/photoyoshi-archive-desktop-scroll.png`, `artifacts/photoyoshi-archive-index.png`, `artifacts/photoyoshi-archive-slideshow.png`, and `artifacts/photoyoshi-archive-slideshow-mobile.png`
- Viewports: `1280 × 720` desktop and `390 × 844` mobile
- State: non-personal 19-frame demo, Ribbon view, first resolved media selected

## Outcome

The previous white Instagram embed and text-library split have been replaced by a full-viewport private archive field. The new first screen is an upload-only composition; after import, all resolved source frames are flattened into one continuous visual ribbon. Creator and collection metadata sit below the images, while filtering, playback configuration, Index view, and slideshow launch stay in a persistent bottom dock.

The visual language follows the supplied PhotoYoshi reference: oversized clipped grotesk typography, deep olive-black canvas, a centered image object, sparse editorial metadata, sharp rectangular surfaces, and motion driven by scrolling and pointer position. The implementation adapts that composition to the product workflow rather than copying PhotoYoshi content or assets.

## Combined Comparison Pass

`artifacts/photoyoshi-mobile-comparison.png` places the PhotoYoshi mobile reference and the implementation at the same `390 × 844` viewport in one image. The comparison confirms the shared hierarchy: clipped display wordmark, centered portrait media, dark low-chrome background, compressed descriptive copy, and a quiet bottom counter. The intentional product differences are the branded INS/ARCHIVE mark, the import affordance attached directly to the hero image, and the local-storage/privacy copy.

## Required Fidelity Surfaces

- Typography: passed. The display type is oversized, tightly tracked, clipped by the viewport, and clearly distinct from the compact metadata layer. Mobile preserves the same hierarchy without wrapping controls into the hero.
- Layout and spacing: passed. Desktop and mobile remain exactly one viewport tall with no document overflow. Media never collides with the bottom dock, and the mobile dock remains fully tappable.
- Color and surfaces: passed. Deep olive-black backgrounds, warm off-white display text, muted gray metadata, and one acid-lime action color replace the old white embed chrome. No gradients, generic floating cards, or decorative CSS blobs were introduced.
- Image quality: passed. The demo uses bundled WebP photography at native aspect ratio. The app does not copy or hotlink PhotoYoshi imagery. Imported unresolved Instagram sources use a tightly cropped compatibility embed only near the current selection instead of mounting the entire library.
- Icons: passed. Lucide icons share one stroke family, remain optically centered, and collapse to icon-only controls at mobile widths while keeping accessible names.
- Copy and content: passed. The first screen only promises local JSON import. Creator, collection, frame, filter, and playback labels match the media-first product model; shortcode and saved timestamps no longer dominate browsing.
- Responsiveness: passed. `1280 × 720` and `390 × 844` show no horizontal or vertical document overflow. Ribbon, Index, sheets, and slideshow controls remain usable at both sizes.
- Accessibility: passed for the implemented checkpoint. Semantic buttons, labels, image alt text, visible focus treatment, keyboard playback shortcuts, and reduced-motion CSS are present. Motion is not required to import, filter, hide, restore, or play media.

## Functional Browser Evidence

- Vertical wheel input moved the horizontal ribbon from `scrollLeft 528` to `1127` and selected media index `2`.
- Ribbon and Index views both rendered all 19 demo frames.
- Creator filter reduced the session to the five `@quietframes` media items and Clear restored all 19.
- Settings exposed independent frame duration, transition duration, transition style, loop mode, and hidden-media recovery.
- Slideshow navigation advanced inside a multi-frame source before moving to the next source.
- Desktop slideshow controls ended at `y=720`; mobile slideshow media ended at `y=642.75` above controls beginning at `y=738`.
- The empty-library route rendered the JSON upload composition with document dimensions matching the viewport.
- The real local-library route correctly returned the upload screen when IndexedDB contained no imported records.

## Iteration History

### Iteration 1

- [P1] The legacy interface devoted most of the viewport to a white Instagram embed and a shortcode/date list, contradicting the chosen dark, image-first direction.
  - Fix: replaced it with the PhotoYoshi-inspired upload composition and continuous media field.
- [P1] Post-level playback could not express multiple media frames as a single browsing sequence.
  - Fix: the resolved-media queue now expands every source frame in order and keeps source provenance as secondary metadata.
- [P2] Rendering every Instagram embed would create an unbounded iframe count for large libraries.
  - Fix: unresolved compatibility embeds mount only for the selected card and its immediate neighbors; resolved media uses direct image assets.
- [P2] Controls previously competed with the image and could disappear below the fold.
  - Fix: constrained media to the available viewport and reserved a fixed desktop/mobile dock.
- [P2] The library search hierarchy emphasized shortcode and time rather than recognizable people or collections.
  - Fix: filters now prioritize creator, collection, caption/tag text, and hidden state.

### Iteration 2

- [P2] Mobile required a separate visual hierarchy instead of a scaled desktop strip.
  - Fix: widened the selected frame to the safe mobile content width, simplified metadata, collapsed secondary control labels, and retained a full-width slideshow action.
- [P3] Production build reports a `583.80 kB` minified JavaScript chunk.
  - Follow-up: code-split optional animation/settings surfaces if first-load performance becomes a priority; this does not block the current local-first prototype.

## Known Data Boundary

Instagram `saved_posts.json` does not contain carousel child media, original image bytes, reliable thumbnails, or creator metadata. The application can show every frame only when a legitimate resolved-media manifest or other approved media source supplies those records. Iframe-only imports remain an honest post-level compatibility mode; the app does not scrape Instagram, inspect cross-origin iframe DOM, or fabricate media children.

## Verification

- `npm run lint`: passed.
- `npm test -- --run`: 8 files and 16 tests passed.
- `npm run build`: passed.
- All observed P0, P1, and P2 design findings are fixed.

final result: passed
