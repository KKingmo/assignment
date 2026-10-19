import type { HTMLAttributes } from "react";
import styles from "./ui.module.css";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "muted" | "brand" | "inverse";
};

export function Badge({ tone = "muted", className = "", ...props }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[tone]} ${className}`} {...props} />;
}
