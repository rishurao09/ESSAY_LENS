# Essay Lens — Deployment Guide

This guide explains how to run Essay Lens locally and deploy it to production on Vercel.

---

## 🔑 Environment Variables

The application can run in two modes:
1. **Offline/Pure Statistical Mode** (Default, no APIs required)
2. **Hybrid Mode** (Includes OpenAI language model perplexity signals)

### Required Environment Variables

None. The core detector compiles, trains, and analyzes essays completely locally.

### Optional Environment Variables (For Hybrid Mode)

If you wish to include language-model token log-probabilities to supplement the analysis, configure these variables in Vercel:

| Variable | Description | Recommended Value |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | Your OpenAI API key | `sk-proj-...` |
| `MODEL_NAME` | Model to request token probabilities from | `gpt-3.5-turbo-instruct` |
| `MODEL_PROVIDER` | Must be set to `openai` | `openai` |

---

## 💻 Local Setup & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local` and add your OpenAI API key if desired:
```bash
cp .env.example .env.local
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build and Run Production Locally
```bash
npm run build
npm run start
```

---

## 🚀 Pushing to GitHub & Vercel Deployment

Since Next.js is natively optimized by Vercel, deployment requires no custom routing or configuration files.

### 1. Push to GitHub
Make sure all your local files are committed and pushed to your repo:
```bash
git add .
git commit -m "chore: prepare for release"
git push origin main
```

### 2. Import into Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** → **Project**.
3. Select your `ESSAY_LENS` repository.
4. Keep the default settings (Next.js is automatically detected).
5. In **Environment Variables**, add `OPENAI_API_KEY`, `MODEL_NAME`, and `MODEL_PROVIDER` if you are using the hybrid mode.
6. Click **Deploy**.

---

## ⚠️ Important Deployment Notes & Limitations

- **Stateless Rate Limiting**: The built-in rate limiter is in-memory and scales across serverless container boundaries. It isolates IPs dynamically per instance and resets on serverless cold starts. No Redis or external database is required.
- **Serverless Execution Timeout**: The OpenAI API request uses a `15s` network timeout, and the analyzer route terminates gracefully if the connection hangs.
- **Offline Fallback**: If the optional OpenAI logprobs fetch fails (e.g., rate limits, invalid keys, timeouts), the detector continues to calculate the core linguistic score based on the offline coefficients and displays a warning note explaining that the language-model signal is temporarily unavailable.
