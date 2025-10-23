class TutorialSystem extends System {
    constructor() {
        super();
        this.tutorialActive = false;
        this.currentStep = 0;
        this.steps = [
            {
                title: "Welcome to Gabriel's Monster Arena!",
                message: "Place monsters to defend against enemy waves. Click the monster buttons at the bottom to select them.",
                highlight: 'monster_buttons',
                action: 'click_monster'
            },
            {
                title: "Place Your First Monster",
                message: "Click on the grid to place your selected monster. Avoid placing on the brown path!",
                highlight: 'placement_grid',
                action: 'place_monster'
            },
            {
                title: "Start the First Wave",
                message: "Click 'Start Wave' to begin the first enemy wave. Your monsters will automatically attack enemies in range.",
                highlight: 'start_wave_button',
                action: 'start_wave'
            },
            {
                title: "Upgrade Your Monsters",
                message: "Click the upgrade button (⬆) and then click on a monster to upgrade it. Upgrades cost currency but make monsters stronger!",
                highlight: 'upgrade_button',
                action: 'upgrade_monster'
            },
            {
                title: "Earn Currency and Experience",
                message: "Defeat enemies to earn currency and experience. Monsters level up automatically when they gain enough experience.",
                highlight: 'currency_display',
                action: 'earn_currency'
            },
            {
                title: "You're Ready to Play!",
                message: "That's it! Survive all waves to win. Good luck, Gabriel!",
                highlight: 'none',
                action: 'complete'
            }
        ];
        this.completedActions = new Set();
        this.stepStartTime = 0;
    }

    startTutorial() {
        this.tutorialActive = true;
        this.currentStep = 0;
        this.completedActions.clear();
        this.stepStartTime = Date.now();
        console.log('Tutorial started:', this.steps[this.currentStep].title);
    }

    completeAction(actionType) {
        if (!this.tutorialActive) return;
        
        this.completedActions.add(actionType);
        const currentStep = this.steps[this.currentStep];
        
        if (currentStep.action === actionType) {
            this.nextStep();
        }
    }

    nextStep() {
        this.currentStep++;
        if (this.currentStep >= this.steps.length) {
            this.completeTutorial();
        } else {
            this.stepStartTime = Date.now();
            console.log('Tutorial step:', this.steps[this.currentStep].title);
        }
    }

    completeTutorial() {
        this.tutorialActive = false;
        console.log('Tutorial completed!');
    }

    skipTutorial() {
        this.tutorialActive = false;
        console.log('Tutorial skipped');
    }

    update(deltaTime) {
        if (!this.tutorialActive) return;
        
        // Auto-advance tutorial after 10 seconds if no action taken
        const timeSinceStepStart = Date.now() - this.stepStartTime;
        if (timeSinceStepStart > 10000) {
            this.nextStep();
        }
    }

    render(ctx) {
        if (!this.tutorialActive) return;
        
        const step = this.steps[this.currentStep];
        if (!step) return;
        
        ctx.save();
        
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Tutorial box
        const boxWidth = 400;
        const boxHeight = 200;
        const boxX = (ctx.canvas.width - boxWidth) / 2;
        const boxY = (ctx.canvas.height - boxHeight) / 2;
        
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        // Title
        ctx.fillStyle = '#ecf0f1';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(step.title, boxX + boxWidth / 2, boxY + 30);
        
        // Message
        ctx.font = '16px Arial';
        ctx.fillStyle = '#bdc3c7';
        this.wrapText(ctx, step.message, boxX + 20, boxY + 60, boxWidth - 40, 20);
        
        // Progress indicator
        ctx.fillStyle = '#3498db';
        ctx.font = '14px Arial';
        ctx.fillText(
            `Step ${this.currentStep + 1} of ${this.steps.length}`,
            boxX + boxWidth / 2, boxY + boxHeight - 20
        );
        
        // Skip button
        ctx.fillStyle = '#e74c3c';
        ctx.font = '12px Arial';
        ctx.fillText('Click anywhere to skip tutorial', boxX + boxWidth / 2, boxY + boxHeight - 5);
        
        ctx.restore();
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
    }

    isActive() {
        return this.tutorialActive;
    }

    getCurrentStep() {
        return this.steps[this.currentStep];
    }
}
