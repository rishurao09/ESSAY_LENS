# Deployment Guide

## Vercel Deployment (Recommended)

This application is designed for Vercel deployment from GitHub.

### Prerequisites
- GitHub account
- Vercel account
- (Optional) OpenAI API key for enhanced language model signal

### Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial Essay Lens deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will automatically detect Next.js

3. **Configure Environment Variables**
   In the Vercel dashboard → Settings → Environment Variables:

   | Variable | Required | Description |
   |----------|----------|-------------|
   | `OPENAI_API_KEY` | Optional | OpenAI API key for log-probability signal |
   | `MODEL_PROVIDER` | Optional | Set to `openai` if using API key |
   | `MODEL_NAME` | Optional | Default: `gpt-3.5-turbo-instruct` |

   **If no API key is provided**, the detector works in pure statistical mode.
   A banner will inform users that LM signal is unavailable.

4. **Deploy**
   Click "Deploy". Vercel handles the rest.

### Vercel Configuration

No custom `vercel.json` is required. Next.js is auto-detected.

Function settings:
- API routes are serverless functions (default)
- Timeout: 30 seconds (sufficient for analysis)
- No persistent storage required

### Environment Variable Security

- **NEVER commit** `.env` or `.env.local` to Git
- Use Vercel's environment variable system for production secrets
- `OPENAI_API_KEY` is only accessed server-side in API routes
- No environment variables are exposed to the client

---

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

For local development with OpenAI signal:
```bash
# Copy env template
cp .env.example .env.local

# Add your API key
OPENAI_API_KEY=sk-...

# Start dev server
npm run dev
```

The app works without any API key in pure statistical mode.

---

## Production Build

```bash
npm run build
npm run start
```

---

## Testing

```bash
# Unit tests
npm run test

# E2E tests (requires running dev server)
npm run test:e2e

# E2E with UI
npm run test:e2e:ui
```

---

## Known Vercel Constraints

- **No local file system persistence**: The app does not write to disk at runtime.
- **No background processes**: All analysis is request/response.
- **No large model downloads**: The classifier artifact (`model-artifact.json`) is ~4KB.
- **Function timeout**: Default 30s; analysis completes well within this.
- **Edge runtime**: Not used (standard Node.js serverless functions).
