import React from "react";

/**
 * Theme toggle switch (Light/Dark).
 *
 * Props:
 * - theme: "light" | "dark"
 * - onToggle: () => void
 */
export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="themeToggle"
      onClick={onToggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      title={isDark ? "Dark theme (click to switch to Light)" : "Light theme (click to switch to Dark)"}
    >
      <span className="themeToggleLabel" aria-hidden="true">
        Theme
      </span>
      <span className="themeSwitch" aria-hidden="true">
        <span className="themeSwitchTrack">
          <span className="themeSwitchThumb" />
        </span>
        <span className="themeSwitchText">{isDark ? "Dark" : "Light"}</span>
      </span>
    </button>
  );
}
