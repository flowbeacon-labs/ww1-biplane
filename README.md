# Wings of 1918 — Flight Academy

A browser-based World War I aviation adventure built with native WebGL 1.0, HTML, CSS, and JavaScript. Part of **Flowbeacon Arcade**.

**Play:** https://flowbeacon-labs.github.io/ww1-biplane/  
**Arcade:** https://flowbeacon-labs.github.io/flowbeacon-arcade/

## Gameplay

A fully playable training-to-combat career with six missions:

| Mission | Objective | Outcome |
|---|---|---|
| First Solo Flight | Take off, reach 80 m, safely land | Training medal |
| Sky Ring Challenge | Navigate ten aerial checkpoint rings, return to base | Route score |
| Reconnaissance Patrol | Photograph village, river and railway, then land | Scout medal |
| Formation Flying | Stay near two friendly aircraft through five waypoints | Formation medal |
| Engine Emergency | Reach 75 m, lose engine power, glide and land | Landing award |
| First Dogfight | Track and disable a moving AI opponent, return safely | Fighter medal |

Successful missions grant XP, medals and best scores. Pilot ranks increase with XP. Two additional aircraft and two paint schemes can be unlocked.

### Aircraft selection

The original seven aircraft stay available. **Royal Aircraft Factory S.E.5a** unlocks at 600 XP and **Fokker D.VII** at 1,100 XP.

All nine airplanes are stylized, procedurally modeled, with multi-level wings, struts, spoked-style shape cues, national markings, propellers, and simplified handling. Their appearance is historically inspired rather than an exact museum-quality reconstruction.

### Environments

Select among three *WWI-inspired*, not geographically exact, settings:

- Flanders Grass Strip
- Picardy Farm Airfield, with patchwork fields
- Italian Valley Base, with distant angular mountains

The flight map now includes **four usable airstrips**: the original Home Airfield, Western Meadow Strip, Eastern Patrol Strip, and Northern Farm Strip. Each has a marked runway; satellite strips also have small hangars and windsocks. The on-screen **NEAREST** navigation cue displays the closest strip and distance in simulated metres. A gentle landing at any marked strip can complete landing objectives and earn career credit. A soft landing in open grass remains possible but does not count as a mission runway landing. The flight map also contains a village, river and bridge, railroad, station, hangars, farms, trees, and low-poly clouds. The checkpoint ring course stays at least 95 metres laterally clear of the runway centerline. Choose Clear, Breezy, or Stormy weather. Wind affects the aircraft, while storms provide darker skies and an optional visual rain effect.

## Controls

| Action | Keyboard | iPhone / touch |
|---|---|---|
| Throttle | ↑ / ↓ | + / − POWER |
| Pitch | W / S | Virtual joystick, up/down |
| Bank | A / D | Virtual joystick, left/right |
| Rudder | Q / E | Keyboard only in this version |
| Wheel brake | Space | BRAKE |
| Camera | C | CAMERA |
| Fire during dogfight | F | FIRE |
| Photo during reconnaissance | P | PHOTO |
| Pause / missions | Esc / M | PAUSE / MISSIONS |
| Restart | R | Start Flight after pause/menu |

**Clear view:** Detailed instrument statistics and radar are hidden by default to avoid covering the sky, especially on iPhone. Tap **STATS** in the flight header to reveal them and **HIDE STATS** to collapse them.

**Takeoff:** Release BRAKE, build speed with throttle, then pull up gently.  
**Landing:** Align with the runway, lower power gradually, level the wings and settle at low vertical speed.

Choose **Arcade**, **Balanced**, or **Simulation** handling. Arcade offers stronger stabilization, reduced stall sensitivity, and more forgiving landings. These are accessible game difficulties, not real-flight-training physics.

### Pilot save files

The game saves XP, medals, missions, best scores, settings and livery choice in browser localStorage. No account, backend, ads, or tracking are required.

- **EXPORT SAVE** downloads your pilot information as a JSON file.
- **IMPORT SAVE** restores a validated, small JSON pilot file.
- **RESET CAREER** requires explicit browser confirmation and clears only the game's saved progress on this device.
- The game does not upload or synchronize saved progress across devices.

## Technical architecture

- `index.html`: game, mission and career UI
- `style.css`: desktop/mobile styling, mobile joystick, weather effects
- `game.js`: WebGL scene generation, flight physics, mission/career loop, AI aircraft, input, sound and persistence
- `tests/smoke.test.cjs`: dependency-free, Node.js built-in test runner with mocked DOM and WebGL
- `.github/workflows/ci.yml`: syntax check and smoke tests on push and pull request
- `docs/USER_GUIDE.md`: walkthrough and troubleshooting
- `docs/ARCHITECTURE.md`: implementation design and limitations
- `AGENTS.md`: handoff notes for Codex and other coding agents

No third-party JavaScript libraries, external 3D assets, or API keys are needed for the game.

## Developing and testing locally

Install Node.js 18+ for testing (not needed to play):

```bash
npm test
node --check game.js
```

For local play, serve the repository root with a local HTTP server, e.g.:

```bash
python -m http.server 8000
```

Then open http://localhost:8000 in a browser supporting WebGL. For phone access on the same network, use an appropriate private server address and local-network permission.

## Publishing

Enable GitHub Pages using **Settings → Pages → Deploy from a branch → main → /(root)**. The arcade links to this repository's published site.

## Testing status and limitations

The syntax and mocked-browser regression suite are run by GitHub Actions. The suite covers aircraft availability, initialization, WebGL rendering calls, takeoff, mission progress, career persistence, career reset confirmation, AI and camera matrices.

**Important limitations:** Tests using a simulated graphics context are not full visual browser tests. Real iPhone Safari and desktop GPU rendering, touch comfort, audio playback, long-session performance and historical authenticity need device QA. Mission logic and AI are simplified: no multiplayer, real ballistics, historically accurate instruments, real geography, or certified aircraft physics. Aircraft damage is represented by a hull score and practice fire, not structural damage modeling.

See the troubleshooting guide and backlog for further improvements.
