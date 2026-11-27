# Changelog

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
