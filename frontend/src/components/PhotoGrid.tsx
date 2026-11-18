import { Plus, X } from "lucide-react";
import { toast } from "sonner";

type Props = { photos: { id: string; url: string }[]; editable?: boolean; onOpen?: (i: number) => void };

export function PhotoGrid({ photos, editable, onOpen }: Props) {
  const list = photos.slice(0, 12);
  return (
    <div className="grid grid-cols-3 gap-2">
      {list.map((p, i) => (
        <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          <button type="button" className="h-full w-full" onClick={() => onOpen?.(i)} aria-label={`Photo ${i + 1}`}>
            <img src={p.url} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
          {editable && (
            <button type="button" aria-label="Delete photo" onClick={() => toast("Photo deleted")}
              className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-full bg-foreground/70 text-background">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      ))}
      {editable && list.length < 12 && (
        <button type="button" onClick={() => toast("Open camera")}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-primary text-primary">
          <Plus className="h-8 w-8" /><span className="text-sm font-bold">Add photo</span>
        </button>
      )}
    </div>
  );
}
