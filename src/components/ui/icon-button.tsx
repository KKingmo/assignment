import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "./icon";
import styles from "./ui.module.css";

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label"> & {
  label: string;
  icon: IconName;
  variant?: "plain" | "outline" | "floating";
  size?: "sm" | "md";
};

export function IconButton({
  label,
  icon,
  variant = "plain",
  size = "md",
  type = "button",
  className = "",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={`${styles.iconButton} ${styles[variant]} ${className}`}
      {...props}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}
