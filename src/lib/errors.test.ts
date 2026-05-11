import { describe, expect, it } from "vitest";

import {
  AppError,
  DatabaseError,
  ProviderError,
  ValidationError,
  getErrorMessage,
} from "./errors";

describe("application errors", () => {
  it("keeps stable error codes and user-facing messages", () => {
    const error = new ProviderError("provider_failed", "Provider failed", {
      userMessage: "Model request failed",
    });

    expect(error.code).toBe("provider_failed");
    expect(getErrorMessage(error)).toBe("Model request failed");
  });

  it("normalizes unknown thrown values", () => {
    expect(getErrorMessage(new Error("Raw failure"))).toBe("Raw failure");
    expect(getErrorMessage("string failure")).toBe("string failure");
    expect(getErrorMessage(null)).toBe("Unknown error");
  });

  it("exposes specialized error classes", () => {
    expect(new AppError("app_error", "App")).toBeInstanceOf(Error);
    expect(new DatabaseError("db_error", "DB")).toBeInstanceOf(AppError);
    expect(new ValidationError("validation_error", "Invalid")).toBeInstanceOf(AppError);
  });
});
