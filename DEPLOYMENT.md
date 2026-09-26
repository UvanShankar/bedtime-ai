# Deployment & CI/CD Guide: Bedtime AI

This guide explains how to connect your repository to **GitHub**, deploy the backend to **Render**, and manage the automated **CI/CD pipeline**.

---

## 1. Push to GitHub

1. Create a new repository on [GitHub](https://github.com/new) named `bedtime-ai` (leave it empty without initializing README, .gitignore, or license).
2. In your terminal, link your local repository and push:

```bash
cd C:\Users\Uvanshankar\bedtime-ai

# Add your GitHub remote URL (replace with your repo link):
git remote add origin https://github.com/UvanShankar/bedtime-ai.git

# Push to main branch:
git push -u origin main
```

---

## 2. Deploy Backend to Render

### Option A: Using Render Blueprints (Recommended)
1. Go to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Blueprint**.
3. Select your `bedtime-ai` repository.
4. Render will automatically detect [`render.yaml`](./render.yaml).
5. Review the service (`bedtime-ai-backend`) and fill in your environment variables:
   * `OPENAI_API_KEY`: Your OpenAI key.
   * `SARVAM_API_KEY`: Your Sarvam key.
   * `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` (if using S3).
6. Click **Apply**. Render will build and deploy your backend.

### Option B: Manual Web Service Setup on Render
1. In Render Dashboard, click **New +** -> **Web Service**.
2. Connect your GitHub repository `bedtime-ai`.
3. Configure the settings:
   * **Name**: `bedtime-ai-backend`
   * **Root Directory**: `backend`
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm start`
   * **Health Check Path**: `/api/v1/health`
4. Add your Environment Variables in the **Environment** tab.
5. Click **Create Web Service**.

---

## 3. Configure CI/CD Deploy Hook

When you push code to `main`, GitHub Actions automatically runs all tests and builds. To also automatically trigger a deployment to Render:

1. In your Render service page, navigate to **Settings** -> **Deploy Hook**.
2. Copy the Deploy Hook URL (`https://api.render.com/deploy/srv-xxxxxx?key=yyyyyy`).
3. In your GitHub repository:
   * Go to **Settings** -> **Secrets and variables** -> **Actions**.
   * Click **New repository secret**.
   * Name: `RENDER_DEPLOY_HOOK_URL`
   * Value: Paste the copied Render Deploy Hook URL.
   * Click **Add secret**.

Now, every time you push to `main`:
1. GitHub Actions will test both backend and mobile code.
2. If tests pass, it triggers the Render deploy hook automatically.

---

## 4. Connect Mobile App to Deployed Render Backend

Once your backend is live on Render (e.g. `https://bedtime-ai-backend.onrender.com`), update your mobile app:

In `mobile/.env`:
```ini
EXPO_PUBLIC_API_BASE_URL=https://bedtime-ai-backend.onrender.com/api/v1
EXPO_PUBLIC_ENV=production
```

Now your Expo app will connect to your live cloud backend from any device!
