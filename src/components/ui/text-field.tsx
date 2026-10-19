import type { InputHTMLAttributes, ReactNode } from "react";
import styles from "./ui.module.css";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  leading?: ReactNode;
  trailing?: ReactNode;
};

export function TextField({ id, label, leading, trailing, className = "", ...props }: TextFieldProps) {
  return (
    <div className={`${styles.textField} ${className}`}>
      <label htmlFor={id} className="sr-only">{label}</label>
      {leading}
      <input id={id} {...props} />
      {trailing}
    </div>
  );
}
