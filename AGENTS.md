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

## Shared Flowbeacon Arcade mobile release policy — mandatory

**Canonical project standard:** https://github.com/flowbeacon-labs/flowbeacon-arcade/blob/main/docs/GAME_QUALITY_STANDARD.md

Before adding or changing controls, UI, game mechanics or graphics, **read that standard and treat it as a release gate**, not a suggestion. The main arcade's AGENTS.md is not inherited across repositories.

### Regression risks to prevent every release

1. **iPhone Safari long press:** Joystick, throttle +/- hold controls, bank controls, BRAKE, FIRE, PHOTO, camera, sound, pause, plane selection, statistics and tutorial toggles must not trigger context menus, text selection, callouts, link previews, page scroll or stuck inputs. Scope `-webkit-touch-callout:none`, `-webkit-user-select:none`, `user-select:none` and suitable `touch-action` to game controls only; use pointer events with scoped `contextmenu`/`selectstart` prevention. Do not suppress native input/select/link interactions globally.
2. **Input cancellation:** Clear touch/keyboard states on pointerup, pointercancel, lostpointercapture, window blur and visibility change. Verify joystick + throttle simultaneously, long press >1.5 seconds, and orientation changes.
3. **Safe UI:** On desktop and iPhone sizes 375/590/768/1280px, ensure no overlap of stats, coaching, mission panel, action buttons and controls. Respect safe-area insets. Preserve hideable HUD and back-to-plane-selection.
4. **Icon integrity/accessibility:** Every icon-only button has an accessible name and finger-friendly hit target. Changing status must not replace/delete SVG artwork; change state attributes and labels instead.
5. **WebGL launch:** Run actual browser startup after shader, matrix, camera or lighting modifications. Check shader compilation/linking, finite camera matrices, visible aircraft/strip, pause/resume/restart and browser-console errors. The past `uDusk` uniform precision bug made Start Flight inert despite mock tests.
6. **Regression coverage:** Add a test reproducing any reported defect. Run `node --check game.js && npm test` and the Chromium browser launch workflow. Do not call mock-WebGL test results iPhone proof.
7. **iPhone QA:** Physical iPhone Safari long-press and gesture verification must be reported as **not tested** if there is no device test. Confirm the *actual GitHub Pages deployment* before claiming the update is live.

Preserve all aircraft, mission, career and save behavior described above. Do not replace working gameplay to accommodate a UI fix.
