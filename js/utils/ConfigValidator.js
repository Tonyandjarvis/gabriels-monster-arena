// Configuration validator utility for Gabriel's Monster Arena
class ConfigValidator {
    constructor() {
        this.schemas = this.getValidationSchemas();
    }

    // Get validation schemas for different configuration types
    getValidationSchemas() {
        return {
            monsters: {
                type: 'object',
                required: ['monsters'],
                properties: {
                    monsters: {
                        type: 'object',
                        required: ['GEM', 'BLOB', 'ANIMAL'],
                        properties: {
                            GEM: {
                                type: 'object',
                                required: ['name', 'stats', 'visual', 'abilities'],
                                properties: {
                                    name: { type: 'string', minLength: 1 },
                                    description: { type: 'string' },
                                    stats: {
                                        type: 'object',
                                        required: ['health', 'damage', 'range', 'attackSpeed', 'cost'],
                                        properties: {
                                            health: { type: 'number', minimum: 1 },
                                            damage: { type: 'number', minimum: 1 },
                                            range: { type: 'number', minimum: 1 },
                                            attackSpeed: { type: 'number', minimum: 0.1 },
                                            cost: { type: 'number', minimum: 1 }
                                        }
                                    },
                                    visual: {
                                        type: 'object',
                                        required: ['color', 'shape'],
                                        properties: {
                                            color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
                                            shape: { type: 'string', enum: ['diamond', 'circle', 'triangle', 'rectangle'] }
                                        }
                                    },
                                    abilities: {
                                        type: 'object',
                                        required: ['type'],
                                        properties: {
                                            type: { type: 'string', enum: ['ranged', 'melee'] }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            enemies: {
                type: 'object',
                required: ['enemies'],
                properties: {
                    enemies: {
                        type: 'object',
                        required: ['BASIC', 'FAST', 'TANK', 'FLYING'],
                        properties: {
                            BASIC: {
                                type: 'object',
                                required: ['name', 'stats', 'visual', 'behavior'],
                                properties: {
                                    name: { type: 'string', minLength: 1 },
                                    description: { type: 'string' },
                                    stats: {
                                        type: 'object',
                                        required: ['health', 'damage', 'speed', 'reward'],
                                        properties: {
                                            health: { type: 'number', minimum: 1 },
                                            damage: { type: 'number', minimum: 1 },
                                            speed: { type: 'number', minimum: 0.1 },
                                            reward: { type: 'number', minimum: 1 }
                                        }
                                    },
                                    visual: {
                                        type: 'object',
                                        required: ['color', 'shape'],
                                        properties: {
                                            color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
                                            shape: { type: 'string', enum: ['diamond', 'circle', 'triangle', 'rectangle'] }
                                        }
                                    },
                                    behavior: {
                                        type: 'object',
                                        required: ['type'],
                                        properties: {
                                            type: { type: 'string', enum: ['ground', 'flying'] }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            waves: {
                type: 'object',
                required: ['waves'],
                properties: {
                    waves: {
                        type: 'array',
                        minItems: 1,
                        items: {
                            type: 'object',
                            required: ['id', 'name', 'enemies', 'reward'],
                            properties: {
                                id: { type: 'number', minimum: 1 },
                                name: { type: 'string', minLength: 1 },
                                description: { type: 'string' },
                                enemies: {
                                    type: 'array',
                                    minItems: 1,
                                    items: {
                                        type: 'object',
                                        required: ['type', 'count'],
                                        properties: {
                                            type: { type: 'string', enum: ['BASIC', 'FAST', 'TANK', 'FLYING'] },
                                            count: { type: 'number', minimum: 1 },
                                            spawnDelay: { type: 'number', minimum: 0 },
                                            spawnInterval: { type: 'number', minimum: 100 }
                                        }
                                    }
                                },
                                reward: { type: 'number', minimum: 1 }
                            }
                        }
                    }
                }
            },
            'game-settings': {
                type: 'object',
                required: ['game', 'canvas', 'gameplay'],
                properties: {
                    game: {
                        type: 'object',
                        required: ['name', 'version'],
                        properties: {
                            name: { type: 'string', minLength: 1 },
                            version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' }
                        }
                    },
                    canvas: {
                        type: 'object',
                        required: ['defaultWidth', 'defaultHeight'],
                        properties: {
                            defaultWidth: { type: 'number', minimum: 100 },
                            defaultHeight: { type: 'number', minimum: 100 }
                        }
                    },
                    gameplay: {
                        type: 'object',
                        required: ['startingHealth', 'startingCurrency'],
                        properties: {
                            startingHealth: { type: 'number', minimum: 1 },
                            startingCurrency: { type: 'number', minimum: 0 }
                        }
                    }
                }
            },
            performance: {
                type: 'object',
                required: ['rendering'],
                properties: {
                    rendering: {
                        type: 'object',
                        required: ['targetFPS'],
                        properties: {
                            targetFPS: { type: 'number', minimum: 30, maximum: 120 }
                        }
                    }
                }
            }
        };
    }

    // Validate a configuration against its schema
    validate(configName, config) {
        const schema = this.schemas[configName];
        if (!schema) {
            return {
                isValid: false,
                errors: [`No validation schema found for ${configName}`]
            };
        }

        const result = this.validateObject(config, schema);
        return {
            isValid: result.isValid,
            errors: result.errors,
            warnings: result.warnings
        };
    }

    // Validate an object against a schema
    validateObject(obj, schema) {
        const errors = [];
        const warnings = [];

        // Check if object is of correct type
        if (schema.type === 'object' && typeof obj !== 'object' || obj === null) {
            errors.push(`Expected object, got ${typeof obj}`);
            return { isValid: false, errors, warnings };
        }

        if (schema.type === 'array' && !Array.isArray(obj)) {
            errors.push(`Expected array, got ${typeof obj}`);
            return { isValid: false, errors, warnings };
        }

        // Check required properties
        if (schema.required) {
            for (const prop of schema.required) {
                if (!(prop in obj)) {
                    errors.push(`Missing required property: ${prop}`);
                }
            }
        }

        // Validate properties
        if (schema.properties && typeof obj === 'object' && obj !== null) {
            for (const [propName, propSchema] of Object.entries(schema.properties)) {
                if (propName in obj) {
                    const propResult = this.validateProperty(obj[propName], propSchema);
                    if (!propResult.isValid) {
                        errors.push(`Property ${propName}: ${propResult.errors.join(', ')}`);
                    }
                    if (propResult.warnings.length > 0) {
                        warnings.push(`Property ${propName}: ${propResult.warnings.join(', ')}`);
                    }
                }
            }
        }

        // Validate array items
        if (schema.items && Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                const itemResult = this.validateProperty(obj[i], schema.items);
                if (!itemResult.isValid) {
                    errors.push(`Array item ${i}: ${itemResult.errors.join(', ')}`);
                }
                if (itemResult.warnings.length > 0) {
                    warnings.push(`Array item ${i}: ${itemResult.warnings.join(', ')}`);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Validate a property against its schema
    validateProperty(value, schema) {
        const errors = [];
        const warnings = [];

        // Type validation
        if (schema.type) {
            if (!this.validateType(value, schema.type)) {
                errors.push(`Expected ${schema.type}, got ${typeof value}`);
                return { isValid: false, errors, warnings };
            }
        }

        // String validation
        if (schema.type === 'string') {
            if (schema.minLength && value.length < schema.minLength) {
                errors.push(`String too short (minimum ${schema.minLength} characters)`);
            }
            if (schema.maxLength && value.length > schema.maxLength) {
                errors.push(`String too long (maximum ${schema.maxLength} characters)`);
            }
            if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
                errors.push(`String does not match pattern: ${schema.pattern}`);
            }
            if (schema.enum && !schema.enum.includes(value)) {
                errors.push(`String must be one of: ${schema.enum.join(', ')}`);
            }
        }

        // Number validation
        if (schema.type === 'number') {
            if (schema.minimum !== undefined && value < schema.minimum) {
                errors.push(`Number too small (minimum ${schema.minimum})`);
            }
            if (schema.maximum !== undefined && value > schema.maximum) {
                errors.push(`Number too large (maximum ${schema.maximum})`);
            }
        }

        // Array validation
        if (schema.type === 'array') {
            if (schema.minItems && value.length < schema.minItems) {
                errors.push(`Array too short (minimum ${schema.minItems} items)`);
            }
            if (schema.maxItems && value.length > schema.maxItems) {
                errors.push(`Array too long (maximum ${schema.maxItems} items)`);
            }
        }

        // Object validation
        if (schema.type === 'object' && typeof value === 'object' && value !== null) {
            const objResult = this.validateObject(value, schema);
            if (!objResult.isValid) {
                errors.push(...objResult.errors);
            }
            warnings.push(...objResult.warnings);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // Validate if value matches expected type
    validateType(value, expectedType) {
        switch (expectedType) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'boolean':
                return typeof value === 'boolean';
            case 'array':
                return Array.isArray(value);
            case 'object':
                return typeof value === 'object' && value !== null && !Array.isArray(value);
            default:
                return true;
        }
    }

    // Validate monster configuration
    validateMonsterConfig(config) {
        const errors = [];
        const warnings = [];

        if (!config.monsters || typeof config.monsters !== 'object') {
            errors.push('Monsters configuration must be an object');
            return { isValid: false, errors, warnings };
        }

        const requiredMonsters = ['GEM', 'BLOB', 'ANIMAL'];
        for (const monsterType of requiredMonsters) {
            if (!config.monsters[monsterType]) {
                errors.push(`Missing required monster type: ${monsterType}`);
            }
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    // Validate enemy configuration
    validateEnemyConfig(config) {
        const errors = [];
        const warnings = [];

        if (!config.enemies || typeof config.enemies !== 'object') {
            errors.push('Enemies configuration must be an object');
            return { isValid: false, errors, warnings };
        }

        const requiredEnemies = ['BASIC', 'FAST', 'TANK', 'FLYING'];
        for (const enemyType of requiredEnemies) {
            if (!config.enemies[enemyType]) {
                errors.push(`Missing required enemy type: ${enemyType}`);
            }
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    // Validate wave configuration
    validateWaveConfig(config) {
        const errors = [];
        const warnings = [];

        if (!config.waves || !Array.isArray(config.waves)) {
            errors.push('Waves configuration must be an array');
            return { isValid: false, errors, warnings };
        }

        if (config.waves.length === 0) {
            errors.push('At least one wave must be defined');
            return { isValid: false, errors, warnings };
        }

        for (let i = 0; i < config.waves.length; i++) {
            const wave = config.waves[i];
            if (!wave.id || wave.id !== i + 1) {
                errors.push(`Wave ${i + 1} must have id ${i + 1}`);
            }
            if (!wave.enemies || !Array.isArray(wave.enemies)) {
                errors.push(`Wave ${i + 1} must have enemies array`);
            }
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    // Get validation report for all configurations
    getValidationReport(configs) {
        const report = {
            isValid: true,
            configs: {},
            summary: {
                total: 0,
                valid: 0,
                invalid: 0,
                warnings: 0
            }
        };

        for (const [configName, config] of configs.entries()) {
            const result = this.validate(configName, config);
            report.configs[configName] = result;
            report.summary.total++;
            
            if (result.isValid) {
                report.summary.valid++;
            } else {
                report.summary.invalid++;
                report.isValid = false;
            }
            
            report.summary.warnings += result.warnings.length;
        }

        return report;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigValidator;
}
