# Dependency security update — 2026-10-19

Next.js and its ESLint configuration are aligned at 16.4.2; React/React DOM are aligned at 19.3.1. The package manager and deployment entry points use pnpm 12.14.0. Prisma stays on the stable 7.10.1 line; the registry latest tag points to an 8.0.0 release candidate. Other major migrations remain separate where compatibility has not been validated.

Security overrides pin affected transitive dependencies to patched releases. A 24-hour minimum release age applies; exact exceptions for reviewed security/package-type releases do not disable that policy globally. Dependency build scripts use explicit allowBuilds entries. The application build and deploy commands keep their existing lifecycle.

## Remaining advisory: braces

GHSA-vfj7-8cjw-p6xm has no published patched version. patches/braces@3.0.3.patch limits compile, expand, and stringify AST traversal to 128 levels. scripts/verify-dependency-security.cjs checks ordinary patterns and deeply nested brace/parenthesis inputs. Invalid deep patterns raise a controlled SyntaxError; callers must handle invalid patterns as usual. Direct externally supplied ASTs and all potential call sites have not been exhaustively audited. pnpm audit still reports the original 3.0.3 version; no advisory is hidden or ignored.

Run `node scripts/verify-dependency-security.cjs` after installing with the committed lockfile. Remove the local patch once an upstream fixed release is available and validated.

## Validation

See the change report for exact build/test results. pnpm audit returning nonzero for the documented upstream advisories does not mean the local braces patch failed. Build with project environment variables as required; validation must not run schema migrations or send test emails.
