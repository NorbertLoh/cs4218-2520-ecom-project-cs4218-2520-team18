import mongoose from "mongoose";
import orderModel from "../models/orderModel.js";

describe("Order Model Unit Tests", () => {
  describe("Status Field Validation", () => {
    describe("EP - Default Value", () => {
      test("should apply default status 'Not Processed' when status is omitted", () => {
        // Arrange
        const order = new orderModel({});

        // Act
        // (default is applied on instantiation)

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
      ])("should pass validation for valid status: %s", (status) => {
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
      test("should fail validation for invalid status value", () => {
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
    describe("EP - Empty Array", () => {
      test("should pass validation with empty products array", () => {
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

    describe("EP - Valid ObjectId in Array", () => {
      test("should pass validation with valid ObjectId in products array", () => {
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

    describe("EP - Invalid ObjectId in Array", () => {
      test("should fail validation with invalid ObjectId string in products array", () => {
        // Arrange
        const order = new orderModel({ products: ["not-a-valid-objectid"] });

        // Act
        const validation = order.validateSync();

        // Assert
        expect(validation).toBeDefined();
        expect(validation.errors["products.0"]).toBeDefined();
      });
    });
  });

  describe("Buyer Field Validation", () => {
    describe("EP - Valid ObjectId", () => {
      test("should pass validation with valid ObjectId for buyer", () => {
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

    describe("EP - Invalid ObjectId", () => {
      test("should fail validation with invalid ObjectId string for buyer", () => {
        // Arrange
        const order = new orderModel({ buyer: "not-a-valid-objectid" });

        // Act
        const validation = order.validateSync();

        // Assert
        expect(validation).toBeDefined();
        expect(validation.errors.buyer).toBeDefined();
      });
    });
  });

  describe("Payment Field Validation", () => {
    describe("EP - Empty Object", () => {
      test("should accept empty object as payment", () => {
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
      test("should accept simple object with properties as payment", () => {
        // Arrange
        const order = new orderModel({ payment: { method: "credit_card", amount: 100 } });

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
      test("should accept complex nested object as payment", () => {
        // Arrange
        const complexPayment = {
          method: "credit_card",
          card: { last4: "1234", brand: "visa" },
          amount: 249.98,
          currency: "USD",
          metadata: { orderId: "order-123" },
        };
        const order = new orderModel({ payment: complexPayment });

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
      test.each([
        ["null", null],
        ["undefined", undefined],
      ])("should accept %s as payment (Mixed type flexibility)", (label, value) => {
        // Arrange
        const order = new orderModel({ payment: value });

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

    test("should have all expected schema fields", () => {
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
