import { useRef } from "react";
import { Plus, X } from "lucide-react";
import { assetUrl } from "@/lib/api/config";

type Props = {
  photos: { id: string; url: string }[];
  editable?: boolean;
  onOpen?: (i: number) => void;
  /** Editable grids: called with the picked or photographed file. */
  onAddFile?: (file: File) => void;
  onDelete?: (id: string) => void;
  /** Disables the buttons while an upload or delete is running. */
  busy?: boolean;
};

const MAX_PHOTOS = 12;

export function PhotoGrid({ photos, editable, onOpen, onAddFile, onDelete, busy }: Props) {
  const list = photos.slice(0, MAX_PHOTOS);
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="grid grid-cols-3 gap-2">
      {list.map((p, i) => (
        <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          <button type="button" className="h-full w-full" onClick={() => onOpen?.(i)} aria-label={`Photo ${i + 1}`}>
            <img src={assetUrl(p.url) ?? ""} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
          {editable && onDelete && (
            <button type="button" aria-label="Delete photo" disabled={busy} onClick={() => onDelete(p.id)}
              className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-full bg-foreground/70 text-background disabled:opacity-50">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      ))}
      {editable && onAddFile && list.length < MAX_PHOTOS && (
        <>
          {/* No `capture` attribute: the phone offers both the camera and the gallery. */}
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = ""; // lets the same photo be picked again after an error
              if (file) onAddFile(file);
            }}
          />
          <button type="button" disabled={busy} onClick={() => input.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-primary text-primary disabled:opacity-50">
            <Plus className="h-8 w-8" /><span className="text-sm font-bold">{busy ? "Wait…" : "Add photo"}</span>
          </button>
        </>
      )}
    </div>
  );
}
