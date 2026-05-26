import { createHash } from "node:crypto";

const errorPatterns = [
  /\b(error|exception|fatal|failed|failure|panic|unhandled|traceback|econnrefused|timeout)\b/i,
  /\b(5\d{2}|EADDRINUSE|ENOMEM|SIGSEGV|TypeError|ReferenceError|SyntaxError)\b/
];

const warningPatterns = [/\b(warn|warning|deprecated|retry|slow)\b/i];
const successPatterns = [/\b(success|succeeded|started|listening|ready|completed|connected|ok)\b/i];

export function classifyLogLine(stream: "out" | "error", message: string) {
  if (stream === "error" || errorPatterns.some((pattern) => pattern.test(message))) return "error";
  if (warningPatterns.some((pattern) => pattern.test(message))) return "warning";
  if (successPatterns.some((pattern) => pattern.test(message))) return "success";
  return "info";
}

export function fingerprint(message: string) {
  const normalized = message
    .replace(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/g, "<timestamp>")
    .replace(/\b\d+\b/g, "<number>")
    .replace(/[a-f0-9]{16,}/gi, "<hash>")
    .slice(0, 1000);

  return createHash("sha256").update(normalized).digest("hex");
}
