import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import UpdateProduct from "./UpdateProduct";
import { MemoryRouter } from "react-router-dom";

// Mock external services
jest.mock("axios");
jest.mock("react-hot-toast");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => ({ slug: "test-product" }),
}));

jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu" />
));

// Mock antd Select to a simple HTML select for logic testing
jest.mock("antd", () => {
  const MockSelect = ({ children, onChange, placeholder, value }) => (
    <select
      data-testid={`select-${placeholder}`}
      onChange={(e) => onChange?.(e.target.value)}
      value={value || ""}
    >
      <option value="">--</option>
      {children}
    </select>
  );
  MockSelect.Option = ({ children, value }) => (
    <option value={value}>{children}</option>
  );
  return { Select: MockSelect };
});

global.URL.createObjectURL = jest.fn(() => "mock-url");

const mockCategories = [
  { _id: "cat1", name: "Electronics" },
  { _id: "cat2", name: "Clothing" },
];

const mockProduct = {
  _id: "prod1",
  name: "Test Product",
  description: "Test Description",
  price: 100,
  quantity: 10,
  shipping: true,
  category: { _id: "cat1", name: "Electronics" },
};

describe("UpdateProduct", () => {
  let consoleSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, "log").mockImplementation();

    axios.get.mockImplementation((url) => {
      if (url.includes("get-product")) {
        return Promise.resolve({ data: { product: mockProduct } });
      }
      if (url.includes("get-category")) {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    axios.put.mockResolvedValue({ data: { success: false } });
    axios.delete.mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <UpdateProduct />
      </MemoryRouter>
    );

  // Helper: wait for both initial API calls to complete and form to populate
  const waitForDataLoad = async () => {
    await waitFor(() => {
      expect(screen.getByPlaceholderText("write a name")).toHaveValue(
        "Test Product"
      );
    });
  };

  describe("initial data loading", () => {
    it("should fetch single product using slug from params on mount", async () => {
      renderComponent();
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/test-product"
        );
      });
    });

    it("should fetch all categories on mount", async () => {
      renderComponent();
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/category/get-category"
        );
      });
    });

    it("should populate form fields with fetched product data", async () => {
      renderComponent();
      await waitForDataLoad();

      expect(screen.getByPlaceholderText("write a name")).toHaveValue(
        "Test Product"
      );
      expect(screen.getByPlaceholderText("write a description")).toHaveValue(
        "Test Description"
      );
      expect(screen.getByPlaceholderText("write a Price")).toHaveValue(100);
      expect(screen.getByPlaceholderText("write a quantity")).toHaveValue(10);
    });

    it("should log error when single product fetch fails", async () => {
      const fetchError = new Error("Product not found");
      axios.get.mockImplementation((url) => {
        if (url.includes("get-product")) {
          return Promise.reject(fetchError);
        }
        if (url.includes("get-category")) {
          return Promise.resolve({
            data: { success: true, category: mockCategories },
          });
        }
      });
      renderComponent();
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(fetchError);
      });
    });

    it("should show error toast when category fetch fails", async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes("get-product")) {
          return Promise.resolve({ data: { product: mockProduct } });
        }
        if (url.includes("get-category")) {
          return Promise.reject(new Error("Category error"));
        }
      });
      renderComponent();
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Something wwent wrong in getting catgeory"
        );
      });
    });
  });

  describe("product update (handleUpdate)", () => {
    it("should call axios.put with FormData when UPDATE PRODUCT is clicked", async () => {
      renderComponent();
      await waitForDataLoad();

      fireEvent.click(screen.getByText("UPDATE PRODUCT"));

      expect(axios.put).toHaveBeenCalledWith(
        "/api/v1/product/update-product/prod1",
        expect.any(FormData)
      );
    });

    it("should include correct fields in FormData", async () => {
      const appendSpy = jest.spyOn(FormData.prototype, "append");
      renderComponent();
      await waitForDataLoad();

      fireEvent.click(screen.getByText("UPDATE PRODUCT"));

      expect(appendSpy).toHaveBeenCalledWith("name", "Test Product");
      expect(appendSpy).toHaveBeenCalledWith(
        "description",
        "Test Description"
      );
      expect(appendSpy).toHaveBeenCalledWith("price", 100);
      expect(appendSpy).toHaveBeenCalledWith("quantity", 10);
      expect(appendSpy).toHaveBeenCalledWith("category", "cat1");

      appendSpy.mockRestore();
    });

    it("should not append photo to FormData when no new photo is selected", async () => {
      const appendSpy = jest.spyOn(FormData.prototype, "append");
      renderComponent();
      await waitForDataLoad();

      fireEvent.click(screen.getByText("UPDATE PRODUCT"));

      const photoAppendCalls = appendSpy.mock.calls.filter(
        ([key]) => key === "photo"
      );
      expect(photoAppendCalls).toHaveLength(0);

      appendSpy.mockRestore();
    });

    it("should show success toast and navigate when API returns success true", async () => {
      axios.put.mockResolvedValue({ data: { success: true } });
      renderComponent();
      await waitForDataLoad();

      fireEvent.click(screen.getByText("UPDATE PRODUCT"));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
      });
    });

    it("should show error toast with API message when API returns success false", async () => {
      axios.put.mockResolvedValue({
        data: { success: false, message: "Update failed" },
      });
      renderComponent();
      await waitForDataLoad();

      fireEvent.click(screen.getByText("UPDATE PRODUCT"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Update failed");
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should show error toast when update throws an error", async () => {
      axios.put.mockImplementation(() => {
        throw new Error("Update failed");
      });
      renderComponent();
      await waitForDataLoad();

      fireEvent.click(screen.getByText("UPDATE PRODUCT"));

      expect(toast.error).toHaveBeenCalledWith("something went wrong");
    });
  });

  describe("product deletion (handleDelete)", () => {
    it("should prompt user for confirmation when DELETE PRODUCT is clicked", async () => {
      window.prompt = jest.fn().mockReturnValue(null);
      renderComponent();
      await waitForDataLoad();

      fireEvent.click(screen.getByText("DELETE PRODUCT"));

      expect(window.prompt).toHaveBeenCalledWith(
        "Are You Sure want to delete this product ? "
      );
    });

    it("should call axios.delete and navigate on user confirmation", async () => {
      window.prompt = jest.fn().mockReturnValue("yes");
      renderComponent();
      await waitForDataLoad();

      fireEvent.click(screen.getByText("DELETE PRODUCT"));

      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(
          "/api/v1/product/delete-product/prod1"
        );
        expect(toast.success).toHaveBeenCalledWith(
          "Product DEleted Succfully"
        );
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
      });
    });

    it("should not call API when user cancels prompt (null)", async () => {
      window.prompt = jest.fn().mockReturnValue(null);
      renderComponent();
      await waitForDataLoad();

      fireEvent.click(screen.getByText("DELETE PRODUCT"));

      expect(axios.delete).not.toHaveBeenCalled();
    });

    it("should not call API when user enters empty string in prompt", async () => {
      window.prompt = jest.fn().mockReturnValue("");
      renderComponent();
      await waitForDataLoad();

      fireEvent.click(screen.getByText("DELETE PRODUCT"));

      expect(axios.delete).not.toHaveBeenCalled();
    });

    it("should show error toast when deletion fails", async () => {
      window.prompt = jest.fn().mockReturnValue("yes");
      axios.delete.mockRejectedValue(new Error("Delete failed"));
      renderComponent();
      await waitForDataLoad();

      fireEvent.click(screen.getByText("DELETE PRODUCT"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Something went wrong");
      });
    });
  });
});
