import { render, screen } from "@testing-library/react";
import { App } from "../App";
import { describe, expect, it } from "vitest";

describe("Near Market client", () => {
  it("renders the initial app screen", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Near Market", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Buy and sell directly on Telegram.")).toBeInTheDocument();
  });
});
