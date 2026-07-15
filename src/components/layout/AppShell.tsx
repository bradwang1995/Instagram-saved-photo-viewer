import type { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";
import { Camera } from "lucide-react";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink className="brand" to="/" aria-label="Home">
          <span className="brand-mark">
            <Camera size={20} aria-hidden="true" />
          </span>
          <span>Instagram Viewer</span>
        </NavLink>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
