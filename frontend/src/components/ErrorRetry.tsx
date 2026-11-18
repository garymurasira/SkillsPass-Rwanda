import { WifiOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ErrorRetry({ text = "Something went wrong. Check your internet." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-destructive/10 text-destructive">
        <WifiOff className="h-10 w-10" />
      </div>
      <p className="max-w-xs font-bold">{text}</p>
      <Button size="lg" className="h-12 px-8" onClick={() => toast("Trying again…")}>Try again</Button>
    </div>
  );
}
