async (page) => {
  await page.addInitScript(() => {
    const events = {
      assetFetches: [],
      bufferSources: 0,
      closes: 0,
      contexts: 0,
      frequencies: [],
      resumes: 0,
      suspends: 0,
    };
    window.__orreryAudioEvents = events;

    class FakeAudioParam {
      constructor(kind) {
        this.kind = kind;
      }
      setValueAtTime(value) {
        if (this.kind === 'frequency') {
          events.frequencies.push(value);
        }
      }
      linearRampToValueAtTime() {}
    }

    class FakeAudioNode {
      connect() {
        return this;
      }
      disconnect() {}
    }

    class FakeAudioContext {
      constructor() {
        events.contexts += 1;
        this.currentTime = 1;
        this.destination = new FakeAudioNode();
      }
      createGain() {
        const gain = new FakeAudioNode();
        gain.gain = new FakeAudioParam('gain');
        return gain;
      }
      createOscillator() {
        const oscillator = new FakeAudioNode();
        oscillator.detune = new FakeAudioParam('detune');
        oscillator.frequency = new FakeAudioParam('frequency');
        oscillator.onended = null;
        oscillator.start = () => {};
        oscillator.stop = () => {};
        oscillator.type = 'sine';
        return oscillator;
      }
      createBufferSource() {
        events.bufferSources += 1;
        const source = new FakeAudioNode();
        source.buffer = null;
        source.loop = false;
        source.loopStart = 0;
        source.loopEnd = 0;
        source.onended = null;
        source.start = () => {};
        source.stop = () => {};
        return source;
      }
      decodeAudioData() {
        return Promise.resolve({ duration: 2 });
      }
      resume() {
        events.resumes += 1;
        return Promise.resolve();
      }
      suspend() {
        events.suspends += 1;
        return Promise.resolve();
      }
      close() {
        events.closes += 1;
        return Promise.resolve();
      }
    }

    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: FakeAudioContext,
      writable: true,
    });
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const input = args[0];
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
      if (url.includes('/audio/')) {
        events.assetFetches.push(url);
      }
      return originalFetch(...args);
    };
  });
}
