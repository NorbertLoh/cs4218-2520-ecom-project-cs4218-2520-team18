// Billy Ho Cheng En, A0252588R

import mongoose from "mongoose";
import orderModel from "./orderModel.js";

describe("Order Model Unit Tests", () => {
  describe("Status Field Validation", () => {
    describe("EP - Default Status Value", () => {
      test("should apply default status of 'Not Processed' when status is omitted", () => {
        // Arrange
        const order = new orderModel({});

        // Act
        // (default is applied at instantiation)

        // Assert
        expect(order.status).toBe("Not Processed");
      });
    });

    describe("EP - Valid Enum Values", () => {
      test.each([
        ["Not Processed"],
        ["Processing"],
        ["Shipped"],
        ["Delivered"],
        ["Cancelled"],
      ])("should pass validation for valid status: '%s'", (status) => {
        // Arrange
        const order = new orderModel({ status });

        // Act
        const validation = order.validateSync();

        // Assert
        if (validation) {
          expect(validation.errors.status).toBeUndefined();
        } else {
          expect(validation).toBeUndefined();
        }
      });
    });

    describe("EP - Invalid Status Value", () => {
      test("should produce a validation error for an invalid status value", () => {
        // Arrange
        const order = new orderModel({ status: "Invalid Status" });

        // Act
        const validation = order.validateSync();

        // Assert
        expect(validation).toBeDefined();
        expect(validation.errors.status).toBeDefined();
      });
    });
  });

  describe("Products Field Validation", () => {
    describe("EP - Empty Products Array", () => {
      test("should pass validation with an empty products array", () => {
        // Arrange
        const order = new orderModel({ products: [] });

        // Act
        const validation = order.validateSync();

        // Assert
        if (validation) {
          expect(validation.errors.products).toBeUndefined();
        } else {
          expect(validation).toBeUndefined();
        }
      });
    });

    describe("EP - Valid ObjectId in Products", () => {
      test("should pass validation with a valid ObjectId in products array", () => {
        // Arrange
        const validId = new mongoose.Types.ObjectId();
        const order = new orderModel({ products: [validId] });

        // Act
        const validation = order.validateSync();

        // Assert
        if (validation) {
          expect(validation.errors["products.0"]).toBeUndefined();
        } else {
          expect(validation).toBeUndefined();
        }
      });
    });

    describe("EP - Invalid ObjectId in Products", () => {
      test("should trigger a CastError for an invalid ObjectId string in products array", () => {
        // Arrange
        const order = new orderModel({ products: ["not-a-valid-objectid"] });

        // Act
        const validation = order.validateSync();

        // Assert
        expect(validation).toBeDefined();
        expect(validation.errors["products.0"]).toBeDefined();
        expect(validation.errors["products.0"].name).toBe("CastError");
      });
    });
  });

  describe("Buyer Field Validation", () => {
    describe("EP - Valid ObjectId for Buyer", () => {
      test("should pass validation with a valid ObjectId for buyer", () => {
        // Arrange
        const validId = new mongoose.Types.ObjectId();
        const order = new orderModel({ buyer: validId });

        // Act
        const validation = order.validateSync();

        // Assert
        if (validation) {
          expect(validation.errors.buyer).toBeUndefined();
        } else {
          expect(validation).toBeUndefined();
        }
      });
    });

    describe("EP - Invalid ObjectId for Buyer", () => {
      test("should trigger a CastError for an invalid ObjectId string as buyer", () => {
        // Arrange
        const order = new orderModel({ buyer: "not-a-valid-objectid" });

        // Act
        const validation = order.validateSync();

        // Assert
        expect(validation).toBeDefined();
        expect(validation.errors.buyer).toBeDefined();
        expect(validation.errors.buyer.name).toBe("CastError");
      });
    });
  });

  describe("Payment Field Validation", () => {
    describe("EP - Empty Object", () => {
      test("should accept an empty object as payment", () => {
        // Arrange
        const order = new orderModel({ payment: {} });

        // Act
        const validation = order.validateSync();

        // Assert
        if (validation) {
          expect(validation.errors.payment).toBeUndefined();
        } else {
          expect(validation).toBeUndefined();
        }
      });
    });

    describe("EP - Simple Object with Properties", () => {
      test("should accept a simple object with properties as payment", () => {
        // Arrange
        const order = new orderModel({ payment: { method: "credit_card", amount: 99.99 } });

        // Act
        const validation = order.validateSync();

        // Assert
        if (validation) {
          expect(validation.errors.payment).toBeUndefined();
        } else {
          expect(validation).toBeUndefined();
        }
      });
    });

    describe("EP - Complex Nested Object", () => {
      test("should accept a complex nested object as payment", () => {
        // Arrange
        const order = new orderModel({
          payment: {
            method: "credit_card",
            card: { last4: "1234", brand: "visa" },
            metadata: { orderId: "order-123" },
          },
        });

        // Act
        const validation = order.validateSync();

        // Assert
        if (validation) {
          expect(validation.errors.payment).toBeUndefined();
        } else {
          expect(validation).toBeUndefined();
        }
      });
    });

    describe("EP - Null and Undefined Values", () => {
      test("should accept null as payment (Mixed type flexibility)", () => {
        // Arrange
        const order = new orderModel({ payment: null });

        // Act
        const validation = order.validateSync();

        // Assert
        if (validation) {
          expect(validation.errors.payment).toBeUndefined();
        } else {
          expect(validation).toBeUndefined();
        }
      });

      test("should accept undefined as payment (Mixed type flexibility)", () => {
        // Arrange
        const order = new orderModel({ payment: undefined });

        // Act
        const validation = order.validateSync();

        // Assert
        if (validation) {
          expect(validation.errors.payment).toBeUndefined();
        } else {
          expect(validation).toBeUndefined();
        }
      });
    });
  });

  describe("Schema Structure", () => {
    test("should have model name 'Order'", () => {
      // Arrange & Act
      const modelName = orderModel.modelName;

      // Assert
      expect(modelName).toBe("Order");
    });

    test("should include all expected schema paths", () => {
      // Arrange
      const schemaPaths = Object.keys(orderModel.schema.paths);

      // Act & Assert
      expect(schemaPaths).toContain("products");
      expect(schemaPaths).toContain("payment");
      expect(schemaPaths).toContain("buyer");
      expect(schemaPaths).toContain("status");
    });
  });
});
