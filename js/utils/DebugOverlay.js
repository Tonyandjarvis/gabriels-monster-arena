class DebugOverlay {
  constructor() {
    this.enabled = new URLSearchParams(window.location.search).has('debug');
    if (!this.enabled) return;

    this.div = document.createElement('div');
    this.div.style.position = 'fixed';
    this.div.style.top = '10px';
    this.div.style.right = '10px';
    this.div.style.background = 'rgba(0,0,0,0.8)';
    this.div.style.color = 'white';
    this.div.style.padding = '10px';
    this.div.style.zIndex = '1000';
    this.div.style.maxWidth = '300px';
    this.div.style.maxHeight = '80vh';
    this.div.style.overflow = 'auto';
    document.body.appendChild(this.div);

    this.panels = {
      input: this.createPanel('Input (Last 10 Clicks)'),
      placement: this.createPanel('Placement'),
      combat: this.createPanel('Combat'),
      entities: this.createPanel('Entities')
    };

    this.logs = { input: [] };

    // Test buttons
    this.addTestButton('Simulate Placement', () => {
      // Simulate placement at (200, 300)
      window.gameEngine.handleInput(200, 300, true);
    });
    this.addTestButton('Simulate Combat Hit', () => {
      // Simulate a hit
      console.log('Simulated hit - check combat panel');
    });

    // JSON export button
    this.addTestButton('Export Logs', () => {
      const json = JSON.stringify(this.logs);
      const blob = new Blob([json], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'debug_logs.json';
      a.click();
    });

    this.updateInterval = setInterval(() => this.updatePanels(), 1000 / 5); // 5 Hz
  }

  createPanel(title) {
    const panel = document.createElement('div');
    panel.innerHTML = `<h3>${title}</h3><div></div>`;
    this.div.appendChild(panel);
    return panel.querySelector('div');
  }

  addTestButton(label, onClick) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.onclick = onClick;
    this.div.appendChild(btn);
  }

  logInput(x, y) {
    this.logs.input.push({x, y, time: Date.now()});
    if (this.logs.input.length > 10) this.logs.input.shift();
  }

  updatePanels() {
    if (!this.enabled) return;

    // Input panel
    this.panels.input.innerHTML = this.logs.input.map(log => `Click at (${log.x}, ${log.y}) @ ${new Date(log.time).toLocaleTimeString()}`).join('<br>');

    // Placement panel
    const ps = window.gameEngine.placementSystem;
    this.panels.placement.innerHTML = `Mode: ${ps.placementMode ? 'Active' : 'Inactive'}<br>Selected: ${ps.selectedMonster || 'None'}<br>Preview: ${ps.placementPreview ? `(${ps.placementPreview.x}, ${ps.placementPreview.y})` : 'None'}`;

    // Combat panel
    const cs = window.gameEngine.combatSystem;
    this.panels.combat.innerHTML = `Projectiles: ${cs.projectiles.length}<br>Targets Assigned: ${cs.entities.filter(e => e.getComponent('MonsterComponent')?.target).length}<br>Hits Last Second: (simulate)`;

    // Entities panel
    this.panels.entities.innerHTML = `Total: ${window.gameEngine.entities.size}<br>Monsters: ${window.gameEngine.entities.filter(e => e.hasTag('monster')).length}<br>Enemies: ${window.gameEngine.entities.filter(e => e.hasTag('enemy')).length}`;
  }
}

// Export for global access
window.DebugOverlay = new DebugOverlay();
