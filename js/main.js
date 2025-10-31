// Gabriel's Monster Arena - Main Game File
// This file initializes and starts the game

let gameEngine = null;
let loadingProgress = 0;
let loadingComplete = false;

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Gabriel\'s Monster Arena - Starting initialization...');
    
    // Show loading screen
    showLoadingScreen();
    
    // Start loading process
    startLoading();
});

function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const startButton = document.getElementById('startButton');
    
    if (loadingScreen && startButton) {
        startButton.addEventListener('click', startGame);
    }
}

function startLoading() {
    const loadingBar = document.getElementById('loadingProgress');
    const loadingText = document.querySelector('#loadingScreen p');
    
    // Simulate loading progress
    const loadingSteps = [
        { progress: 20, text: 'Loading game engine...' },
        { progress: 40, text: 'Initializing systems...' },
        { progress: 60, text: 'Setting up graphics...' },
        { progress: 80, text: 'Preparing monsters...' },
        { progress: 100, text: 'Ready to play!' }
    ];
    
    let currentStep = 0;
    
    function updateLoading() {
        if (currentStep < loadingSteps.length) {
            const step = loadingSteps[currentStep];
            loadingProgress = step.progress;
            
            if (loadingBar) {
                loadingBar.style.width = loadingProgress + '%';
            }
            
            if (loadingText) {
                loadingText.textContent = step.text;
            }
            
            currentStep++;
            setTimeout(updateLoading, 500);
        } else {
            loadingComplete = true;
            showStartButton();
        }
    }
    
    updateLoading();
}

function showStartButton() {
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.style.display = 'block';
        startButton.textContent = 'Start Game';
    }
}

function startGame() {
    try {
        console.log('Starting Gabriel\'s Monster Arena...');
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
        
        // Initialize configuration system
        if (window.configLoader) {
            console.log('Loading game configurations...');
            window.configLoader.loadAllConfigs().then(() => {
                console.log('Configurations loaded successfully');

                // Reload component configurations after loading
                if (typeof MonsterComponent !== 'undefined' && MonsterComponent.loadTypesFromConfig) {
                    MonsterComponent.loadTypesFromConfig();
                }
                if (typeof EnemyComponent !== 'undefined' && EnemyComponent.loadTypesFromConfig) {
                    EnemyComponent.loadTypesFromConfig();
                }

                initializeGame();
            }).catch(error => {
                console.warn('Failed to load configurations, using defaults:', error);

                // Still try to reload component configurations even on failure
                if (typeof MonsterComponent !== 'undefined' && MonsterComponent.loadTypesFromConfig) {
                    MonsterComponent.loadTypesFromConfig();
                }
                if (typeof EnemyComponent !== 'undefined' && EnemyComponent.loadTypesFromConfig) {
                    EnemyComponent.loadTypesFromConfig();
                }

                initializeGame();
            });
        } else {
            console.warn('ConfigLoader not available, using defaults');

            // Try to reload component configurations
            if (typeof MonsterComponent !== 'undefined' && MonsterComponent.loadTypesFromConfig) {
                MonsterComponent.loadTypesFromConfig();
            }
            if (typeof EnemyComponent !== 'undefined' && EnemyComponent.loadTypesFromConfig) {
                EnemyComponent.loadTypesFromConfig();
            }

            initializeGame();
        }
        
    } catch (error) {
        console.error('Failed to start game:', error);
        showError('Failed to start game. Please refresh the page and try again.');
    }
}

function initializeGame() {
    try {
        // Initialize game engine
        gameEngine = new GameEngine();
        gameEngine.initialize();
        
        // After gameEngine initialization
        if (new URLSearchParams(window.location.search).has('debug')) {
          const DebugOverlay = require('./utils/DebugOverlay.js');
          window.debugOverlay = new DebugOverlay();
        }
        
        // Start the game
        gameEngine.start();

        // Hide loading screen to prevent click blocking
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
            loadingScreen.style.pointerEvents = 'none';
            loadingScreen.style.zIndex = '-1';
            console.log('Loading screen hidden and disabled');
        }

        console.log('Game started successfully!');

        // Show game instructions
        showGameInstructions();
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
        showError('Failed to initialize game. Please refresh the page and try again.');
    }
}

function showGameInstructions() {
    // Create instructions overlay
    const instructions = document.createElement('div');
    instructions.id = 'instructions';
    instructions.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        font-family: Arial, sans-serif;
    `;
    
    instructions.innerHTML = `
        <h2>🎮 Gabriel's Monster Arena</h2>
        <div style="max-width: 600px; text-align: center; margin: 20px;">
            <h3>How to Play:</h3>
            <p>1. Select a monster type from the bottom panel</p>
            <p>2. Click on the grid to place monsters</p>
            <p>3. Monsters will automatically attack enemies</p>
            <p>4. Defend against waves of enemies</p>
            <p>5. Earn currency to buy more monsters</p>
            <br>
            <p><strong>Monster Types:</strong></p>
            <p>🔮 Crystal Guardian - High damage, medium range</p>
            <p>🟢 Slime Defender - High health, low damage</p>
            <p>🦁 Beast Warrior - Very high damage, low health</p>
        </div>
        <button id="closeInstructions" style="
            padding: 15px 30px;
            font-size: 18px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            margin-top: 20px;
        ">Start Playing!</button>
    `;
    
    document.body.appendChild(instructions);
    
    // Close instructions when button is clicked
    document.getElementById('closeInstructions').addEventListener('click', function() {
        instructions.remove();
    });
    
    // Close instructions after 10 seconds
    setTimeout(() => {
        if (instructions.parentNode) {
            instructions.remove();
        }
    }, 10000);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #f44336;
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-family: Arial, sans-serif;
        z-index: 1000;
        max-width: 400px;
        text-align: center;
    `;
    
    errorDiv.innerHTML = `
        <h3>Error</h3>
        <p>${message}</p>
        <button onclick="location.reload()" style="
            padding: 10px 20px;
            background: white;
            color: #f44336;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 10px;
        ">Reload Page</button>
    `;
    
    document.body.appendChild(errorDiv);
}

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (gameEngine) {
        if (document.hidden) {
            gameEngine.pauseGame();
        } else {
            gameEngine.resumeGame();
        }
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    if (gameEngine) {
        gameEngine.updateCanvasSize();
    }
});

// Handle page unload
window.addEventListener('beforeunload', function() {
    if (gameEngine) {
        gameEngine.destroy();
    }
});

// Add some helpful console commands for debugging
window.gameDebug = {
    getGameEngine: () => gameEngine,
    getGameStats: () => gameEngine ? gameEngine.uiSystem.getGameStats() : null,
    addCurrency: (amount) => {
        if (gameEngine) {
            gameEngine.uiSystem.addCurrency(amount);
        }
    },
    setHealth: (health) => {
        if (gameEngine) {
            gameEngine.uiSystem.updateGameStats({ health });
        }
    },
    startWave: () => {
        if (gameEngine) {
            gameEngine.startWave();
        }
    },
    toggleFPS: () => {
        if (gameEngine) {
            gameEngine.settings.showFPS = !gameEngine.settings.showFPS;
            gameEngine.saveSystem.saveSettings(gameEngine.settings);
        }
    }
};

console.log('Gabriel\'s Monster Arena loaded successfully!');
console.log('Use gameDebug in the console for debugging commands.');
console.log('Available commands: getGameEngine(), getGameStats(), addCurrency(amount), setHealth(health), startWave(), toggleFPS()');
