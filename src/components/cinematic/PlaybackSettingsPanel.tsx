import { AnimatePresence, motion } from "motion/react";
import { RotateCcw, X } from "lucide-react";
import type { TransitionPreset } from "../../db/schema";

type PlaybackSettingsPanelProps = {
  open: boolean;
  dwellMs: number;
  transitionDurationMs: number;
  transitionPreset: TransitionPreset;
  loopMode: "off" | "session" | "source-post";
  onClose: () => void;
  onDwellChange: (value: number) => void;
  onTransitionDurationChange: (value: number) => void;
  onTransitionPresetChange: (value: TransitionPreset) => void;
  onLoopModeChange: (value: "off" | "session" | "source-post") => void;
  onReset: () => void;
};

const PRESETS: Array<{ value: TransitionPreset; label: string; note: string }> =
  [
    { value: "crossfade", label: "Crossfade", note: "Clean and quiet" },
    {
      value: "directional-wipe",
      label: "Directional wipe",
      note: "Graphic reveal",
    },
    { value: "depth-zoom", label: "Depth zoom", note: "Lens-like movement" },
    { value: "film-burn", label: "Film burn", note: "Warm exposure flash" },
    { value: "rgb-split", label: "RGB split", note: "Digital interruption" },
    { value: "ken-burns", label: "Ken Burns", note: "Slow editorial drift" },
  ];

export function PlaybackSettingsPanel(props: PlaybackSettingsPanelProps) {
  return (
    <AnimatePresence>
      {props.open ? (
        <>
          <motion.button
            className="sheet-backdrop"
            aria-label="Close playback settings"
            onClick={props.onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className="playback-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="playback-settings-title"
            initial={{ opacity: 0, x: 34 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 34 }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
          >
            <header>
              <div>
                <span>Playback profile</span>
                <h2 id="playback-settings-title">Projection settings</h2>
              </div>
              <button
                className="cinematic-icon-button"
                onClick={props.onClose}
                aria-label="Close settings"
              >
                <X size={18} />
              </button>
            </header>

            <section className="sheet-section">
              <label className="range-setting">
                <span>
                  <strong>Frame dwell</strong>
                  <output>{(props.dwellMs / 1000).toFixed(1)}s</output>
                </span>
                <input
                  type="range"
                  min={1000}
                  max={60000}
                  step={500}
                  value={props.dwellMs}
                  onChange={(event) =>
                    props.onDwellChange(Number(event.target.value))
                  }
                />
                <small>How long each still image remains on stage.</small>
              </label>
              <label className="range-setting">
                <span>
                  <strong>Transition</strong>
                  <output>
                    {(props.transitionDurationMs / 1000).toFixed(2)}s
                  </output>
                </span>
                <input
                  type="range"
                  min={150}
                  max={3000}
                  step={50}
                  value={props.transitionDurationMs}
                  onChange={(event) =>
                    props.onTransitionDurationChange(Number(event.target.value))
                  }
                />
                <small>Separate from dwell time for precise pacing.</small>
              </label>
            </section>

            <section className="sheet-section">
              <div className="sheet-label">Transition treatment</div>
              <div className="preset-grid">
                {PRESETS.map((preset) => (
                  <button
                    className={
                      props.transitionPreset === preset.value
                        ? "preset-option active"
                        : "preset-option"
                    }
                    key={preset.value}
                    onClick={() => props.onTransitionPresetChange(preset.value)}
                    aria-pressed={props.transitionPreset === preset.value}
                  >
                    <strong>{preset.label}</strong>
                    <span>{preset.note}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="sheet-section">
              <label className="select-setting">
                <span>Loop behavior</span>
                <select
                  value={props.loopMode}
                  onChange={(event) =>
                    props.onLoopModeChange(
                      event.target
                        .value as PlaybackSettingsPanelProps["loopMode"],
                    )
                  }
                >
                  <option value="off">Stop at session end</option>
                  <option value="session">Loop entire session</option>
                  <option value="source-post">Loop current source post</option>
                </select>
              </label>
            </section>

            <button className="sheet-reset" onClick={props.onReset}>
              <RotateCcw size={15} aria-hidden="true" /> Reset projection
              defaults
            </button>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
