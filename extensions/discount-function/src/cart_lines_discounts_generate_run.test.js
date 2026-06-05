import { describe, it, expect } from "vitest";

import {
  OrderDiscountSelectionStrategy,
  ProductDiscountSelectionStrategy,
  DiscountClass,
} from "../generated/api";

import { cartLinesDiscountsGenerateRun } from "./cart_lines_discounts_generate_run";

const baseInput = {
  cart: {
    lines: [
      {
        id: "gid://shopify/CartLine/0",
        cost: {
          subtotalAmount: {
            amount: "100.00",
          },
        },
      },
    ],
  },
  discount: {
    discountClasses: [],
  },
};

describe("cartLinesDiscountsGenerateRun", () => {
  it("returns empty operations when no discount classes are present", () => {
    const result = cartLinesDiscountsGenerateRun({
      ...baseInput,
      discount: { discountClasses: [] },
    });
    expect(result.operations).toHaveLength(0);
  });

  it("returns only order discount when only Order class is present", () => {
    const result = cartLinesDiscountsGenerateRun({
      ...baseInput,
      discount: { discountClasses: [DiscountClass.Order] },
    });
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toMatchObject({
      orderDiscountsAdd: {
        candidates: [
          {
            message: "10% OFF ORDER",
            targets: [{ orderSubtotal: { excludedCartLineIds: [] } }],
            value: { percentage: { value: 10 } },
          },
        ],
        selectionStrategy: OrderDiscountSelectionStrategy.First,
      },
    });
  });

  it("returns only product discount when only Product class is present", () => {
    const result = cartLinesDiscountsGenerateRun({
      ...baseInput,
      discount: { discountClasses: [DiscountClass.Product] },
    });
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toMatchObject({
      productDiscountsAdd: {
        candidates: [
          {
            message: "20% OFF PRODUCT",
            targets: [{ cartLine: { id: "gid://shopify/CartLine/0" } }],
            value: { percentage: { value: 20 } },
          },
        ],
        selectionStrategy: ProductDiscountSelectionStrategy.First,
      },
    });
  });

  it("returns both discounts when both Order and Product classes are present", () => {
    const result = cartLinesDiscountsGenerateRun({
      ...baseInput,
      discount: { discountClasses: [DiscountClass.Order, DiscountClass.Product] },
    });
    expect(result.operations).toHaveLength(2);
    expect(result.operations[0]).toMatchObject({
      orderDiscountsAdd: {
        candidates: [
          {
            message: "10% OFF ORDER",
            targets: [{ orderSubtotal: { excludedCartLineIds: [] } }],
            value: { percentage: { value: 10 } },
          },
        ],
        selectionStrategy: OrderDiscountSelectionStrategy.First,
      },
    });
    expect(result.operations[1]).toMatchObject({
      productDiscountsAdd: {
        candidates: [
          {
            message: "20% OFF PRODUCT",
            targets: [{ cartLine: { id: "gid://shopify/CartLine/0" } }],
            value: { percentage: { value: 20 } },
          },
        ],
        selectionStrategy: ProductDiscountSelectionStrategy.First,
      },
    });
  });

  it("targets the most expensive cart line for product discount", () => {
    const result = cartLinesDiscountsGenerateRun({
      cart: {
        lines: [
          {
            id: "gid://shopify/CartLine/0",
            cost: { subtotalAmount: { amount: "50.00" } },
          },
          {
            id: "gid://shopify/CartLine/1",
            cost: { subtotalAmount: { amount: "150.00" } },
          },
        ],
      },
      discount: { discountClasses: [DiscountClass.Product] },
    });
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0].productDiscountsAdd.candidates[0].targets[0]).toMatchObject({
      cartLine: { id: "gid://shopify/CartLine/1" },
    });
  });

  it("throws when cart has no lines", () => {
    expect(() =>
      cartLinesDiscountsGenerateRun({
        cart: { lines: [] },
        discount: { discountClasses: [] },
      })
    ).toThrow("No cart lines found");
  });
});
