// Tiny synthesized sound effects: no audio files, no network. Everything is
// guarded, so a browser without audio just stays silent.
export function createSound() {
  let audio = null;

  function context() {
    if (audio) return audio;
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      audio = new Ctor();
    } catch {
      return null;
    }
    return audio;
  }

  function blip(frequency, seconds, type, gainValue) {
    const ctx = context();
    if (!ctx) return;
    try {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(gainValue, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + seconds);
    } catch {
      // Silent when audio is unavailable.
    }
  }

  return {
    pickup() {
      blip(880, 0.12, 'sine', 0.12);
      setTimeout(() => blip(1320, 0.15, 'sine', 0.1), 70);
    },
    tool() {
      blip(420, 0.1, 'triangle', 0.1);
    },
    spotted() {
      blip(220, 0.18, 'square', 0.06);
    },
    caught() {
      blip(160, 0.3, 'sawtooth', 0.12);
      setTimeout(() => blip(110, 0.35, 'sawtooth', 0.1), 120);
    },
    win() {
      [523, 659, 784, 1047].forEach((note, index) => {
        setTimeout(() => blip(note, 0.18, 'sine', 0.12), index * 110);
      });
    },
  };
}
