/* Audio effects and background music. Place your downloaded file at:
   assets/drumroll.mp3
*/
export class AudioManager {
  constructor() {
    this.context = null;
    this.musicOn = false;
    this.musicTimer = null;
    this.musicStep = 0;
    this.drumrollAudio = new Audio(new URL("../assets/drumroll.mp3", import.meta.url));
    this.drumrollAudio.preload = "auto";
    this.drumrollAudio.loop = true;
  }

  getContext() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      this.context = new AudioContextClass();
    }
    if (this.context.state === "suspended") this.context.resume();
    return this.context;
  }

  playTone(frequency, duration, type = "sine", volume = 0.08, delay = 0) {
    const audio = this.getContext();
    if (!audio) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const start = audio.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.04);
  }

  playMusicNote() {
    if (!this.musicOn || !this.context) return;
    const melody = [659,784,880,784,659,523,587,659,784,659,587,523,587,659,784,880];
    const note = melody[this.musicStep % melody.length];
    this.playTone(note, 0.22, "triangle", 0.035);
    if (this.musicStep % 4 === 0) this.playTone(note / 2, 0.34, "sine", 0.045);
    if (this.musicStep % 4 === 2) this.playTone(392, 0.12, "sine", 0.018);
    this.musicStep++;
  }

  toggleMusic(enabled) {
    this.musicOn = enabled;
    if (enabled) {
      this.getContext();
      if (!this.musicTimer) {
        this.musicStep = 0;
        this.playMusicNote();
        this.musicTimer = setInterval(() => this.playMusicNote(), 300);
      }
    } else if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    return this.musicOn;
  }

  playPop() {
    const audio = this.getContext();
    if (!audio) return;
    const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.12), audio.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * (1 - i / samples.length);
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.value = 1500;
    gain.gain.setValueAtTime(0.18, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.12);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audio.destination);
    source.start();
    this.playTone(520, 0.16, "sine", 0.045);
  }

  // Plays the downloaded drumroll while the dart travels and suspense runs.
  startDrumroll() {
    this.stopDrumroll();
    this.drumrollAudio.currentTime = 0;
    const playPromise = this.drumrollAudio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((error) => {
        console.warn("Drumroll could not be played. Check assets/drumroll.mp3.", error);
      });
    }
  }

  stopDrumroll() {
    this.drumrollAudio.pause();
    this.drumrollAudio.currentTime = 0;
  }

  playReveal() {
    this.stopDrumroll();
}
