class AudioSystem extends System {
    constructor() {
        super();
        this.audioContext = null;
        this.sounds = new Map();
        this.music = null;
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.soundVolume = 0.7;
        this.musicVolume = 0.5;
        this.initializeAudio();
    }

    setDependencies(dependencies) {
        // AudioSystem doesn't need external dependencies
        console.log('AudioSystem dependencies set (none required)');
    }

    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
            console.log('Audio system initialized successfully');
        } catch (error) {
            console.warn('Audio not supported:', error);
            this.audioContext = null;
            this.soundEnabled = false;
            this.musicEnabled = false;
        }
    }

    createSounds() {
        // Create simple sound effects using Web Audio API
        this.sounds.set('monster_attack', this.createTone(800, 0.1, 'square'));
        this.sounds.set('enemy_die', this.createTone(200, 0.3, 'sawtooth'));
        this.sounds.set('monster_place', this.createTone(600, 0.2, 'sine'));
        this.sounds.set('monster_upgrade', this.createTone(1000, 0.3, 'triangle'));
        this.sounds.set('wave_complete', this.createChord([440, 554, 659], 0.5, 'sine'));
        this.sounds.set('game_over', this.createTone(150, 1.0, 'sawtooth'));
        this.sounds.set('button_click', this.createTone(1000, 0.1, 'square'));
    }

    createTone(frequency, duration, type = 'sine') {
        return () => {
            if (!this.audioContext || !this.soundEnabled) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.soundVolume * 0.3, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };
    }

    createChord(frequencies, duration, type = 'sine') {
        return () => {
            if (!this.audioContext || !this.soundEnabled) return;
            
            frequencies.forEach((frequency, index) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                oscillator.type = type;
                
                const startTime = this.audioContext.currentTime + (index * 0.1);
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(this.soundVolume * 0.2, startTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
                
                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            });
        };
    }

    playSound(soundName) {
        if (!this.soundEnabled || !this.audioContext) {
            return; // Gracefully handle audio not available
        }
        
        // Resume audio context if suspended (required for user interaction)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(console.warn);
        }
        
        const sound = this.sounds.get(soundName);
        if (sound) {
            try {
                sound();
            } catch (error) {
                console.warn('Failed to play sound:', soundName, error);
                // Don't throw, just log and continue
            }
        } else {
            console.warn('Sound not found:', soundName);
        }
    }

    playMusic() {
        if (!this.audioContext || !this.musicEnabled) return;
        
        // Create a simple background music loop
        this.createBackgroundMusic();
    }

    createBackgroundMusic() {
        if (this.music) return;
        
        const playNote = (frequency, startTime, duration) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, startTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(this.musicVolume * 0.1, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };

        const melody = [440, 494, 523, 587, 659, 698, 784, 880]; // C major scale
        const rhythm = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1.0, 1.0]; // note durations
        
        let currentTime = this.audioContext.currentTime;
        
        const playMelody = () => {
            melody.forEach((freq, index) => {
                playNote(freq, currentTime, rhythm[index]);
                currentTime += rhythm[index];
            });
            
            // Loop the melody
            setTimeout(() => {
                if (this.musicEnabled) {
                    currentTime = this.audioContext.currentTime;
                    playMelody();
                }
            }, 4000);
        };
        
        playMelody();
        this.music = true;
    }

    stopMusic() {
        this.music = false;
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
    }

    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        if (!enabled) {
            this.stopMusic();
        } else if (this.audioContext) {
            this.playMusic();
        }
    }

    setSoundVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(1, volume));
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
    }

    update(deltaTime) {
        // Audio system doesn't need regular updates
    }

    render(ctx) {
        // Audio system doesn't render
    }
}
