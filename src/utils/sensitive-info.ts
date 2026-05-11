export type SensitiveInfoType =
  | "api_key"
  | "github_token"
  | "token"
  | "password"
  | "email"
  | "phone"
  | "id_card"
  | "database_url"
  | "private_path";

export interface SensitiveInfoFinding {
  type: SensitiveInfoType;
  value: string;
  start: number;
  end: number;
}

interface SensitivePattern {
  type: SensitiveInfoType;
  pattern: RegExp;
}

const SENSITIVE_PATTERNS: SensitivePattern[] = [
  { type: "github_token", pattern: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g },
  { type: "api_key", pattern: /\bsk-[A-Za-z0-9_-]{12,}\b/g },
  {
    type: "database_url",
    pattern:
      /\b(?:postgres(?:ql)?|mysql|mariadb|mongodb|redis):\/\/[^\s"'<>]+/gi,
  },
  {
    type: "password",
    pattern: /\b(?:password|passwd|pwd)\s*[:=]\s*["']?[^"'\s]{6,}/gi,
  },
  {
    type: "token",
    pattern: /\b(?:api[_-]?token|access[_-]?token|secret[_-]?key)\s*[:=]\s*["']?[^"'\s]{10,}/gi,
  },
  {
    type: "email",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  },
  { type: "phone", pattern: /\b1[3-9]\d{9}\b/g },
  { type: "id_card", pattern: /\b[1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/g },
  {
    type: "private_path",
    pattern: /\b(?:[A-Z]:\\Users\\[^"'\n\r]+|\/Users\/[^"'\n\r]+|\/home\/[^"'\n\r]+)/g,
  },
];

export function detectSensitiveInfo(text: string): SensitiveInfoFinding[] {
  if (!text) {
    return [];
  }

  const findings = SENSITIVE_PATTERNS.flatMap(({ type, pattern }) => {
    const regex = new RegExp(pattern.source, pattern.flags);
    return Array.from(text.matchAll(regex), (match) => ({
      type,
      value: match[0],
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
    }));
  });

  return findings
    .sort((a, b) => a.start - b.start || b.end - a.end)
    .filter((finding, index, all) => {
      const previous = all[index - 1];
      return !previous || finding.start >= previous.end;
    });
}

export function redactSensitiveInfo(text: string): string {
  const findings = detectSensitiveInfo(text);
  if (findings.length === 0) {
    return text;
  }

  let cursor = 0;
  let output = "";

  for (const finding of findings) {
    output += text.slice(cursor, finding.start);
    output += `[REDACTED:${finding.type}]`;
    cursor = finding.end;
  }

  return output + text.slice(cursor);
}
