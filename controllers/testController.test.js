// Loh Ze Qing Norbert, A0277473R

import { testController, createDummyBackendFunction } from "./testController.js";

describe("createDummyBackendFunction Unit Tests", () => {
  describe("Valid Partition - Expected Output", () => {
    test("should return exact string 'dummy backend function'", () => {
      // Arrange & Act
      const result = createDummyBackendFunction();

      // Assert
      expect(result).toBe("dummy backend function");
    });
  });

  describe("Invalid/Contract Assertions", () => {
    test("should return a non-empty string", () => {
      // Arrange & Act
      const result = createDummyBackendFunction();

      // Assert
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    test("should not return null or undefined", () => {
      // Arrange & Act
      const result = createDummyBackendFunction();

      // Assert
      expect(result).not.toBeNull();
      expect(result).not.toBeUndefined();
    });

    test("should not return incorrect strings (regression prevention)", () => {
      // Arrange & Act
      const result = createDummyBackendFunction();

      // Assert
      expect(result).not.toBe("dummy");
      expect(result).not.toBe("backend function");
      expect(result).not.toBe("dummy backend");
      expect(result).not.toBe("");
    });
  });
});

describe("testController Unit Tests", () => {
  let req, res;

  beforeEach(() => {
    // Arrange - Setup common request and response objects
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe("Access Validation", () => {
    test("should return 200 and success message when accessed", () => {
      // Act
      testController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Protected route accessed successfully",
        })
      );
    });
  });

  describe("System Error Handling", () => {
    let consoleSpy;
    beforeEach(() => {
      consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });
    afterEach(() => {
      consoleSpy.mockRestore();
    });

    test("should handle unexpected failures during execution", () => {

      res.status.mockImplementationOnce(() => {
        throw new Error("Unexpected internal error");
      });

      // Act
      testController(req, res);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Internal server error",
        })
      );
      // Verify error object is not exposed in response
      expect(res.send).toHaveBeenCalledWith(
        expect.not.objectContaining({
          error: expect.anything(),
        })
      );
    });
  });
});