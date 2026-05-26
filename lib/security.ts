import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function createProjectToken() {
  return `hlog_${randomBytes(32).toString("base64url")}`;
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
