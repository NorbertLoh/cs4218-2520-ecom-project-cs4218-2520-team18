// Billy Ho Cheng En, A0252588R

import mongoose from "mongoose";
import orderModel from "./orderModel.js";

describe("Order Model - Unit Tests", () => {
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
        ["Not Processed"],
        ["Processing"],
        ["Shipped"],
        ["Delivered"],
        ["Cancelled"],
      ])("should pass validation for status '%s'", (status) => {
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
        ["Invalid Status", "Completely unknown status"],
        ["processed", "Lowercase version of valid status"],
        ["SHIPPED", "Uppercase version of valid status"],
        ["", "Empty string"],
        [" ", "Whitespace-only string"],
        ["shipped ", "Status with trailing space"],
        ["Pending", "Non-existent status"],
      ])("should fail validation for status '%s' (%s)", (status, description) => {
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

  describe("Products Field", () => {
    describe("EP - Valid Products Array", () => {
      test("should accept an empty products array", () => {
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

      test("should accept a single valid ObjectId in products", () => {
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

      test("should accept multiple valid ObjectIds in products", () => {
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

    describe("EP - Products Field Not Provided", () => {
      test("should default to an empty array when products is not provided", () => {
        // Arrange
        const order = new orderModel({});

        // Act
        order.validateSync();

        // Assert
        expect(order.products).toBeDefined();
        expect(Array.isArray(order.products)).toBe(true);
      });
    });
  });

  describe("Buyer Field", () => {
    describe("EP - Valid Buyer ObjectId", () => {
      test("should accept a valid ObjectId for buyer", () => {
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

    describe("EP - Buyer Not Provided", () => {
      test("should not require buyer field (no validation error when omitted)", () => {
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
  });

  describe("Payment Field", () => {
    describe("EP - Valid Payment Objects", () => {
      test("should accept an empty payment object", () => {
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

      test("should accept a payment object with method and amount", () => {
        // Arrange
        const order = new orderModel({
          payment: { method: "credit_card", amount: 99.99 },
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

      test("should accept a nested payment object", () => {
        // Arrange
        const order = new orderModel({
          payment: {
            method: "credit_card",
            card: { last4: "1234", brand: "visa" },
            amount: 249.98,
            currency: "USD",
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

    describe("EP - Payment Not Provided", () => {
      test("should not require payment field (no validation error when omitted)", () => {
        // Arrange
        const order = new orderModel({});

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
    test("should have correct model name 'Order'", () => {
      // Assert
      expect(orderModel.modelName).toBe("Order");
    });

    test("should include timestamps (createdAt and updatedAt) in schema", () => {
      // Arrange
      const order = new orderModel({});

      // Assert
      expect(order.schema.options.timestamps).toBe(true);
    });

    test("should reflect provided values correctly on the model instance", () => {
      // Arrange
      const buyerId = new mongoose.Types.ObjectId();
      const productId = new mongoose.Types.ObjectId();
      const payment = { method: "cash", amount: 50 };

      const order = new orderModel({
        products: [productId],
        payment,
        buyer: buyerId,
        status: "Shipped",
      });

      // Act
      order.validateSync();

      // Assert
      expect(order.products[0].toString()).toBe(productId.toString());
      expect(order.payment).toMatchObject(payment);
      expect(order.buyer.toString()).toBe(buyerId.toString());
      expect(order.status).toBe("Shipped");
    });
  });
});
