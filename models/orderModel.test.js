// Billy Ho Cheng En, A0252588R

import mongoose from "mongoose";
import orderModel from "./orderModel.js";

describe("Order Model - Unit Tests", () => {
  describe("Default Values", () => {
    test("should set default status to 'Not Processed' when omitted", () => {
      // Arrange
      const order = new orderModel({});

      // Assert
      expect(order.status).toBe("Not Processed");
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

    describe("EP - Invalid Status Value", () => {
      test("should fail validation for an invalid status value", () => {
        // Arrange
        const order = new orderModel({ status: "Invalid Status" });

        // Act
        const validation = order.validateSync();

        // Assert
        expect(validation).toBeDefined();
        expect(validation.errors.status).toBeDefined();
      });

      test.each([
        ["not processed", "Lowercase"],
        ["PROCESSING", "Uppercase"],
        ["shipped!", "Special character"],
        ["", "Empty string"],
        [" ", "Whitespace only"],
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

  describe("Products Field", () => {
    test("should default products to an empty array", () => {
      // Arrange
      const order = new orderModel({});

      // Assert
      expect(order.products).toEqual([]);
    });

    test("should accept a single valid ObjectId in products", () => {
      // Arrange
      const id = new mongoose.Types.ObjectId();
      const order = new orderModel({ products: [id] });

      // Act
      const validation = order.validateSync();

      // Assert
      if (validation) {
        expect(validation.errors.products).toBeUndefined();
      } else {
        expect(validation).toBeUndefined();
      }
      expect(order.products).toHaveLength(1);
      expect(order.products[0].toString()).toBe(id.toString());
    });

    test("should accept multiple valid ObjectIds in products", () => {
      // Arrange
      const ids = [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
      ];
      const order = new orderModel({ products: ids });

      // Act
      const validation = order.validateSync();

      // Assert
      if (validation) {
        expect(validation.errors.products).toBeUndefined();
      } else {
        expect(validation).toBeUndefined();
      }
      expect(order.products).toHaveLength(2);
    });
  });

  describe("Buyer Field", () => {
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
      expect(order.buyer.toString()).toBe(buyerId.toString());
    });

    test("should allow buyer to be omitted", () => {
      // Arrange
      const order = new orderModel({});

      // Act
      const validation = order.validateSync();

      // Assert
      if (validation) {
        expect(validation.errors.buyer).toBeUndefined();
      }
      expect(order.buyer).toBeUndefined();
    });
  });

  describe("Payment Field", () => {
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

    test("should accept a payment object with arbitrary fields", () => {
      // Arrange
      const payment = { method: "credit_card", transactionId: "txn-001", amount: 99.99 };
      const order = new orderModel({ payment });

      // Act
      const validation = order.validateSync();

      // Assert
      if (validation) {
        expect(validation.errors.payment).toBeUndefined();
      } else {
        expect(validation).toBeUndefined();
      }
      expect(order.payment.method).toBe("credit_card");
      expect(order.payment.transactionId).toBe("txn-001");
      expect(order.payment.amount).toBe(99.99);
    });

    test("should allow payment to be omitted", () => {
      // Arrange
      const order = new orderModel({});

      // Act
      const validation = order.validateSync();

      // Assert
      if (validation) {
        expect(validation.errors.payment).toBeUndefined();
      }
    });
  });

  describe("Schema Structure", () => {
    test("should have timestamps (createdAt and updatedAt) in schema options", () => {
      // Assert
      expect(orderModel.schema.options.timestamps).toBe(true);
    });

    test("should have products referencing 'Products' model", () => {
      // Arrange
      const productPath = orderModel.schema.path("products");

      // Assert
      expect(productPath).toBeDefined();
      expect(productPath.caster.options.ref).toBe("Products");
    });

    test("should have buyer referencing 'users' model", () => {
      // Arrange
      const buyerPath = orderModel.schema.path("buyer");

      // Assert
      expect(buyerPath).toBeDefined();
      expect(buyerPath.options.ref).toBe("users");
    });

    test("should have status with correct enum values", () => {
      // Arrange
      const statusPath = orderModel.schema.path("status");

      // Assert
      expect(statusPath.enumValues).toEqual([
        "Not Processed",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
      ]);
    });
  });
});
