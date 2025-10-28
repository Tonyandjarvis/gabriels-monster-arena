// Configuration loader utility for Gabriel's Monster Arena
class ConfigLoader {
    constructor() {
        this.configs = new Map();
        this.loadingPromises = new Map();
        this.defaultConfigs = this.getDefaultConfigs();
    }

    // Default configurations as fallback
    getDefaultConfigs() {
        return {
            monsters: {
                GEM: {
                    name: 'Crystal Guardian',
                    stats: {
                        health: 150,
                        damage: 25,
                        range: 120,
                        attackSpeed: 1.5,
                        cost: 50
                    },
                    color: '#9c27b0',
                    shape: 'diamond'
                },
                BLOB: {
                    name: 'Slime Defender',
                    stats: {
                        health: 200,
                        damage: 15,
                        range: 80,
                        attackSpeed: 2.0,
                        cost: 30
                    },
                    color: '#4caf50',
                    shape: 'circle'
                },
                ANIMAL: {
                    name: 'Beast Warrior',
                    stats: {
                        health: 100,
                        damage: 35,
                        range: 100,
                        attackSpeed: 1.0,
                        cost: 70
                    },
                    color: '#ff9800',
                    shape: 'triangle'
                }
            },
            enemies: {
                BASIC: {
                    name: 'Basic Enemy',
                    stats: {
                        health: 50,
                        damage: 10,
                        speed: 1.0,
                        reward: 10
                    },
                    color: '#ff6b6b',
                    shape: 'rectangle'
                },
                FAST: {
                    name: 'Fast Enemy',
                    stats: {
                        health: 30,
                        damage: 8,
                        speed: 2.0,
                        reward: 15
                    },
                    color: '#4ecdc4',
                    shape: 'circle'
                },
                TANK: {
                    name: 'Tank Enemy',
                    stats: {
                        health: 150,
                        damage: 15,
                        speed: 0.5,
                        reward: 25
                    },
                    color: '#45b7d1',
                    shape: 'rectangle'
                },
                FLYING: {
                    name: 'Flying Enemy',
                    stats: {
                        health: 40,
                        damage: 12,
                        speed: 1.5,
                        reward: 20
                    },
                    color: '#96ceb4',
                    shape: 'triangle'
                }
            },
            waves: [
                {
                    enemies: [
                        { type: 'BASIC', count: 5, spawnDelay: 1000 },
                        { type: 'FAST', count: 3, spawnDelay: 800 }
                    ],
                    reward: 100
                }
            ],
            gameSettings: {
                startingHealth: 100,
                startingCurrency: 200,
                startingWave: 1
            },
            performance: {
                targetFPS: 60,
                objectPooling: true
            }
        };
    }

    // Load a configuration file
    async loadConfig(configName) {
        if (this.configs.has(configName)) {
            return this.configs.get(configName);
        }

        if (this.loadingPromises.has(configName)) {
            return this.loadingPromises.get(configName);
        }

        const loadingPromise = this.loadConfigFile(configName);
        this.loadingPromises.set(configName, loadingPromise);

        try {
            const config = await loadingPromise;
            this.configs.set(configName, config);
            this.loadingPromises.delete(configName);
            return config;
        } catch (error) {
            this.loadingPromises.delete(configName);
            console.warn(`Failed to load config ${configName}, using defaults:`, error);
            return this.getDefaultConfig(configName);
        }
    }

    // Load configuration file from server
    async loadConfigFile(configName) {
        try {
            const response = await fetch(`config/${configName}.json`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const config = await response.json();
            return this.validateConfig(configName, config);
        } catch (error) {
            throw new Error(`Failed to load ${configName}.json: ${error.message}`);
        }
    }

    // Validate configuration data
    validateConfig(configName, config) {
        const validator = new ConfigValidator();
        const validationResult = validator.validate(configName, config);
        
        if (!validationResult.isValid) {
            console.warn(`Configuration validation failed for ${configName}:`, validationResult.errors);
            return this.getDefaultConfig(configName);
        }
        
        return config;
    }

    // Get default configuration for a specific config type
    getDefaultConfig(configName) {
        const defaultConfig = this.defaultConfigs[configName];
        if (!defaultConfig) {
            console.error(`No default configuration found for ${configName}`);
            return {};
        }
        return defaultConfig;
    }

    // Load all configurations
    async loadAllConfigs() {
        const configNames = ['monsters', 'enemies', 'waves', 'game-settings', 'performance'];
        const loadPromises = configNames.map(name => this.loadConfig(name));
        
        try {
            const configs = await Promise.all(loadPromises);
            const configMap = new Map();
            
            configNames.forEach((name, index) => {
                configMap.set(name, configs[index]);
            });
            
            return configMap;
        } catch (error) {
            console.error('Failed to load some configurations:', error);
            return this.getDefaultConfigs();
        }
    }

    // Get a specific configuration value
    getConfigValue(configName, path) {
        const config = this.configs.get(configName);
        if (!config) {
            return this.getDefaultConfigValue(configName, path);
        }
        
        return this.getNestedValue(config, path);
    }

    // Get default configuration value
    getDefaultConfigValue(configName, path) {
        const defaultConfig = this.getDefaultConfig(configName);
        return this.getNestedValue(defaultConfig, path);
    }

    // Get nested value from object using dot notation
    getNestedValue(obj, path) {
        if (!path) return obj;
        
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current === null || current === undefined || typeof current !== 'object') {
                return undefined;
            }
            current = current[key];
        }
        
        return current;
    }

    // Set a configuration value
    setConfigValue(configName, path, value) {
        if (!this.configs.has(configName)) {
            this.configs.set(configName, {});
        }
        
        const config = this.configs.get(configName);
        this.setNestedValue(config, path, value);
    }

    // Set nested value in object using dot notation
    setNestedValue(obj, path, value) {
        if (!path) return;
        
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
    }

    // Reload a configuration
    async reloadConfig(configName) {
        this.configs.delete(configName);
        return this.loadConfig(configName);
    }

    // Reload all configurations
    async reloadAllConfigs() {
        this.configs.clear();
        this.loadingPromises.clear();
        return this.loadAllConfigs();
    }

    // Check if configuration is loaded
    isConfigLoaded(configName) {
        return this.configs.has(configName);
    }

    // Get all loaded configurations
    getAllConfigs() {
        return new Map(this.configs);
    }

    // Clear all configurations
    clearConfigs() {
        this.configs.clear();
        this.loadingPromises.clear();
    }

    // Export configuration to JSON
    exportConfig(configName) {
        const config = this.configs.get(configName);
        if (!config) {
            throw new Error(`Configuration ${configName} not found`);
        }
        return JSON.stringify(config, null, 2);
    }

    // Import configuration from JSON
    importConfig(configName, jsonString) {
        try {
            const config = JSON.parse(jsonString);
            const validatedConfig = this.validateConfig(configName, config);
            this.configs.set(configName, validatedConfig);
            return validatedConfig;
        } catch (error) {
            throw new Error(`Failed to import configuration ${configName}: ${error.message}`);
        }
    }

    // Get configuration statistics
    getConfigStats() {
        return {
            loadedConfigs: this.configs.size,
            loadingPromises: this.loadingPromises.size,
            configNames: Array.from(this.configs.keys())
        };
    }
}

// Global configuration loader instance
window.configLoader = new ConfigLoader();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigLoader;
}





