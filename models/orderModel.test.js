// Billy Ho Cheng En, A0252588R

import mongoose from "mongoose";
import orderModel from "./orderModel.js";

describe("Order Model - Unit Tests", () => {
    test("should set default status to 'Not Processed' when status is omitted", () => {
        const order = new orderModel({
            products: [new mongoose.Types.ObjectId()],
            payment: { method: "cash" },
            buyer: new mongoose.Types.ObjectId(),
        });

        expect(order.status).toBe("Not Processed");
    });

    test.each([
        ["Not Processed"],
        ["Processing"],
        ["Shipped"],
        ["Delivered"],
        ["Cancelled"],
    ])("should accept valid status value: %s", (status) => {
        const order = new orderModel({
            products: [new mongoose.Types.ObjectId()],
            payment: { method: "cash" },
            buyer: new mongoose.Types.ObjectId(),
            status,
        });

        const validation = order.validateSync();
        expect(validation).toBeUndefined();
    });

    test("should reject invalid status value", () => {
        const order = new orderModel({
            products: [new mongoose.Types.ObjectId()],
            payment: { method: "cash" },
            buyer: new mongoose.Types.ObjectId(),
            status: "Invalid Status",
        });

        const validation = order.validateSync();
        expect(validation.errors.status).toBeDefined();
    });

    test("should keep products as an array of ObjectIds", () => {
        const productId = new mongoose.Types.ObjectId();
        const order = new orderModel({
            products: [productId],
            payment: { method: "cash" },
            buyer: new mongoose.Types.ObjectId(),
        });

        expect(order.products).toHaveLength(1);
        expect(order.products[0].toString()).toBe(productId.toString());
    });

    test("should define timestamps on schema", () => {
        expect(orderModel.schema.options.timestamps).toBe(true);
    });
});
