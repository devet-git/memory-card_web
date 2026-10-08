import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "App";

beforeEach(() => {
  localStorage.clear();
  (global as any).fetch = jest.fn(async () => ({ ok: false, json: async () => ({}) }));
});

test("the app renders the home page with navigation", () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getAllByText(/Bộ sưu tập/i).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/Ôn tập/i).length).toBeGreaterThan(0);
});
