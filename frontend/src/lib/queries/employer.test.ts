import { describe, expect, it } from "vitest";
import type { InfiniteData } from "@tanstack/react-query";
import type { WorkerCard, WorkerDetail, WorkerPage } from "../api/employer";
import { patchFavorite } from "./employer";

const card = (id: string, isFavorite = false): WorkerCard => ({
  id, name: id, photoUrl: null, region: "Kigali", city: "Gasabo", isFavorite,
  mainSkill: { slug: "mason", nameEn: "Mason", nameRw: "", nameFr: "", yearsOfExperience: 3, verified: true },
  rating: { average: null, count: 0 },
});

describe("patchFavorite", () => {
  it("flips only the chosen worker inside paged results", () => {
    const pages: InfiniteData<WorkerPage> = {
      pageParams: [0, 20],
      pages: [
        { items: [card("a"), card("b")], total: 3, limit: 2, offset: 0 },
        { items: [card("c")], total: 3, limit: 2, offset: 2 },
      ],
    };
    const out = patchFavorite(pages, "c", true) as InfiniteData<WorkerPage>;
    expect(out.pages.flatMap((p) => p.items).map((w) => [w.id, w.isFavorite])).toEqual([["a", false], ["b", false], ["c", true]]);
    expect(pages.pages[1]!.items[0]!.isFavorite).toBe(false); // the original is not mutated
  });

  it("flips a worker detail, but only if it is that worker", () => {
    const detail = { id: "a", isFavorite: false } as WorkerDetail;
    expect((patchFavorite(detail, "a", true) as WorkerDetail).isFavorite).toBe(true);
    expect((patchFavorite(detail, "other", true) as WorkerDetail).isFavorite).toBe(false);
  });

  it("leaves missing data alone", () => {
    expect(patchFavorite(undefined, "a", true)).toBeUndefined();
  });
});
