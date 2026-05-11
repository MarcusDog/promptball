import { describe, expect, it } from "vitest";

import { detectSensitiveInfo, redactSensitiveInfo } from "./sensitive-info";

describe("sensitive information detection", () => {
  it("detects common secrets and personal identifiers", () => {
    const text = [
      "OPENAI_API_KEY=sk-1234567890abcdef1234567890",
      "GitHub token ghp_1234567890abcdef1234567890abcdef1234",
      "email user@example.com",
      "phone 13800138000",
      "id card 11010519491231002X",
      "db postgres://user:password@localhost:5432/app",
    ].join("\n");

    const types = detectSensitiveInfo(text).map((finding) => finding.type);

    expect(types).toContain("api_key");
    expect(types).toContain("github_token");
    expect(types).toContain("email");
    expect(types).toContain("phone");
    expect(types).toContain("id_card");
    expect(types).toContain("database_url");
  });

  it("redacts sensitive values without deleting surrounding context", () => {
    const redacted = redactSensitiveInfo(
      "DeepSeek key sk-1234567890abcdef1234567890 for user@example.com",
    );

    expect(redacted).toContain("DeepSeek key");
    expect(redacted).toContain("[REDACTED:api_key]");
    expect(redacted).toContain("[REDACTED:email]");
    expect(redacted).not.toContain("sk-1234567890abcdef1234567890");
    expect(redacted).not.toContain("user@example.com");
  });
});
