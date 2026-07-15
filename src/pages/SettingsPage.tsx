import { Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { clearLocalDatabase } from "../db/postRepository";
import { getSettings, updateSettings } from "../db/settingsRepository";
import type { AppSettings } from "../db/schema";
import { Button } from "../components/common/Button";

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | undefined>();
  const [message, setMessage] = useState("");

  useEffect(() => {
    void getSettings().then(setSettings);
  }, []);

  async function saveSettings() {
    if (!settings) {
      return;
    }

    const nextSettings = await updateSettings(settings);
    setSettings(nextSettings);
    setMessage("Settings saved.");
  }

  async function clearData() {
    const confirmed = window.confirm(
      "This will permanently delete the local database stored in this browser. This will not affect your Instagram account.",
    );

    if (!confirmed) {
      return;
    }

    await clearLocalDatabase();
    setSettings(await getSettings());
    setMessage("Local database cleared.");
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <div className="eyebrow">local data</div>
          <h1>Settings</h1>
        </div>
        <p>
          Manage browser storage and default viewer behavior. Imported photo
          references stay only in this browser.
        </p>
      </section>

      <section className="settings-grid">
        <div className="settings-panel">
          <div className="section-heading">
            <div>
              <div className="eyebrow">viewer</div>
              <h2>Defaults</h2>
            </div>
          </div>
          {settings ? (
            <div className="settings-form">
              <label className="field">
                <span>Embed mode</span>
                <select
                  value={settings.preferredEmbedMode}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      preferredEmbedMode: event.target.value as AppSettings["preferredEmbedMode"],
                    })
                  }
                >
                  <option value="blockquote">blockquote</option>
                  <option value="oembed">oEmbed</option>
                  <option value="link_only">link only</option>
                </select>
              </label>
              <label className="field">
                <span>Slideshow interval</span>
                <select
                  value={settings.slideshowIntervalMs}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      slideshowIntervalMs: Number(event.target.value),
                    })
                  }
                >
                  <option value={3000}>3 seconds</option>
                  <option value={5000}>5 seconds</option>
                  <option value={8000}>8 seconds</option>
                  <option value={12000}>12 seconds</option>
                </select>
              </label>
              <label className="check-control">
                <input
                  type="checkbox"
                  checked={settings.slideshowShuffle}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      slideshowShuffle: event.target.checked,
                    })
                  }
                />
                Shuffle by default
              </label>
              <label className="check-control">
                <input
                  type="checkbox"
                  checked={settings.slideshowShowMetadata}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      slideshowShowMetadata: event.target.checked,
                    })
                  }
                />
                Show metadata
              </label>
              <Button variant="primary" onClick={saveSettings}>
                <Save size={16} aria-hidden="true" />
                Save settings
              </Button>
            </div>
          ) : (
            <div className="loading-state">Loading settings...</div>
          )}
        </div>

        <div className="settings-panel danger-panel">
          <div className="section-heading">
            <div>
              <div className="eyebrow">danger</div>
              <h2>Clear local data</h2>
            </div>
            <Trash2 size={20} aria-hidden="true" />
          </div>
          <p>
            This removes the local browser database. It does not change anything in
            your Instagram account.
          </p>
          <Button variant="danger" onClick={clearData}>
            <Trash2 size={16} aria-hidden="true" />
            Clear all local data
          </Button>
        </div>
      </section>

      {message ? <p className="success-text">{message}</p> : null}
    </div>
  );
}
