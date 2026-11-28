# Changelog

## Low/Normal graphics and memory optimization
- Added saved, default-Normal graphics quality dropdown.
- Low mode reduces world geometry, framebuffer resolution and draw frequency; expensive decorative weather overlays are omitted.
- Flight physics, missions, runway layouts and evening runway lights remain functional in Low mode.
- Switch quality in the pause menu without resetting flight; old GPU buffers are disposed and scene objects regenerated.
- Release CPU-side vertex arrays after WebGL upload to avoid retaining duplicate terrain geometry.
- Added regression checks for geometry counts, canvas resolution, saved mode and switching modes in a real browser.


## Landing School and Clear Flight View
- Hide the large mission progress bar when a flight is active; pause/menu access remains available.
- Add an optional collapsible five-step first-solo instructor for takeoff, climb to 80 metres, returning to a runway, heading/speed alignment and gentle touchdown.
- Dynamically calculate training speed targets from selected aircraft, heading and nearest airstrip. Display speed, altitude and vertical speed during the lesson.
- Add Node regression checks and Chromium UI assertions for mission bar removal and tutorial behavior.


## Flight Launch Repair
- Fixed a shader-link error introduced with the Day/Evening update: consistent `mediump float` precision for `uDusk` in both GLSL shaders.
- Added an on-screen startup failure message rather than a silent nonresponsive Start Flight button.
- Added Chromium/WebGL real-browser launch testing with a screenshot and console-error validation; separated the dependency-free Node smoke suite.
- Updated the game script cache version so existing iPhone browsers fetch the repaired code.


## Day and Evening Airfield Maps
- Added Day and Evening time-of-day selection to the Flight Academy settings.
- Evening includes warm sunset sky and distance haze, changed sunlight direction and intensity, a low sunset sun, and lit runway edges/thresholds on all four airstrips.
- All three airfield themes and weather settings remain selectable; the time setting persists in career exports and saved preferences, with old saves defaulting to Day.
- Added regression coverage for switching lighting, save/reset, and airfield/runway preservation.


## Flight Academy Update — 2026-11-26
- Added six missions: First Solo, Sky Rings, Reconnaissance, Formation, Engine Emergency and First Dogfight.
- Added ten 3D checkpoint rings, landmark goals, two friendly formation pilots and an AI opponent with practice fire.
- Added training scoring, medals, career ranks, best scores, local persistence, validated import/export and confirm-before-reset.
- Added Royal Aircraft Factory S.E.5a and Fokker D.VII as XP unlocks, alongside Sky Blue and Ace Gold paint schemes.
- Added arcade/balanced/simulation handling presets, fuel/hull telemetry, weather/wind and optional synthesized engine audio.
- Added joystick-based touch controls, rudder keyboard support, combat/fire and reconnaissance/photo buttons, HUD and radar.
- Added villages, bridge, railway, farms, clouds and three selectable WWI-inspired airfields.
- Added memory-safe GPU buffer cleanup and a context-loss message.
- Added GitHub Actions CI, Node regression tests, new docs and a refreshed main Flowbeacon Arcade entry.
- No multiplayer and no real historical aerodynamics. Real iPhone/desktop GPU visual QA is pending.

## Initial Release
- Seven WWI-inspired airplanes, procedural WebGL scene, grass runway, basic takeoff and landing and three camera options.
- Corrected invisible aircraft caused by an invalid 3D cross product and off-target chase camera.

## Mobile Touch Controls and Icon Update
- Replaced flight-control text buttons with SVG icons and preserved VoiceOver labels.
- Suppressed Safari callouts and text selection on flight controls without blocking ordinary form fields.
- Preserved icons across sound, brake and statistics toggles; added unit and Chromium regression coverage.
