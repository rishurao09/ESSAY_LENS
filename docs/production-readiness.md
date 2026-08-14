# Essay Lens — Production Readiness Report

This report documents the Vercel production-readiness audit and hardening checks completed for the Essay Lens application.

---

## 🛠️ Stack Overview
- **Framework**: Next.js 16.3.1 (App Router)
- **Runtime Library**: React 19.2.8
- **Language**: TypeScript 5.x
- **Build Engine**: Next.js Compiler (Turbopack support)

---

## ⚡ Runtime Architecture & Vercel Compatibility

The runtime architecture has been audited and verified for compatibility with Vercel's serverless environment:

1. **Stateless Operations**: The app stores no state on the server, requiring no database connections or persistent server resources.
2. **Zero Filesystem Writes**: The analysis logic reads from statically bundled artifacts (`model-artifact.json` and `evaluation-results.json`) and does not write to the local filesystem at runtime. This avoids any serverless ephemeral write issues.
3. **Stateless Rate Limiting**: The API uses an in-memory map to track request frequencies per IP. While this isolates IP limits per function instance and resets during cold starts, it eliminates database dependencies (e.g. Redis) and keeps the deployment simple.
4. **Clean Configuration**: Duplicate Next configuration files (`next.config.ts`) were cleaned up to prevent compilation resolving issues. The build strictly utilizes `next.config.mjs`.

---

## 🔒 Security Audit
- **Exposed Secrets Check**: All `process.env` lookups are limited to server-side code (`openai-logprobs.ts` and `route.ts`). No client components expose raw keys or secrets.
- **Git Protection**: `.gitignore` safely ignores all local `.env*` files, preventing accidental secrets leakages.
- **Untrusted User Input**: Essay texts are validated strictly against Zod types, rejecting empty, excessively long, or malformed payloads before execution. Inputs are processed as pure text and are not rendered as unsafe HTML.

---

## 📦 Dependency & Vulnerability Audit
A vulnerability audit (`npm audit`) reports 6 vulnerabilities:
- **Scope**: All are local development dependencies (`esbuild`, `vite`, `vitest`, `@vitest/ui`, etc.).
- **Production Impact**: None of these packages are included in the production JS bundle deployed to Vercel. Thus, they represent **zero risk** to the live production server.

---

## 🎯 Verification & Build Results

### 1. TypeScript & Lint Checks
- **Command**: `npm run lint`
- **Result**: **PASS** with `0 errors` and `0 warnings`.

### 2. Unit Tests
- **Command**: `npm run test`
- **Result**: **PASS** (89/89 tests passed across 6 test suites).

### 3. Production Build Compilation
- **Command**: `npm run build`
- **Result**: **PASS** (Compiles successfully in 9 seconds, outputs standard Serverless functions and static page resources).

---

## ⚠️ Known Limitations
- **Language Scope**: The detector is trained and optimized specifically for English prose. Basic non-English content thresholds are in place to guide users when foreign character density exceeds 30%.
- **ESL writers FPR warning**: The evaluation results explicitly show a 44.4% False Positive Rate (FPR) for ESL writers. This warning is displayed prominently in the sidebar and evaluation layout to avoid misuse.
- **Logprobs instruct availability**: The optional LM perplexity signal depends on OpenAI completions API. Since chat models do not support `logprobs` and `echo`, the Instruct model `gpt-3.5-turbo-instruct` is required.
