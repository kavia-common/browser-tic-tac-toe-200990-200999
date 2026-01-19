import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders tic tac toe UI", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /tic tac toe/i })).toBeInTheDocument();
  expect(screen.getByRole("status")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /restart game/i })).toBeInTheDocument();
});
