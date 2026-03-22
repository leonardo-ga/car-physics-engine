# Car Physics Engine

A small Three.js playground for experimenting with car movement, steering, weight transfer, and debug telemetry in the browser.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

- `npm run dev` starts the local Vite server.
- `npm run build` creates the production build in `docs/`.
- `npm run preview` serves the production build locally.

## Controls

- `W` / `ArrowUp`: accelerate
- `S` / `ArrowDown`: reverse or brake depending on current direction
- `A` / `ArrowLeft`: steer left
- `D` / `ArrowRight`: steer right
- `Space` / `Ctrl`: brake

## Debug Mode

Open the app with `#debug` in the URL to enable the debug GUI and the on-screen stats panel.

Example:

```text
http://localhost:5173/#debug
```

## Project Layout

- `src/js/models/Car.js`: car mesh setup and steering animation
- `src/js/physics/CarPhysics.js`: longitudinal and lateral vehicle physics
- `src/js/scene/`: camera and renderer setup
- `src/js/utils/`: shared runtime helpers such as timing, inputs, and debug tools

## Notes

- The production build targets `docs/` so the repo can be deployed as a static site if needed.
- Deprecated prototype physics files were removed from the active source tree to keep the project focused on the current implementation.
