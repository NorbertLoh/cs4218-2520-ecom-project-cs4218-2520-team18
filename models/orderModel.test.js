// Billy Ho Cheng En, A0252588R

import orderModel from "../models/orderModel.js";

describe("Order Model Unit Tests", () => {
  describe("Status Field Validation", () => {
    describe("EP - Valid Status Values", () => {
      test.each([
        ["Not Processed"],
        ["Processing"],
        ["Shipped"],
        ["Delivered"],
        ["Cancelled"],
      ])("should pass validation for status %p", (status) => {
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
        ["InvalidStatus", "Completely invalid value"],
        ["pending", "Lowercase variant not in enum"],
        ["", "Empty string not in enum"],
      ])("should fail validation for status %p (%s)", (status, description) => {
        // Arrange
        const order = new orderModel({ status });

        // Act
        const validation = order.validateSync();

        // Assert
        expect(validation.errors.status).toBeDefined();
      });
    });
  });

  describe("Schema Defaults", () => {
    test("should default status to 'Not Processed' when not provided", () => {
      // Arrange & Act
      const order = new orderModel({});

      // Assert
      expect(order.status).toBe("Not Processed");
    });

    test("should default status to 'Not Processed' when other fields are provided", () => {
      // Arrange & Act
      const order = new orderModel({ buyer: "507f1f77bcf86cd799439011" });

      // Assert
      expect(order.status).toBe("Not Processed");
    });
  });

  describe("Optional Fields", () => {
    test("should pass validation with empty object (no fields required)", () => {
      // Arrange
      const order = new orderModel({});

      // Act
      const validation = order.validateSync();

      // Assert
      expect(validation).toBeUndefined();
    });

    test.each([
      ["products"],
      ["payment"],
      ["buyer"],
    ])("should pass validation when %s is omitted", (field) => {
      // Arrange
      const allFields = {
        products: ["507f1f77bcf86cd799439011"],
        payment: { method: "credit_card" },
        buyer: "507f1f77bcf86cd799439011",
      };
      const { [field]: _omitted, ...fieldsWithoutOne } = allFields;
      const order = new orderModel(fieldsWithoutOne);

      // Act
      const validation = order.validateSync();

      // Assert
      expect(validation).toBeUndefined();
    });
  });

  describe("Schema Structure", () => {
    test("should have timestamps enabled", () => {
      // Arrange & Act
      const schemaOptions = orderModel.schema.options;

      // Assert
      expect(schemaOptions.timestamps).toBe(true);
    });

    test("should reference 'Products' collection for products field", () => {
      // Arrange & Act
      const productsPath = orderModel.schema.path("products");

      // Assert
      expect(productsPath.caster.options.ref).toBe("Products");
    });

    test("should reference 'users' collection for buyer field", () => {
      // Arrange & Act
      const buyerPath = orderModel.schema.path("buyer");

      // Assert
      expect(buyerPath.options.ref).toBe("users");
    });
  });
});
