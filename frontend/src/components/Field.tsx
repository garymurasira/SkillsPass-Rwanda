import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  label: string;
  type?: string;
  placeholder?: string;
  /** Uncontrolled use (prototype screens). Pass `value` + `onChange` for a controlled field. */
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  /** Shown under the field and announced to screen readers. */
  error?: string | undefined;
  name?: string;
  autoComplete?: string;
  maxLength?: number;
  inputMode?: "text" | "tel" | "numeric" | "email";
  disabled?: boolean;
};

export function Field({
  label, type = "text", placeholder, defaultValue, value, onChange, error, name, autoComplete, maxLength, inputMode, disabled,
}: Props) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-base">{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        {...(value !== undefined ? { value } : { defaultValue })}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        autoComplete={autoComplete}
        maxLength={maxLength}
        disabled={disabled}
        inputMode={inputMode ?? (type === "tel" ? "tel" : undefined)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="h-12 text-base"
      />
      {error && <p id={errorId} role="alert" className="text-sm font-bold text-destructive">{error}</p>}
    </div>
  );
}
