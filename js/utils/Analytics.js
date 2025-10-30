class Analytics {
  static track(event) {
    const events = JSON.parse(localStorage.getItem('game_events') || '[]');
    events.push({event, time: Date.now()});
    localStorage.setItem('game_events', JSON.stringify(events));
  }
}

// In GameEngine, e.g., on wave start: Analytics.track('wave_started');
