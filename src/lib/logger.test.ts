import { describe, expect, it, vi } from "vitest";

import { createLogger } from "./logger";

describe("logger", () => {
  it("prefixes namespace and respects level order", () => {
    const sink = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    const logger = createLogger("settings", { level: "warn", sink });

    logger.info("ignored");
    logger.warn("visible");

    expect(sink.info).not.toHaveBeenCalled();
    expect(sink.warn).toHaveBeenCalledWith("[PromptBall:settings]", "visible");
  });
});
