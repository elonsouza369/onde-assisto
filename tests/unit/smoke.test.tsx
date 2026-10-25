import { render, screen } from "@testing-library/react";

it("renderiza com jsdom", () => {
  render(<p>Onde Assisto</p>);
  expect(screen.getByText("Onde Assisto")).toBeInTheDocument();
});
