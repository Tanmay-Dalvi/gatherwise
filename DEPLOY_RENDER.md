# Deploying GatherWise on Render

This guide provides exact, step-by-step instructions for deploying GatherWise to [Render](https://render.com) using **two separately created services**:
1. **Backend Web Service** (FastAPI / Python 3)
2. **Frontend Static Site** (React + Vite + Tailwind CSS)

> **Architecture Overview:**
> - The backend runs FastAPI with Uvicorn, serving the deterministic budget calculator, SQLite persistence, and Gemini GenAI integration under `/api/v1`.
> - The frontend is built into static HTML/CSS/JS and distributed globally via Render's CDN, communicating directly with the backend Web Service via HTTPS.

---

## Prerequisites

1. A [Render Account](https://render.com).
2. The GatherWise repository pushed to your GitHub account (`https://github.com/Tanmay-Dalvi/gatherwise`).
3. (Optional) A Google Gemini API key from [Google AI Studio](https://aistudio.google.com/). If omitted, GatherWise operates seamlessly in deterministic offline demo mode.

---

## Deployment Sequence

Deploy the backend first so you have its public HTTPS URL to supply to the frontend build.

```
Step 1: Deploy Backend Web Service
       └── Obtain Backend URL (e.g. https://gatherwise-api.onrender.com)
Step 2: Deploy Frontend Static Site
       └── Configure VITE_API_BASE_URL with the backend URL
Step 3: Update Backend CORS
       └── Add Frontend URL to CORS_ORIGINS
```

---

## Step 1: Deploy the Backend Web Service

1. Log in to the [Render Dashboard](https://dashboard.render.com).
2. Click **New +** at the top right and select **Web Service**.
3. Select **Build and deploy from a Git repository**, click **Next**, and connect your GitHub repository (`Tanmay-Dalvi/gatherwise`).
4. Configure the service settings:

| Setting | Value | Notes |
| :--- | :--- | :--- |
| **Name** | `gatherwise-api` | Or your preferred name |
| **Region** | Oregon (US West) | Or region closest to you |
| **Branch** | `main` | Production branch |
| **Root Directory** | *(leave empty)* | Repository root |
| **Runtime** | `Python 3` | Render native Python |
| **Build Command** | `pip install -r backend/requirements.txt` | Installs FastAPI, Uvicorn, Pydantic, HTTPX |
| **Start Command** | `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT` | Binds to Render dynamic port |
| **Instance Type** | `Free` (or `Starter`) | Free tier is fully supported |

5. Expand **Advanced** and configure:
   - **Health Check Path**: `/api/v1/health`
   - **Auto-Deploy**: `Yes`

6. Add the following **Environment Variables**:

| Key | Value | Purpose |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.11.9` | Ensures a stable Python runtime |
| `ENVIRONMENT` | `production` | Enables production security settings |
| `GEMINI_API_KEY` | *(your Gemini API key)* | Optional. Leave empty for demo mode |
| `DATABASE_PATH` | `gatherwise.db` | Local SQLite path |
| `CORS_ORIGINS` | `http://localhost:5173` | Temporary until frontend URL is known |

7. Click **Create Web Service**.
8. Wait for the build and deployment to finish. Once complete, copy your backend URL (e.g., `https://gatherwise-api.onrender.com`).
9. Verify health in your browser or terminal:
   ```bash
   curl https://gatherwise-api.onrender.com/api/v1/health
   # Expected response: {"status":"ok","version":"1.0.0","database":"connected",...}
   ```

---

## Step 2: Deploy the Frontend Static Site

1. In the [Render Dashboard](https://dashboard.render.com), click **New +** and select **Static Site**.
2. Connect your GitHub repository (`Tanmay-Dalvi/gatherwise`).
3. Configure the static site settings:

| Setting | Value | Notes |
| :--- | :--- | :--- |
| **Name** | `gatherwise` | Or your preferred name |
| **Branch** | `main` | Production branch |
| **Root Directory** | `frontend` | Sets frontend workspace |
| **Build Command** | `npm install && npm run build` | Compiles TypeScript and runs Vite build |
| **Publish Directory** | `dist` | Folder produced by Vite inside `frontend/` |

*(Alternative: If Root Directory is left blank, use Build Command `cd frontend && npm install && npm run build` and Publish Directory `frontend/dist`)*.

4. Expand **Advanced** and add the following **Environment Variable**:

| Key | Value | Purpose |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://gatherwise-api.onrender.com` | **Your Step 1 backend URL** (no trailing slash) |

5. Configure **Redirects / Rewrites** (under Static Site settings):
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
   *(This ensures single-page application routing behaves correctly if routes are accessed directly).*

6. Click **Create Static Site**.
7. Wait for the build to finish. Once deployed, Render will provide your public frontend URL (e.g., `https://gatherwise.onrender.com`).

---

## Step 3: Update Backend CORS Configuration

Now that you have your live frontend URL, authorize it on the backend:

1. Return to the **gatherwise-api** Web Service in the Render Dashboard.
2. Navigate to **Environment**.
3. Edit `CORS_ORIGINS` to include your production frontend URL:
   ```
   https://gatherwise.onrender.com,http://localhost:5173
   ```
   > **Note**: Do not include trailing slashes in CORS origins (`https://gatherwise.onrender.com/` will cause browser CORS rejection; use `https://gatherwise.onrender.com`).
4. Click **Save Changes**. Render will automatically restart the backend service with the updated CORS configuration.

---

## Database Persistence & Storage Architecture

### Render Free Tier (Ephemeral Storage)
Render Free Web Services use an ephemeral filesystem. If your service spins down after 15 minutes of inactivity or restarts during a redeployment:
- The local SQLite database (`gatherwise.db`) resets to a fresh schema.
- **GatherWise handles this gracefully**: Click **"Load Demo Celebrations"** on the dashboard at any time to instantly seed realistic, fully populated plans for weddings, birthdays, and community festivals.

### Render Starter Tier (Persistent Disk)
For permanent production persistence without external database hosting:
1. Upgrade the backend Web Service to the **Starter Plan** ($7/month).
2. Go to **Disks** in the service dashboard and click **Add Disk**.
3. Name: `gatherwise-data`, Mount Path: `/var/data`, Size: `1 GB` ($0.25/month).
4. In **Environment**, update:
   ```
   DATABASE_PATH=/var/data/gatherwise.db
   ```
5. Save changes. The SQLite database will now permanently persist across deployments and reboots.

---

## Verification & Smoke Test Checklist

After deployment, test the full user journey:

1. **System Health Check**:
   Open `https://<your-backend>.onrender.com/api/v1/health`. Ensure `"status": "ok"` and `"database": "connected"`.
2. **Dashboard Load**:
   Open `https://<your-frontend>.onrender.com`. The GatherWise dashboard should load with the editorial celebration theme.
3. **Demo Celebrations**:
   Click **"Load Demo Celebrations"**. Confirm that sample wedding, birthday, and community festival cards appear.
4. **Plan Creation**:
   Click **"Plan New Celebration"**, fill in the event modal (title, date, budget, guest count, style), and generate a plan.
5. **Budget Recalculation**:
   Navigate to the **Budget** tab. Edit an item's actual cost or add a custom expense row. Confirm estimated, actual, remaining, and variance calculations update instantly.
6. **Timeline & Checklist**:
   Toggle milestone statuses and checklist tasks. Confirm progress indicators respond.
7. **Export & Print**:
   Click **Export / Print**. Test Markdown download, JSON backup, and print view.

---

## Troubleshooting

- **Cold Starts (Render Free Tier)**: Render free web services spin down after 15 minutes of inactivity. The first request may take 30–50 seconds to wake up the backend. The frontend displays graceful loading indicators during this warmup.
- **CORS Error in Browser Console**: Verify that `CORS_ORIGINS` in your backend Web Service includes your exact frontend URL without trailing slashes.
- **Frontend Fails to Reach API**: Check that `VITE_API_BASE_URL` was defined before the frontend was built. If changed later, trigger a **Manual Deploy > Clear build cache & deploy** in the Static Site dashboard.
