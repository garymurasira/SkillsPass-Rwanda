import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Field({ label, type = "text", placeholder, defaultValue }: { label: string; type?: string; placeholder?: string; defaultValue?: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-base">{label}</Label>
      <Input type={type} placeholder={placeholder} defaultValue={defaultValue} inputMode={type === "tel" ? "tel" : undefined} className="h-12 text-base" />
    </div>
  );
}
