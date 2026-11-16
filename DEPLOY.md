# Deploy a public preview

The repository includes a Render Blueprint for a single-origin demo deployment. It serves the portal, lesson demos, fixture media, Swagger UI, and API from one `onrender.com` address. The Blueprint uses in-memory demo data and a generated server secret; it is intended for a preview, not for storing real learner information.

## 1. Put the prepared project in a repository Render can access

Render deploys from a connected Git repository. Connect the branch that contains `Dockerfile.render`, `render.yaml`, and these deployment changes. If this project is not in a connected remote repository yet, push the branch from your Git client or GitHub account, then continue.

## 2. Create the Render service

1. Sign in to Render and select **New + → Blueprint**.
2. Connect the repository and select the branch containing `render.yaml`.
3. Review the `savanna-access-kit` web service and choose **Apply**.
4. Wait for the Docker build and deploy to finish. Open the service and copy its `https://…onrender.com` URL.

Render sets `RENDER_EXTERNAL_URL` for the service. The app uses that URL to allow the hosted page's demo API key and to produce public credential links. Render also generates `SECRET_KEY`; keep it in the service environment and do not put it in a page or share it.

## 3. Share the project links

Replace `<service-url>` below with the URL shown on the Render service page:

- Portal: `<service-url>/`
- Accessible lesson demo: `<service-url>/savanna/pages/concept-with-navigation.html`
- Career Gateway: `<service-url>/savanna/pages/jobs.html`
- Standalone component demo: `<service-url>/demo/blank.html`
- Interactive player sandbox: `<service-url>/demo/sandbox-player/`
- API documentation: `<service-url>/docs`

## 4. Check the deployment

Open these in a browser. The health endpoint should return JSON with `"status":"ok"`:

- `<service-url>/`
- `<service-url>/v1/health`
- `<service-url>/docs`
- `<service-url>/savanna/pages/concept-with-navigation.html`
- `<service-url>/savanna/pages/jobs.html`
- `<service-url>/demo/sandbox-player/`

To check that the lesson API and fixture media are available in PowerShell:

```powershell
$url = "https://your-service.onrender.com"
Invoke-RestMethod -Uri "$url/v1/health"
Invoke-RestMethod -Uri "$url/v1/lessons/L-103" -Headers @{ "X-Savanna-Key" = "pk_demo_public" }
Invoke-WebRequest -Uri "$url/media/lesson.mp4" -Method Head
```

On the lesson page, play the fixture video, turn on English or Amharic captions, try the sign-language and audio-description controls, and save the offline lesson. On the career page, check that the job cards and credential render. The sample lesson media is fixture content, not production course content.

## Preview limits

The included Blueprint uses Render's Free web service plan. Free services spin down after 15 minutes without traffic and take about a minute to start again. The app's `STORE=memory` data resets on restarts and redeploys, so this setup is for sharing a demonstration. Use a persistent database and a paid hosting plan before relying on it for real learner records or production availability.
