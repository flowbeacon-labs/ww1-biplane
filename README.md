# Wings of 1918

A browser-based, original WebGL WWI flying game, hosted as a standalone game and listed in Flowbeacon Arcade.

- **Game:** https://flowbeacon-labs.github.io/ww1-biplane/
- **Arcade:** https://flowbeacon-labs.github.io/flowbeacon-arcade/

## Features

- 7 individually styled WWI-era airplanes: Sopwith Camel (United Kingdom), Fokker Dr.I and Albatros D.Va (Germany), SPAD S.XIII and Nieuport 17 (France), Ansaldo SVA.5 (Italy), Curtiss JN-4 Jenny (United States).
- Real-time WebGL 3D graphics with aircraft fuselage, stacked wings, bracing, wheels, spinning propeller, national insignia, cockpit and tail.
- Ground runway roll, throttle, wheel brake, lift-off, climb, turns, stall warning, descent, safe touchdown and hard-landing detection.
- Open grass airfield with hangars, trees, runway and stripes; chase, close and cockpit cameras.
- Desktop keyboard controls and iPhone/Android touch buttons.
- No user accounts, ads, third-party assets, login, saved user data or game server.

## Flying

1. Select your aircraft in the start panel and choose **Start Flight**.
2. Release the wheel brake with **Space** on desktop, or **BRAKE** on touch devices.
3. Hold **Up arrow** / **+ POWER** to increase throttle and accelerate along the runway.
4. At sufficient speed, hold **W** / **CLIMB** briefly to raise the nose and lift off.
5. Use **A/D** or BANK buttons to roll, **Q/E** to yaw, and **W/S** to climb or descend.
6. To land, reduce power gradually, level the wings, align with the runway, and descend gently. A fast or steep touchdown counts as a hard landing.
7. Press **C** / CAMERA to cycle chase, near chase and cockpit views. Press **R** to reset.

## Controls

| Action | Desktop | Touch |
| --- | --- | --- |
| Throttle | Up / Down arrows | + / − POWER |
| Pitch | W / S | CLIMB / DESCEND |
| Bank | A / D | BANK left / right |
| Rudder | Q / E | Desktop only for MVP |
| Wheel brake | Space | BRAKE |
| Camera | C | CAMERA |
| Restart | R | Resume from menu / reload |
| Pause | Escape | Browser/menu controls (desktop) |

## Architecture

Vanilla HTML/CSS/JavaScript. WebGL 1.0 with custom shaders and procedurally built triangle meshes. All production code is in `index.html`, `style.css`, and `game.js`; no JS framework or build process.

## Publishing

On GitHub, open **Settings → Pages**, choose **Deploy from a branch → main → /(root)**. The game will be available at the URL above once a Pages deployment succeeds. Flowbeacon Arcade links to the independent game URL.

## Verification and limitations

- JavaScript compilation check: passed.
- Simulated WebGL/DOM tests: selection of different aircraft, runway acceleration, successful takeoff, altitude gain, descent-ground collision and hard landing detection, plus a mock draw call.
- GPU-level realism and actual Safari/Chrome playtesting remain unverified; test the site on a real desktop and iPhone.
- Aircraft dimensions, emblems, paintwork and speed/handling are stylized, **not certified historical reconstructions or real flight dynamics**.
- The simulation does **not** include combat, enemy AI, missions, audio, wind, fuel or damage physics in this initial scope.
- The user interface and graphics are optimized for reasonably modern browsers supporting WebGL.

## Next enhancements

Detailed cockpit gauges, historical liveries and national markings, takeoff and landing training scoring, runway approach guidance, custom flight joystick, enhanced landscape and weather, engine audio, wind and crosswinds, better physics and camera handling, and flight missions.
