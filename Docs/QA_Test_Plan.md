# QA Test Plan

## Running Tests
- Unit: `npm run test:unit`
- E2E: `npm run test:e2e`
- All: `npm run test:all` or `./run-tests.sh` (exits 1 on failure for CI)

## Manual Debug
- Add ?debug=1 to URL for overlay.
- Run window.gameEngine.combatSystem.testCombat() in console.

## Smoke Test
- curl -f http://localhost:3000/ || echo "Smoke test failed"
