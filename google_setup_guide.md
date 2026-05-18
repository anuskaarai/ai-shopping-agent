# How to Setup Real Google Login for Your App

Because you want this app to work for **everyone on all devices with any Google account**, you must generate a real **Google OAuth Client ID** that authorizes your specific Vercel URL. 

Google strictly prohibits random developers (or AI) from creating a "universal" login button that works on any website. You must tell Google exactly which website is allowed to show the login popup.

Here is exactly how to do it in 2 minutes:

## Step 1: Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Sign in with your Google account.
3. Click on the project dropdown at the top and select **"New Project"**.
4. Name it `ShopSense-Auth` (or whatever you prefer) and click **Create**.

## Step 2: Configure the OAuth Consent Screen
1. In the left sidebar, navigate to **APIs & Services > OAuth consent screen**.
2. Choose **External** (so anyone with a Google account can use it) and click **Create**.
3. Fill in the required fields:
   - App name: `ShopSense`
   - User support email: *(your email)*
   - Developer contact information: *(your email)*
4. Click **Save and Continue** through the next steps (Scopes, Test users) until you reach the Summary.
5. Click **Back to Dashboard**.
6. **CRITICAL:** Click the **"Publish App"** button so it is no longer in "Testing" mode.

## Step 3: Create the Client ID
1. In the left sidebar, click **Credentials**.
2. Click **+ Create Credentials** at the top and select **OAuth client ID**.
3. Set the Application type to **Web application**.
4. Name it `ShopSense Web Client`.
5. Under **Authorized JavaScript origins**, click "Add URI" and paste your Vercel URL exactly as it appears in the browser (e.g., `https://ai-shopping-agent-alpha.vercel.app`). Do not include a trailing slash (`/`).
   - *(Optional: Also add `http://localhost:5173` if you want it to work locally).*
6. Click **Create**.
7. A popup will appear with your **Client ID**. Copy it.

## Step 4: Add it to Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and open the `ai-shopping-agent` project.
2. Go to **Settings > Environment Variables**.
3. Add a new variable:
   - **Key:** `VITE_GOOGLE_CLIENT_ID`
   - **Value:** *(Paste the Client ID you copied)*
4. Click **Save**.

## Step 5: Redeploy
1. Go to the **Deployments** tab in Vercel.
2. Click the three dots on the latest deployment and select **Redeploy**.

Once the redeployment finishes, the Google Login button will appear on your website, and anyone in the world can successfully log in without seeing the `invalid_client` error!
