class SaveSystem {
    constructor() {
        this.saveKey = 'gabriels-monster-arena-save';
        this.settingsKey = 'gabriels-monster-arena-settings';
    }

    saveGame(gameState) {
        const saveData = {
            level: gameState.level || 1,
            score: gameState.score || 0,
            currency: gameState.currency || 100,
            health: gameState.health || 100,
            wave: gameState.wave || 1,
            unlockedMonsters: gameState.unlockedMonsters || ['GEM', 'BLOB', 'ANIMAL'],
            highScore: gameState.highScore || 0,
            timestamp: Date.now(),
            version: '1.0.0'
        };
        
        try {
            localStorage.setItem(this.saveKey, JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.error('Save failed:', error);
            return false;
        }
    }

    loadGame() {
        try {
            const saveData = localStorage.getItem(this.saveKey);
            if (saveData) {
                const parsed = JSON.parse(saveData);
                return parsed;
            }
        } catch (error) {
            console.error('Load failed:', error);
        }
        return null;
    }

    saveSettings(settings) {
        const settingsData = {
            soundEnabled: settings.soundEnabled !== undefined ? settings.soundEnabled : true,
            musicEnabled: settings.musicEnabled !== undefined ? settings.musicEnabled : true,
            soundVolume: settings.soundVolume || 0.7,
            musicVolume: settings.musicVolume || 0.5,
            showFPS: settings.showFPS || false,
            quality: settings.quality || 'medium'
        };
        
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(settingsData));
            return true;
        } catch (error) {
            console.error('Settings save failed:', error);
            return false;
        }
    }

    loadSettings() {
        try {
            const settingsData = localStorage.getItem(this.settingsKey);
            if (settingsData) {
                return JSON.parse(settingsData);
            }
        } catch (error) {
            console.error('Settings load failed:', error);
        }
        
        // Return default settings
        return {
            soundEnabled: true,
            musicEnabled: true,
            soundVolume: 0.7,
            musicVolume: 0.5,
            showFPS: false,
            quality: 'medium'
        };
    }

    clearSave() {
        try {
            localStorage.removeItem(this.saveKey);
            return true;
        } catch (error) {
            console.error('Clear save failed:', error);
            return false;
        }
    }

    clearSettings() {
        try {
            localStorage.removeItem(this.settingsKey);
            return true;
        } catch (error) {
            console.error('Clear settings failed:', error);
            return false;
        }
    }

    hasSave() {
        return localStorage.getItem(this.saveKey) !== null;
    }

    getSaveInfo() {
        const saveData = this.loadGame();
        if (saveData) {
            return {
                level: saveData.level,
                score: saveData.score,
                timestamp: saveData.timestamp,
                version: saveData.version
            };
        }
        return null;
    }

    exportSave() {
        const saveData = this.loadGame();
        if (saveData) {
            return JSON.stringify(saveData, null, 2);
        }
        return null;
    }

    importSave(saveString) {
        try {
            const saveData = JSON.parse(saveString);
            if (saveData && saveData.version) {
                localStorage.setItem(this.saveKey, saveString);
                return true;
            }
        } catch (error) {
            console.error('Import save failed:', error);
        }
        return false;
    }
}
