# Architecture — Wings of 1918

## Scope
Single-player browser-based WWI-inspired arcade flight adventure using WebGL 1.0 without a build chain.

## Data and runtime
```
HTML/CSS Controls --> Input state (keyboard / touch joystick)
                             |
                             v
              Physics and weather update (frame dt capped)
                             |
          +------------------+-----------------+
          |                  |                 |
     Mission engine      AI pilots        Career state
          |                  |                 |
          +------------------+-----------------+
                             |
                             v
                Mesh renderer / WebGL shaders
                Scene + planes + rings + AI
                             |
                             v
                       Canvas + HUD
```

### Modules (currently internal to game.js)
- Procedural mesh factory: boxes, triangular geometry, tubes, insignia and runway terrain.
- Shaders: simple directional lighting and distance fog. No downloaded textures or 3D models.
- Flight state: position, heading, pitch, roll, airspeed, vertical speed, throttle, brakes, hull and fuel.
- Camera: three options, smooth tracking, snap on reset/change. Previous invalid cross-product defect fixed.
- Mission engine: six fixed objective definitions, checkpoint navigation, completion, score and medal awards.
- AI: waypoint-following friendly aircraft and a deterministic training opponent.
- Career: localStorage snapshot with a versioned allowlisted schema and validated import.
- UI: selectable mission, country/aircraft, three difficulty options, three weather modes and airfield options.
- Optional audio: synthesized engine oscillator via Web Audio API, started by an explicit user gesture.

### Storage
- Key: `flowbeacon-wings-career-v1`.
- Schema: version, xp, flights, landings, medals, completed[missionId], best[missionId], settings.
- No cookies, ads, analytics, server calls, location services, or accounts.
- JSON export/import provides user-controlled backup. Reset requires browser confirmation.
- Imported files are size-limited, schema-checked and reduced to permitted keys.

### Rendering and performance
- Vertex positions, normals and colors are uploaded to three GPU buffers per mesh.
- Airfield meshes are swapped on selection; old GPU buffers are disposed.
- Aircraft change and color selection also dispose old meshes.
- Pixel ratio is capped at 1.6 for mobile performance. Frame timestep capped at 0.055 seconds.
- A WebGL context-loss handler displays an explicit error.
- CSS weather overlay respects reduced-motion preferences.

### Security and accessibility
- Static hosting only; no executable server logic or user credentials.
- Pilot import is JSON-only and validated to a known schema.
- Keyboard shortcuts and accessible buttons/labels are included.
- Audio is opt-in. Potential future improvements: focus management for menu, customizable joystick placement, colorblind-friendly objective icons.

### Known limitations and roadmap
1. Split the single large JS file into modules without introducing a mandatory build tool.
2. Add more faithful aircraft meshes and instrument panels.
3. Improve aerodynamics, stall recovery, wind and crosswind landings.
4. Offer rudder on touch, gamepad API and sensitivity adjustment.
5. Improve AI formation intelligence and dogfight practice (no multiplayer currently).
6. Add scored landing accuracy, richer milestones, local achievements view, plus optional independent creative challenges.
7. Add performance profiling and visual regression testing on real iPhone Safari and desktop GPUs.

## QA
- Automated: `npm test` (Node built-in test runner) and `node --check game.js`.
- CI: GitHub Actions workflow `.github/workflows/ci.yml`.
- Manual: verify game boots, plane visible, all airfield selections, each camera mode, touch controls, safe and hard landing, missions, audio permission, export/import and mobile performance.
- Mocked GPU tests cannot prove actual iOS WebGL rendering correctness.
