import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { WorkerCard } from "./WorkerCard";
import type { WorkerCard as Data } from "@/lib/api/employer";

const mutate = vi.fn();
vi.mock("@/lib/queries/employer", () => ({ useToggleFavorite: () => ({ mutate }) }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, params }: { children: React.ReactNode; params: { id: string } }) => <a href={`/employer/workers/${params.id}`}>{children}</a>,
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const worker: Data = {
  id: "w1", name: "Eric Habimana", photoUrl: "/uploads/profile/e.webp", region: "Southern", city: "Huye", isFavorite: false,
  mainSkill: { slug: "carpenter", nameEn: "Carpenter", nameRw: "Umubaji", nameFr: "Menuisier", yearsOfExperience: 12, verified: true },
  rating: { average: null, count: 0 },
};

describe("WorkerCard", () => {
  it("shows the worker's details, the verified badge and 'No ratings yet'", () => {
    render(<WorkerCard worker={worker} />);
    expect(screen.getByText("Eric Habimana")).toBeInTheDocument();
    expect(screen.getByText("Carpenter")).toBeInTheDocument();
    expect(screen.getByText("12 years")).toBeInTheDocument();
    expect(screen.getByText("Huye, Southern")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByText("No ratings yet")).toBeInTheDocument();
  });

  it("loads the photo from the API server", () => {
    const { container } = render(<WorkerCard worker={worker} />);
    expect(container.querySelector("img")).toHaveAttribute("src", "http://localhost:4000/uploads/profile/e.webp");
  });

  it("saves the worker when the heart is tapped, without opening the profile", () => {
    render(<WorkerCard worker={worker} />);
    const heart = screen.getByRole("button", { name: "Add to favorites" });
    const notPrevented = fireEvent.click(heart);
    expect(notPrevented).toBe(false); // preventDefault was called, so the link doesn't navigate
    expect(mutate).toHaveBeenCalledWith({ workerId: "w1", favorite: true }, expect.anything());
  });

  it("offers to remove a worker who is already a favorite", () => {
    render(<WorkerCard worker={{ ...worker, isFavorite: true }} />);
    fireEvent.click(screen.getByRole("button", { name: "Remove from favorites" }));
    expect(mutate).toHaveBeenLastCalledWith({ workerId: "w1", favorite: false }, expect.anything());
  });
});
