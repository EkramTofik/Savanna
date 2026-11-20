# Screen-recording backup

No screen recording is present in this repository. Record the reviewed hosted demonstration before pitch day and keep the file in the team’s approved storage; do not commit learner or account data.

## Capture the live demonstration

1. Install OBS Studio on the recording computer and select **Display Capture** for the browser display. Capture system audio and microphone narration as separate sources if the machine supports it.
2. Set the canvas/output to 1920×1080 (or the actual display resolution), 30 fps, and MKV recording. Use a readable browser zoom and close notifications and unrelated tabs.
3. Open the actual hosted Savanna page, verify the displayed origin, then follow `docs/PITCH-DEMO.md`. Do not show credentials in the recording. If using a real credential, use a designated demo identity and revoke/delete it after the pitch.
4. Stop OBS and check the file plays from beginning to end with legible captions and audible narration. Remux MKV to MP4 with OBS **File → Remux Recordings** if the team’s playback system needs MP4. Keep the unedited original.

## Offline fallback

Before disconnecting, open the hosted lesson page, let the service worker take control, and download L-102 or L-103. Then use browser developer tools’ **Network → Offline** mode and reload the same course URL. Confirm the saved video plays, captions switch, and the transcript is available. Reconnect and clear the offline pack only after the test.

Automated offline regression command from the repository root after dependencies are installed:

```powershell
corepack pnpm --filter @savanna/sandbox-player test
```

The Playwright test named “A verified lesson opens and plays with captions after the browser goes offline” simulates the browser going offline after pack download. It does not physically disable the computer’s network adapter or validate a deployed host. The result must be checked on the actual hosted page before treating the recording as a production backup.
