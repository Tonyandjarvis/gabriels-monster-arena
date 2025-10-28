# Production Ready Game Audit Prompt

## Context
You are auditing "Gabriel's Monster Arena" - a tower defense game built with JavaScript/HTML5 Canvas using an Entity-Component-System (ECS) architecture. The game is deployed on AWS EC2 and has several critical functionality issues preventing it from being production-ready.

## Current Status
- **Deployment**: Game is deployed on AWS EC2 at http://3.236.254.32/
- **Architecture**: ECS with GameEngine managing multiple systems
- **Recent Fixes**: CombatSystem targeting, projectile collision, placement path sync
- **Critical Issues**: Game is not fully functional despite recent fixes

## Required Analysis

### 1. SYSTEM INTEGRATION AUDIT
**Objective**: Verify all systems work together correctly

**Tasks**:
- [ ] Map the complete data flow between all systems (GameEngine, CombatSystem, PlacementSystem, WaveSystem, PathfindingSystem, UISystem, RenderSystem, AudioSystem, ParticleSystem, TutorialSystem)
- [ ] Identify any circular dependencies or missing connections
- [ ] Verify entity synchronization between systems
- [ ] Check if all systems receive proper dependencies via `setDependencies()`
- [ ] Validate that events flow correctly through the event system

**Key Questions**:
- Are enemies properly registered in all relevant systems when spawned?
- Do monsters get added to CombatSystem when placed?
- Are combat events properly processed and handled?
- Is the entity lifecycle (create, update, destroy) consistent across systems?

### 2. CORE GAMEPLAY FUNCTIONALITY AUDIT
**Objective**: Ensure all core game mechanics work correctly

**Tasks**:
- [ ] **Monster Placement**: Test placement in multiple valid locations
  - Verify PlacementSystem path checking works with PathfindingSystem
  - Check if placement validation is too restrictive
  - Ensure monsters are added to GameEngine entities
- [ ] **Combat System**: Verify complete combat flow
  - Monster targeting and range calculation
  - Projectile creation and movement
  - Collision detection and damage application
  - Enemy death handling and cleanup
- [ ] **Wave System**: Test enemy spawning and management
  - Enemy spawning at correct intervals
  - Enemy movement along path
  - Enemy reaching end and damaging player
- [ ] **UI System**: Verify all UI interactions
  - Monster selection and placement mode
  - Currency management (spending, earning)
  - Health display and damage
  - Button interactions and feedback

### 3. DATA FLOW VERIFICATION
**Objective**: Trace data through the entire game loop

**Critical Data Flows to Verify**:
- [ ] **Enemy Spawn → Movement → Combat → Death → Rewards**
- [ ] **Monster Placement → Targeting → Attack → Projectile → Damage**
- [ ] **UI Click → Monster Selection → Placement → Entity Creation**
- [ ] **Combat Events → Event Processing → UI Updates**

**Debug Points**:
- Add console.log statements at each critical junction
- Verify entity IDs are consistent across systems
- Check component data integrity
- Validate event payloads

### 4. CONFIGURATION AND DATA AUDIT
**Objective**: Ensure all game data is properly loaded and used

**Tasks**:
- [ ] Verify monster types and stats are loaded correctly
- [ ] Check enemy types and configurations
- [ ] Validate wave configurations
- [ ] Ensure performance settings are applied
- [ ] Check if config files are properly loaded by ConfigLoader

### 5. ERROR HANDLING AND EDGE CASES
**Objective**: Identify and fix edge cases that break gameplay

**Common Edge Cases**:
- [ ] What happens when enemies spawn faster than they can be processed?
- [ ] How does the game handle rapid clicking during placement?
- [ ] What occurs when projectiles target dead enemies?
- [ ] How are entities cleaned up when systems are disabled?
- [ ] What happens if the game loop runs too fast/slow?

### 6. PERFORMANCE AND STABILITY AUDIT
**Objective**: Ensure game runs smoothly and doesn't crash

**Tasks**:
- [ ] Check for memory leaks in entity pools
- [ ] Verify deltaTime handling prevents spiral of death
- [ ] Test with multiple waves and many entities
- [ ] Check console for error accumulation
- [ ] Validate system update order and timing

## Specific Issues to Investigate

### Issue 1: Monster Placement
**Symptoms**: Only one spot works for placement
**Investigation**:
- Check PlacementSystem.isValidPlacement() logic
- Verify path data is correctly passed from PathfindingSystem
- Test placement validation with different grid positions
- Check if PlacementSystem.grid is properly managed

### Issue 2: Enemy Damage
**Symptoms**: Enemies don't take damage from projectiles
**Investigation**:
- Verify projectile collision detection in CombatSystem.updateProjectiles()
- Check if hitTarget() method is called correctly
- Verify EnemyComponent.takeDamage() works
- Check if damage events are processed by GameEngine

### Issue 3: Combat Events
**Symptoms**: Currency not awarded, health not decreased
**Investigation**:
- Trace combat events from creation to processing
- Verify GameEngine.processCombatEvents() calls correct handlers
- Check if UISystem methods are called for currency/health updates
- Verify event listeners are properly registered

## Testing Protocol

### Phase 1: System Integration Tests
1. Create a minimal test that spawns one enemy and one monster
2. Verify the monster targets and attacks the enemy
3. Check if the enemy takes damage and dies
4. Verify currency is awarded and health decreases when enemy reaches end

### Phase 2: Full Gameplay Tests
1. Place multiple monsters in different locations
2. Start a wave and verify all combat mechanics work
3. Test multiple waves to ensure stability
4. Verify UI updates correctly throughout gameplay

### Phase 3: Edge Case Tests
1. Rapid clicking during placement
2. Multiple enemies reaching end simultaneously
3. Projectiles targeting enemies that die mid-flight
4. System errors and recovery

## Deliverables

### 1. Comprehensive Issue Report
- List all identified issues with severity levels
- Provide specific code locations and root causes
- Include reproduction steps for each issue

### 2. Fix Implementation Plan
- Prioritized list of fixes needed
- Detailed implementation steps for each fix
- Testing requirements for each fix

### 3. Production Readiness Checklist
- Complete functionality verification
- Performance benchmarks
- Error handling validation
- User experience confirmation

## Success Criteria

The game is production-ready when:
- [ ] Monsters can be placed in multiple valid locations
- [ ] Enemies take damage and die when hit by projectiles
- [ ] Currency is properly awarded for enemy deaths
- [ ] Health decreases when enemies reach the house
- [ ] All UI interactions work correctly
- [ ] Game runs smoothly without errors
- [ ] Multiple waves can be completed successfully

## Files to Focus On

**Core Systems**:
- `js/GameEngine.js` - Main game loop and system coordination
- `js/systems/CombatSystem.js` - Combat mechanics and projectile handling
- `js/systems/PlacementSystem.js` - Monster placement validation
- `js/systems/WaveSystem.js` - Enemy spawning and management
- `js/systems/UISystem.js` - User interface and game state

**Components**:
- `js/components/MonsterComponent.js` - Monster stats and behavior
- `js/components/EnemyComponent.js` - Enemy stats and damage handling
- `js/components/ProjectileComponent.js` - Projectile mechanics

**Configuration**:
- `config/monsters.json` - Monster types and stats
- `config/enemies.json` - Enemy types and stats
- `config/waves.json` - Wave configurations

## Instructions

1. **Start with System Integration Audit** - This is the foundation
2. **Create a test plan** - Build systematic tests for each system
3. **Implement fixes incrementally** - Fix one issue at a time
4. **Test thoroughly** - Verify each fix works before moving to next
5. **Document everything** - Keep detailed logs of issues and fixes

## Expected Outcome

A fully functional tower defense game where:
- Players can place monsters strategically
- Monsters attack enemies with projectiles
- Enemies take damage and die
- Players earn currency and lose health appropriately
- The game provides smooth, error-free gameplay

This audit should result in a production-ready game that provides a complete and enjoyable tower defense experience.

