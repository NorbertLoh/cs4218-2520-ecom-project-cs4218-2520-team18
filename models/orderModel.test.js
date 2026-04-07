import mongoose from "mongoose";
import orderModel from "./orderModel.js";

describe("Order Model - Comprehensive Validation Tests", () => {
  describe("Default Values", () => {
    describe("EP - Default Status", () => {
      test("should set default status to 'Not Processed' when not provided", () => {
        // Arrange
        const order = new orderModel({});

        // Act
        order.validateSync();

        // Assert
        expect(order.status).toBe("Not Processed");
      });
    });
  });

  describe("Status Field Validation", () => {
    describe("EP - Valid Status Values", () => {
      test.each([
        ["Not Processed", "Default status"],
        ["Processing", "Processing status"],
        ["Shipped", "Shipped status"],
        ["Delivered", "Delivered status"],
        ["Cancelled", "Cancelled status"],
      ])("should pass validation for status %p (%s)", (status, description) => {
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

    describe("EP - Invalid Status Values", () => {
      test.each([
        ["Invalid Status", "Not in enum list"],
        ["processed", "Lowercase valid status"],
        ["SHIPPED", "Uppercase valid status"],
        ["Pending", "Non-enum value"],
        ["Refunded", "Non-enum value"],
      ])("should fail validation for status %p (%s)", (status, description) => {
        // Arrange
        const order = new orderModel({ status });

        // Act
        const validation = order.validateSync();

        // Assert
        expect(validation).toBeDefined();
        expect(validation.errors.status).toBeDefined();
      });
    });
  });

  describe("Products Field Validation", () => {
    describe("EP - Valid Product Arrays", () => {
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

      test("should pass validation with a single valid ObjectId in products", () => {
        // Arrange
        const productId = new mongoose.Types.ObjectId();
        const order = new orderModel({ products: [productId] });

        // Act
        const validation = order.validateSync();

        // Assert
        if (validation) {
          expect(validation.errors.products).toBeUndefined();
        } else {
          expect(validation).toBeUndefined();
        }
      });

      test("should pass validation with multiple valid ObjectIds in products", () => {
        // Arrange
        const productIds = [
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId(),
        ];
        const order = new orderModel({ products: productIds });

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

    describe("EP - Invalid Product Values", () => {
      test("should fail validation with invalid ObjectId string in products", () => {
        // Arrange
        const order = new orderModel({
          products: ["not-a-valid-objectid"],
        });

        // Act
        const validation = order.validateSync();

        // Assert
        expect(validation).toBeDefined();
      });
    });

    describe("BVA - Product Array Size", () => {
      test("should pass validation with a large number of products", () => {
        // Arrange - test upper boundary with many products
        const manyProductIds = Array.from({ length: 100 }, () => new mongoose.Types.ObjectId());
        const order = new orderModel({ products: manyProductIds });

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
  });

  describe("Buyer Field Validation", () => {
    describe("EP - Valid Buyer ObjectId", () => {
      test("should pass validation with a valid ObjectId for buyer", () => {
        // Arrange
        const buyerId = new mongoose.Types.ObjectId();
        const order = new orderModel({ buyer: buyerId });

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

    describe("EP - No Buyer", () => {
      test("should pass validation when buyer is not provided", () => {
        // Arrange
        const order = new orderModel({});

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

    describe("EP - Invalid Buyer ObjectId", () => {
      test("should fail validation with an invalid ObjectId string for buyer", () => {
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
    describe("EP - Valid Payment Objects", () => {
      test("should pass validation with empty payment object", () => {
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

      test("should pass validation with simple payment object", () => {
        // Arrange
        const order = new orderModel({ payment: { method: "credit_card" } });

        // Act
        const validation = order.validateSync();

        // Assert
        if (validation) {
          expect(validation.errors.payment).toBeUndefined();
        } else {
          expect(validation).toBeUndefined();
        }
      });

      test("should pass validation with complex nested payment object", () => {
        // Arrange
        const complexPayment = {
          method: "credit_card",
          card: {
            last4: "1234",
            brand: "visa",
          },
          amount: 249.98,
          currency: "USD",
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
  });
});
