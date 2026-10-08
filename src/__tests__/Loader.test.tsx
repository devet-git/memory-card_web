import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { CardLoader, PageLoader } from "components/Loader";

describe("CardLoader", () => {
  test("announces itself to assistive tech with its label", () => {
    render(<CardLoader label="Đang tải từ điển" />);
    expect(screen.getByRole("status", { name: "Đang tải từ điển" })).toBeInTheDocument();
  });

  test("shows an English word on the front and its Vietnamese meaning on the back", () => {
    render(<CardLoader />);
    expect(screen.getByText("EN")).toBeInTheDocument();
    expect(screen.getByText("VI")).toBeInTheDocument();
  });

  test("moves on to the next word pair after each full turn of the card", () => {
    const { container } = render(<CardLoader />);
    const words = () => Array.from(container.querySelectorAll("strong")).map((n) => n.textContent);
    const before = words();
    // the flipping element is the one that owns the animation
    const flipper = container.querySelector("strong")!.parentElement!.parentElement!;
    fireEvent.animationIteration(flipper);
    expect(words()).not.toEqual(before);
  });

  test("the compact variant leaves out the tip", () => {
    const { container } = render(<CardLoader compact />);
    expect(container.textContent).not.toContain("💡");
  });

  test("PageLoader renders a loader with the default label", () => {
    render(<PageLoader />);
    expect(screen.getByRole("status", { name: "Đang tải MemCard" })).toBeInTheDocument();
  });
});
