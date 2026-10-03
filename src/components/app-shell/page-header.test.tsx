import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PageHeader } from "./page-header";

afterEach(cleanup);

describe("<PageHeader />", () => {
  // Regression: the videos page's three header buttons sat in a row that
  // couldn't wrap, 460 px wide on a 390 px phone, so the page scrolled sideways.
  it("lets its actions wrap onto more lines", () => {
    render(
      <PageHeader
        title="Vidéos"
        actions={
          <>
            <button type="button">Corbeille</button>
            <button type="button">Importer une vidéo</button>
            <button type="button">Créer une vidéo</button>
          </>
        }
      />,
    );
    expect(screen.getByRole("button", { name: "Corbeille" }).parentElement).toHaveClass(
      "flex-wrap",
    );
  });
});
