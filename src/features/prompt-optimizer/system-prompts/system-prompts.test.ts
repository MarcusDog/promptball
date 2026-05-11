import { describe, expect, it } from "vitest";

import { AB_TEST_JUDGE_SYSTEM_PROMPT } from "./ab-test-judge.system.prompt";
import { COACH_SYSTEM_PROMPT } from "./coach.system.prompt";
import { DIAGNOSIS_SYSTEM_PROMPT } from "./diagnosis.system.prompt";
import { EVALUATOR_SYSTEM_PROMPT } from "./evaluator.system.prompt";
import { OPTIMIZER_SYSTEM_PROMPT } from "./optimizer.system.prompt";
import { VOICE_CLEANER_SYSTEM_PROMPT } from "./voice-cleaner.system.prompt";

describe("built-in system prompts", () => {
  it("defines all required prompt optimizer roles", () => {
    expect(OPTIMIZER_SYSTEM_PROMPT).toContain("Prompt Engineering");
    expect(DIAGNOSIS_SYSTEM_PROMPT).toContain("诊断");
    expect(COACH_SYSTEM_PROMPT).toContain("训练");
    expect(EVALUATOR_SYSTEM_PROMPT).toContain("JSON");
    expect(AB_TEST_JUDGE_SYSTEM_PROMPT).toContain("A/B");
    expect(VOICE_CLEANER_SYSTEM_PROMPT).toContain("口语化");
  });
});
