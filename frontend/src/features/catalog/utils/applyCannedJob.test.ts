import { describe, it, expect } from "vitest";

import { mergeCannedJobLines, expandCannedJob } from "./applyCannedJob";

import type { CannedJobDetailResponse } from "@/types/catalog";

const bundle: CannedJobDetailResponse = {
  id: 1,
  title: "Service 10.000 km",
  description: null,
  services: [
    { id: 11, serviceName: "Oil change", price: 100 },
    { id: 12, serviceName: "Filter check", price: 50 },
  ],
  products: [
    { id: 21, productName: "Oil 5W-30", quantity: 2, unitPrice: 50, productId: 301 },
    { id: 22, productName: "Custom gasket", quantity: 1, unitPrice: 10, productId: null },
  ],
  createdAt: "",
  updatedAt: "",
};

describe("expandCannedJob", () => {
  it("given a canned job, when expanded, then produces snapshot lines without ids", () => {
    expect(expandCannedJob(bundle)).toEqual({
      services: [
        { serviceName: "Oil change", price: 100 },
        { serviceName: "Filter check", price: 50 },
      ],
      products: [
        { productName: "Oil 5W-30", quantity: 2, unitPrice: 50, productId: 301 },
        { productName: "Custom gasket", quantity: 1, unitPrice: 10, productId: null },
      ],
    });
  });
});

describe("mergeCannedJobLines", () => {
  it("given empty document, when merged, then appends all bundle lines", () => {
    const merged = mergeCannedJobLines([], [], expandCannedJob(bundle));

    expect(merged.services).toHaveLength(2);
    expect(merged.products).toHaveLength(2);
  });

  it("given a catalog product already in the document, when merged, then quantities are summed", () => {
    const merged = mergeCannedJobLines(
      [],
      [{ productName: "Oil 5W-30", quantity: 3, unitPrice: 50, productId: 301 }],
      expandCannedJob(bundle),
    );

    expect(merged.products).toHaveLength(2);
    const oil = merged.products.find((p) => p.productId === 301);
    if (!oil) throw new Error("line not found");
    expect(oil.quantity).toBe(5);
    expect(merged.services).toHaveLength(2);
  });

  it("given a free-text product with the same name and no id on both sides, when merged, then quantities are summed", () => {
    const merged = mergeCannedJobLines(
      [],
      [{ productName: "Custom gasket", quantity: 1, unitPrice: 12, productId: null }],
      expandCannedJob(bundle),
    );

    const gasket = merged.products.find((p) => p.productName === "Custom gasket");
    if (!gasket) throw new Error("line not found");
    expect(gasket.quantity).toBe(2);
  });

  it("given same product name but one line has no id and the other a catalog id, when merged, then they stay separate rows", () => {
    const merged = mergeCannedJobLines(
      [],
      [{ productName: "Oil 5W-30", quantity: 1, unitPrice: 55, productId: null }],
      expandCannedJob(bundle),
    );

    expect(merged.products).toHaveLength(3);
  });

  it("given the same service with identical name and price, when merged again, then it is not duplicated", () => {
    const merged = mergeCannedJobLines(
      [{ serviceName: "Oil change", price: 100 }],
      [],
      expandCannedJob(bundle),
    );

    expect(merged.services).toHaveLength(2);
    expect(merged.services.filter((s) => s.serviceName === "Oil change")).toHaveLength(1);
  });

  it("given the same service name with a different price, when merged, then the differing line is appended", () => {
    const merged = mergeCannedJobLines(
      [{ serviceName: "Oil change", price: 150 }],
      [],
      expandCannedJob(bundle),
    );

    // The existing line (price 150) is kept and the bundle appends its own "Oil change"
    // (price 100) plus "Filter check": the user's manual price is never overwritten.
    expect(merged.services).toHaveLength(3);
    expect(merged.services.some((s) => s.serviceName === "Oil change" && s.price === 100)).toBe(true);
    expect(merged.services.some((s) => s.serviceName === "Oil change" && s.price === 150)).toBe(true);
  });

  it("when merged, then existing product lines are not mutated", () => {
    const existing = [{ productName: "Oil 5W-30", quantity: 1, unitPrice: 50, productId: 301 }];
    mergeCannedJobLines([], existing, expandCannedJob(bundle));

    expect(existing[0]?.quantity).toBe(1);
  });
});
