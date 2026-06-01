import { useId, useState } from "react";
import styles from "../App.module.css";

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: "current-password" | "new-password";
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
};

export function PasswordField({
  label,
  value,
  onChange,
  autoComplete = "current-password",
  placeholder,
  minLength,
  maxLength,
  required = true,
}: PasswordFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <label className={styles.fieldLabel} htmlFor={id}>
      <span className={styles.fieldLabelText}>{label}</span>
      <span className={styles.passwordFieldWrap}>
        <input
          id={id}
          className={styles.fieldInput}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          autoComplete={autoComplete}
          placeholder={placeholder}
        />
        <button
          type="button"
          className={styles.passwordToggle}
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </span>
    </label>
  );
}
