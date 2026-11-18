import { WifiOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = {
  text?: string;
  /** Pass the query's refetch. Without it (prototype preview screens) the button only shows a toast. */
  onRetry?: () => void;
};

export function ErrorRetry({ text = "Something went wrong. Check your internet.", onRetry }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center" role="alert">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-destructive/10 text-destructive">
        <WifiOff className="h-10 w-10" />
      </div>
      <p className="max-w-xs font-bold">{text}</p>
      <Button size="lg" className="h-12 px-8" onClick={() => (onRetry ? onRetry() : toast("Trying again…"))}>Try again</Button>
    </div>
  );
}
