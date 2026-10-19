import type { CSSProperties } from "react";
import styles from "./ui.module.css";

export type IconName =
  | "shopping-cart"
  | "bell"
  | "user"
  | "search"
  | "close"
  | "caret-left"
  | "caret-right"
  | "crosshair"
  | "chart-bar"
  | "trophy"
  | "arrow-right"
  | "play"
  | "pause";

export function Icon({ name, size = "md" }: { name: IconName; size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden="true"
      className={`${styles.icon} ${size === "sm" ? styles.sm : ""}`}
      style={{ "--icon-source": `url("/icons/${name}.svg")` } as CSSProperties}
    />
  );
}
