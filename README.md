# 3D Earth Navigation Visualizer

The primary application in this repository is the web simulator in `web-simulator/`.

The old Tkinter prototype has been preserved in `legacy-python/` for reference, but it is no longer the main app.

## Run the simulator

Install the web app dependencies once:

```bash
npm install --prefix web-simulator
```

Start the simulator from the repository root:

```bash
npm run dev
```

## What lives where

- `web-simulator/`: React + Vite 3D Earth simulator
- `legacy-python/main.py`: archived Python desktop prototype

## Notes

- The root `package.json` only forwards npm scripts into `web-simulator/`.
- The root `.gitignore` keeps common Node and Python cache files out of version control.

## Deployment Notes

- Source code is version-controlled in GitHub.
- The `web-simulator/` app is the React + Three.js visualizer that will be deployed first.
- Initial hosting is planned through Vercel for a public or simple demo-style launch.
- The main website can act as the front door, either by linking to the app or by using a subdomain such as `visualizer.ourdomain.com`.
- Full authentication is intentionally deferred for Phase 1.
- Future client deployments should keep GitHub and Vercel under our control, with client access handled through a subdomain and DNS setup rather than shared hosting credentials.
