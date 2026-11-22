import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PhotoGrid } from "./PhotoGrid";

const photos = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, url: `/uploads/portfolio/${i}.webp` }));

describe("PhotoGrid", () => {
  it("points server-relative photo paths at the API server", () => {
    const { container } = render(<PhotoGrid photos={photos(1)} />);
    expect(container.querySelector("img")).toHaveAttribute("src", "http://localhost:4000/uploads/portfolio/0.webp");
  });

  it("offers Add photo until the 12-photo limit, then hides it", () => {
    const { rerender } = render(<PhotoGrid photos={photos(11)} editable onAddFile={() => {}} />);
    expect(screen.getByRole("button", { name: /Add photo/ })).toBeInTheDocument();
    rerender(<PhotoGrid photos={photos(12)} editable onAddFile={() => {}} />);
    expect(screen.queryByRole("button", { name: /Add photo/ })).not.toBeInTheDocument();
  });

  it("hands the chosen file to onAddFile and asks before deleting", () => {
    const onAddFile = vi.fn();
    const onDelete = vi.fn();
    const { container } = render(<PhotoGrid photos={photos(2)} editable onAddFile={onAddFile} onDelete={onDelete} />);

    const file = new File(["x"], "work.jpg", { type: "image/jpeg" });
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });
    expect(onAddFile).toHaveBeenCalledWith(file);

    fireEvent.click(screen.getAllByRole("button", { name: "Delete photo" })[1]!);
    expect(onDelete).toHaveBeenCalledWith("p1");
  });

  it("shows no edit controls on a public (read-only) grid", () => {
    render(<PhotoGrid photos={photos(2)} onAddFile={() => {}} onDelete={() => {}} />);
    expect(screen.queryByRole("button", { name: "Delete photo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add photo/ })).not.toBeInTheDocument();
  });
});
