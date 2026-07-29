import { describe, expect, it } from "vitest";
import { validateSaturnReturnForm } from "../saturn-return-validation";

describe("Saturn-return form validation", () => {
  it("names each missing required input", () => {
    expect(validateSaturnReturnForm({ date: "", citySelected: false })).toEqual(
      {
        date: "Enter your birth date.",
        city: "Choose a supported major city from the list.",
      },
    );
  });

  it("clears errors once date and supported city are present", () => {
    expect(
      validateSaturnReturnForm({ date: "1990-01-01", citySelected: true }),
    ).toEqual({ date: "", city: "" });
  });
});
