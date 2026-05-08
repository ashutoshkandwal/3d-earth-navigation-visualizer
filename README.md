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
