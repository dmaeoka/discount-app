import { describe, it, expect } from "vitest";

import {
  DeliveryDiscountSelectionStrategy,
  DiscountClass,
} from "../generated/api";

import { cartDeliveryOptionsDiscountsGenerateRun } from "./cart_delivery_options_discounts_generate_run";

const baseInput = {
  cart: {
    deliveryGroups: [
      {
        id: "gid://shopify/DeliveryGroup/0",
      },
    ],
  },
  discount: {
    discountClasses: [],
  },
};

describe("cartDeliveryOptionsDiscountsGenerateRun", () => {
  it("returns empty operations when Shipping class is not present", () => {
    const result = cartDeliveryOptionsDiscountsGenerateRun({
      ...baseInput,
      discount: { discountClasses: [] },
    });
    expect(result.operations).toHaveLength(0);
  });

  it("returns free delivery operation when Shipping class is present", () => {
    const result = cartDeliveryOptionsDiscountsGenerateRun({
      ...baseInput,
      discount: { discountClasses: [DiscountClass.Shipping] },
    });
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]).toMatchObject({
      deliveryDiscountsAdd: {
        candidates: [
          {
            message: "FREE DELIVERY",
            targets: [
              {
                deliveryGroup: {
                  id: "gid://shopify/DeliveryGroup/0",
                },
              },
            ],
            value: { percentage: { value: 100 } },
          },
        ],
        selectionStrategy: DeliveryDiscountSelectionStrategy.All,
      },
    });
  });

  it("targets first delivery group when multiple groups exist", () => {
    const result = cartDeliveryOptionsDiscountsGenerateRun({
      cart: {
        deliveryGroups: [
          { id: "gid://shopify/DeliveryGroup/0" },
          { id: "gid://shopify/DeliveryGroup/1" },
        ],
      },
      discount: { discountClasses: [DiscountClass.Shipping] },
    });
    expect(result.operations[0].deliveryDiscountsAdd.candidates[0].targets[0]).toMatchObject({
      deliveryGroup: { id: "gid://shopify/DeliveryGroup/0" },
    });
  });

  it("throws when cart has no delivery groups", () => {
    expect(() =>
      cartDeliveryOptionsDiscountsGenerateRun({
        cart: { deliveryGroups: [] },
        discount: { discountClasses: [] },
      })
    ).toThrow("No delivery groups found");
  });
});
