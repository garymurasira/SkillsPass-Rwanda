import type { Review } from "@/mock/data";
import { StarRating } from "./StarRating";

export function ReviewList({ reviews }: { reviews: Review[] }) {
  return (
    <ul className="space-y-3">
      {reviews.map((r, i) => (
        <li key={i} className="space-y-1 rounded-2xl border p-4">
          <StarRating value={r.stars} />
          <p>{r.comment}</p>
          <p className="text-sm text-muted-foreground">{r.employer} · {r.createdAt}</p>
        </li>
      ))}
    </ul>
  );
}
