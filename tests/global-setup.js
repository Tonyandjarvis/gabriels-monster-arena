// Global setup file to load all game scripts in the correct order
// This runs before all tests to make classes available globally

const fs = require('fs');
const path = require('path');

// Create a virtual DOM environment
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:8000',
  pretendToBeVisual: true,
  resources: 'usable'
});

// Set up global environment
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// List of scripts in the order they should be loaded (same as index.html)
const scriptOrder = [
  'js/utils/ObjectPool.js',
  'js/engine/Entity.js',
  'js/engine/Component.js',
  'js/engine/System.js',
  'js/components/PositionComponent.js',
  'js/components/SpriteRenderer.js',
  'js/components/MonsterComponent.js',
  'js/components/EnemyComponent.js',
  'js/components/ProjectileComponent.js',
  'js/systems/PlacementSystem.js',
  'js/systems/CombatSystem.js',
  'js/systems/PathfindingSystem.js',
  'js/systems/WaveSystem.js',
  'js/systems/RenderSystem.js',
  'js/systems/UISystem.js',
  'js/systems/AudioSystem.js',
  'js/systems/ParticleSystem.js',
  'js/systems/TutorialSystem.js',
  'js/utils/PerformanceMonitor.js',
  'js/utils/SaveSystem.js',
  'js/GameEngine.js'
];

// Load each script file
scriptOrder.forEach(scriptPath => {
  const fullPath = path.join(__dirname, '..', scriptPath);
  if (fs.existsSync(fullPath)) {
    const scriptContent = fs.readFileSync(fullPath, 'utf8');
    // Execute the script in the global context
    try {
      eval(scriptContent);
    } catch (error) {
      console.error(`Error loading script ${scriptPath}:`, error.message);
    }
  } else {
    console.warn(`Script not found: ${fullPath}`);
  }
});

console.log('All game scripts loaded successfully');
