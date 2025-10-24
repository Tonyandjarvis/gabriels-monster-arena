// Test setup file for Jest
// This file runs before each test file

// Mock Canvas API
class MockCanvas {
  constructor() {
    this.width = 800;
    this.height = 600;
    this.getContext = jest.fn(() => ({
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      clearRect: jest.fn(),
      fillText: jest.fn(),
      strokeText: jest.fn(),
      drawImage: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      scale: jest.fn(),
      setTransform: jest.fn(),
      getTransform: jest.fn(),
      createImageData: jest.fn(),
      putImageData: jest.fn(),
      getImageData: jest.fn(),
      canvas: this
    }));
    this.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      right: this.width,
      bottom: this.height,
      width: this.width,
      height: this.height
    }));
  }
}

// Mock Audio Context
class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.sampleRate = 44100;
    this.currentTime = 0;
    this.destination = {
      connect: jest.fn(),
      disconnect: jest.fn()
    };
    this.createBuffer = jest.fn(() => ({
      length: 1000,
      duration: 0.1,
      sampleRate: 44100,
      numberOfChannels: 2,
      getChannelData: jest.fn(() => new Float32Array(1000))
    }));
    this.createBufferSource = jest.fn(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      buffer: null,
      playbackRate: { value: 1 },
      gain: { value: 1 }
    }));
    this.createGain = jest.fn(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      gain: { value: 1 }
    }));
    this.createOscillator = jest.fn(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      frequency: { value: 440 },
      type: 'sine'
    }));
    this.resume = jest.fn(() => Promise.resolve());
    this.suspend = jest.fn(() => Promise.resolve());
    this.close = jest.fn(() => Promise.resolve());
  }
}

// Mock localStorage
class MockStorage {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = value;
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock performance.now
global.performance = {
  now: jest.fn(() => Date.now())
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock DOM elements
global.document = {
  ...document,
  createElement: jest.fn(tagName => {
    const element = {
      tagName: tagName.toUpperCase(),
      style: {},
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(),
        toggle: jest.fn()
      },
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      getBoundingClientRect: jest.fn(() => ({
        left: 0,
        top: 0,
        right: 800,
        bottom: 600,
        width: 800,
        height: 600
      })),
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      querySelector: jest.fn(),
      querySelectorAll: jest.fn(() => []),
      getElementById: jest.fn(),
      getElementsByClassName: jest.fn(() => []),
      getElementsByTagName: jest.fn(() => [])
    };
    
    // Add specific properties based on tag name
    if (tagName === 'canvas') {
      element.width = 800;
      element.height = 600;
      element.getContext = jest.fn(() => ({
        fillRect: jest.fn(),
        strokeRect: jest.fn(),
        clearRect: jest.fn(),
        fillText: jest.fn(),
        strokeText: jest.fn(),
        drawImage: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        arc: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        translate: jest.fn(),
        rotate: jest.fn(),
        scale: jest.fn(),
        setTransform: jest.fn(),
        getTransform: jest.fn(),
        createImageData: jest.fn(),
        putImageData: jest.fn(),
        getImageData: jest.fn(),
        canvas: element
      }));
    }
    
    return element;
  }),
  getElementById: jest.fn(id => {
    if (id === 'gameCanvas') {
      return new MockCanvas();
    }
    return null;
  }),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
};

// Mock window object
global.window = {
  ...window,
  innerWidth: 800,
  innerHeight: 600,
  devicePixelRatio: 1,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  requestAnimationFrame: global.requestAnimationFrame,
  cancelAnimationFrame: global.cancelAnimationFrame,
  performance: global.performance,
  localStorage: new MockStorage(),
  sessionStorage: new MockStorage(),
  AudioContext: MockAudioContext,
  webkitAudioContext: MockAudioContext,
  HTMLCanvasElement: MockCanvas
};

// Mock Image constructor
global.Image = class MockImage {
  constructor() {
    this.src = '';
    this.onload = null;
    this.onerror = null;
    this.width = 32;
    this.height = 32;
    this.complete = true;
    this.naturalWidth = 32;
    this.naturalHeight = 32;
  }
};

// Mock fetch for asset loading
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
  })
);

// Mock ResizeObserver
global.ResizeObserver = class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Set up test environment
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset global state
  global.window.localStorage.clear();
  global.window.sessionStorage.clear();
  
  // Reset performance.now
  global.performance.now.mockReturnValue(Date.now());
});

afterEach(() => {
  // Clean up after each test
  jest.restoreAllMocks();
});

// Global test utilities
global.TestUtils = {
  createMockCanvas: () => new MockCanvas(),
  createMockAudioContext: () => new MockAudioContext(),
  createMockEntity: () => ({
    id: Math.random().toString(36).substr(2, 9),
    components: new Map(),
    tags: new Set(),
    addComponent: jest.fn(),
    removeComponent: jest.fn(),
    getComponent: jest.fn(),
    hasComponent: jest.fn(),
    addTag: jest.fn(),
    removeTag: jest.fn(),
    hasTag: jest.fn(),
    destroy: jest.fn()
  }),
  createMockSystem: () => ({
    entities: new Set(),
    enabled: true,
    addEntity: jest.fn(),
    removeEntity: jest.fn(),
    update: jest.fn(),
    render: jest.fn(),
    destroy: jest.fn()
  }),
  waitFor: (condition, timeout = 1000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(check, 10);
        }
      };
      check();
    });
  }
};

console.log('Test setup completed successfully');
