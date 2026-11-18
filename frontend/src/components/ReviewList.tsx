import { formatDate } from "@/lib/format";
import { StarRating } from "./StarRating";

type ReviewItem = { stars: number; comment?: string | null; createdAt: string; employer: string };

export function ReviewList({ reviews }: { reviews: ReviewItem[] }) {
  return (
    <ul className="space-y-3">
      {reviews.map((r, i) => (
        <li key={i} className="space-y-1 rounded-2xl border p-4">
          <StarRating value={r.stars} />
          {r.comment && <p>{r.comment}</p>}
          <p className="text-sm text-muted-foreground">{r.employer} · {formatDate(r.createdAt)}</p>
        </li>
      ))}
    </ul>
  );
}
