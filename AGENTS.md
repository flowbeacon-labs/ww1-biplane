# AGENTS.md — Codex Handoff

Repository: `flowbeacon-labs/ww1-biplane`. Production: GitHub Pages, static hosting. Main arcade: `flowbeacon-labs/flowbeacon-arcade`.

## Development constraints
- Preserve existing WebGL 1.0 support, no asset CDN, no heavyweight library or paid dependency.
- Keep the game playable on iPhone Safari, Windows browsers, keyboard and touch.
- Preserve all nine aircraft, six missions, career data, weather, airfields, save import/export and camera visibility.
- Do not reintroduce the cross-product camera bug: a cross product MUST return three numerical components.
- Do not change localStorage schema without a documented migration.
- Avoid creating new GPU buffers on every frame; dispose replaced meshes.
- Follow accessibility, reduced-motion, user gesture audio and offline-first principles.
- Tests must be run, and untested areas declared honestly.

## Primary workflow
1. Inspect README, docs/ARCHITECTURE.md, game.js and tests/smoke.test.cjs.
2. Make small reversible edits; update tests and documentation with functionality.
3. Execute `node --check game.js && npm test`.
4. Test actual desktop/iPhone browsers when available, especially model visibility, touch input and frame rate.
5. Keep arcade listing in sync with major game changes.

## Known high-risk areas
- Matrices and coordinate conventions in the camera/projection pipeline.
- Touch pointer capture cancellation and focus loss.
- Mission completion and landing edge cases.
- Device storage quotas, backup compatibility and save reset.
- Resource disposal on airfield and livery changes.
- Safari Web Audio / WebGL support.

## Definition of done
All previous functionality remains; added feature has relevant test; expected user path documented; no false claims of actual iPhone QA; deployment status verified.
