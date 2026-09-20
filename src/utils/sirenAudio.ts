/**
 * Web Audio API Acoustic Deterrent Siren & Kinetic Pulse Sound Synthesizer
 */

class UGVDefensiveAudioSynthesizer {
  private audioCtx: AudioContext | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenTimer: any = null;
  private isSirenPlaying = false;

  private initCtx() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Start 360° High-Pitch Acoustic Deterrent Siren (Piercing 2400Hz - 3200Hz frequency modulation)
   */
  public startDefenseSiren() {
    if (this.isSirenPlaying) return;
    try {
      this.initCtx();
      if (!this.audioCtx) return;

      this.sirenOsc = this.audioCtx.createOscillator();
      this.sirenGain = this.audioCtx.createGain();

      this.sirenOsc.type = 'sawtooth';
      this.sirenOsc.frequency.setValueAtTime(2600, this.audioCtx.currentTime);

      this.sirenGain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);

      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.audioCtx.destination);
      this.sirenOsc.start();

      let toggle = false;
      this.sirenTimer = setInterval(() => {
        if (!this.audioCtx || !this.sirenOsc) return;
        const now = this.audioCtx.currentTime;
        const targetFreq = toggle ? 3200 : 2400;
        this.sirenOsc.frequency.cancelScheduledValues(now);
        this.sirenOsc.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.12);
        toggle = !toggle;
      }, 150);

      this.isSirenPlaying = true;
    } catch (e) {
      console.warn('Audio siren start failed:', e);
    }
  }

  /**
   * Stop Acoustic Deterrent Siren
   */
  public stopDefenseSiren() {
    if (!this.isSirenPlaying) return;
    try {
      if (this.sirenTimer) {
        clearInterval(this.sirenTimer);
        this.sirenTimer = null;
      }
      if (this.sirenGain && this.audioCtx) {
        this.sirenGain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.05);
      }
      setTimeout(() => {
        if (this.sirenOsc) {
          try {
            this.sirenOsc.stop();
            this.sirenOsc.disconnect();
          } catch (_) {}
          this.sirenOsc = null;
        }
      }, 60);
      this.isSirenPlaying = false;
    } catch (e) {
      console.warn('Audio siren stop failed:', e);
    }
  }

  /**
   * Play High-Torque Kinetic Motor Pulse Sound for Self-Righting
   */
  public playKineticRightingPulse() {
    try {
      this.initCtx();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Sub-bass motor surge
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.35);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.7);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.75);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.8);
    } catch (e) {
      console.warn('Kinetic sound failed:', e);
    }
  }
}

export const ugvDefensiveAudio = new UGVDefensiveAudioSynthesizer();
