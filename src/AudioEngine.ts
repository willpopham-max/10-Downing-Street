import { GameState } from './types';

export type SoundscapeMode = 
  | 'tranquil_office' 
  | 'press_hubbub' 
  | 'protest_unrest' 
  | 'parliament_crisis' 
  | 'emergency_collapse';

export interface SoundscapeStatus {
  mode: SoundscapeMode;
  label: string;
  description: string;
  protestLevel: number;      // 0 to 1
  streetNoiseLevel: number;  // 0 to 1
  officeHumLevel: number;    // 0 to 1
  parliamentLevel: number;   // 0 to 1
  tensionLevel: number;      // 0 to 1
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private _isMuted = false;
  private _masterVolume = 0.6; // default master volume (0 to 1)
  private isPlaying = false;

  // Layer Gain Nodes
  private officeHumGain: GainNode | null = null;
  private streetNoiseGain: GainNode | null = null;
  private protestGain: GainNode | null = null;
  private parliamentGain: GainNode | null = null;
  private tensionDroneGain: GainNode | null = null;

  // Active Sound Nodes for Cleanup
  private nodes: (AudioNode | OscillatorNode | AudioBufferSourceNode)[] = [];
  private chimeTimer: any = null;
  private clockTickTimer: any = null;

  // Current State
  private currentStatus: SoundscapeStatus = {
    mode: 'tranquil_office',
    label: 'Downing Street Study',
    description: 'Calm administrative atmosphere inside No. 10',
    protestLevel: 0,
    streetNoiseLevel: 0.15,
    officeHumLevel: 0.8,
    parliamentLevel: 0,
    tensionLevel: 0.1
  };

  get isMuted(): boolean {
    return this._isMuted;
  }

  get masterVolume(): number {
    return this._masterVolume;
  }

  get soundscapeStatus(): SoundscapeStatus {
    return this.currentStatus;
  }

  setMasterVolume(vol: number) {
    this._masterVolume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain && !this._isMuted) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.linearRampToValueAtTime(this._masterVolume * 0.4, now + 0.1);
    }
  }

  setMuted(muted: boolean) {
    this._isMuted = muted;
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      if (this._isMuted) {
        this.masterGain.gain.linearRampToValueAtTime(0, now + 0.15);
      } else {
        this.masterGain.gain.linearRampToValueAtTime(this._masterVolume * 0.4, now + 0.5);
      }
    }
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
    } catch (e) {
      console.warn('Web Audio API not supported in this browser environment', e);
      return;
    }

    const now = this.ctx.currentTime;

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this._isMuted ? 0 : this._masterVolume * 0.4, now);
    this.masterGain.connect(this.ctx.destination);

    // 1. Setup Noise Buffer for procedural ambient soundscapes
    const noiseBuffer = this.createProceduralNoiseBuffer(this.ctx, 8); // 8 seconds looping noise

    // 2. Setup Layer: Downing Street Office Hum & Room Tone
    this.setupOfficeHumLayer(noiseBuffer);

    // 3. Setup Layer: Whitehall Street Traffic & Press Pack
    this.setupStreetTrafficLayer(noiseBuffer);

    // 4. Setup Layer: Parliament Square Protests Outside Gates
    this.setupProtestLayer(noiseBuffer);

    // 5. Setup Layer: Westminster Parliamentary Murmur & Division Atmosphere
    this.setupParliamentLayer(noiseBuffer);

    // 6. Setup Layer: Suspenseful Crisis Tension Drone
    this.setupTensionDroneLayer();

    // 7. Start periodic ambient accents (clock ticks, subtle chimes)
    this.startAmbientAccents();

    this.isPlaying = true;
    this.applySoundscapeGains(this.currentStatus);
  }

  /**
   * Generates a smooth pink/brown noise buffer for natural sound modeling
   */
  private createProceduralNoiseBuffer(ctx: AudioContext, durationSeconds: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const bufferSize = sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(2, bufferSize, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink noise filter approximation (Paul Kellet's method)
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        b6 = white * 0.115926;
        // Soft clip into channel
        data[i] = pink * 0.08;
      }
    }
    return buffer;
  }

  /**
   * Layer 1: Downing Street Office Hum & HVAC
   * Warm acoustic resonance, 50Hz UK mains harmonic, soft filtered ventilation.
   */
  private setupOfficeHumLayer(noiseBuffer: AudioBuffer) {
    if (!this.ctx || !this.masterGain) return;

    this.officeHumGain = this.ctx.createGain();
    this.officeHumGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    this.officeHumGain.connect(this.masterGain);

    // Filtered brown noise for HVAC / ventilation
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(220, this.ctx.currentTime); // Deep warm air hum

    noiseSource.connect(lowpass);
    lowpass.connect(this.officeHumGain);
    noiseSource.start();
    this.nodes.push(noiseSource, lowpass);

    // Subtle 50Hz UK electrical hum + 100Hz overtone
    const humOsc = this.ctx.createOscillator();
    humOsc.type = 'sine';
    humOsc.frequency.setValueAtTime(50, this.ctx.currentTime);

    const humGain = this.ctx.createGain();
    humGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    humOsc.connect(humGain);
    humGain.connect(this.officeHumGain);
    humOsc.start();
    this.nodes.push(humOsc, humGain);
  }

  /**
   * Layer 2: Whitehall Street Traffic & Distant Press Pack
   * Filtered urban rumble with occasional modulated traffic sweeps.
   */
  private setupStreetTrafficLayer(noiseBuffer: AudioBuffer) {
    if (!this.ctx || !this.masterGain) return;

    this.streetNoiseGain = this.ctx.createGain();
    this.streetNoiseGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    this.streetNoiseGain.connect(this.masterGain);

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Bandpass to simulate distant London traffic through double glazing
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(450, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(1.5, this.ctx.currentTime);

    // Slow traffic swell LFO
    const trafficLfo = this.ctx.createOscillator();
    trafficLfo.type = 'sine';
    trafficLfo.frequency.setValueAtTime(0.08, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(120, this.ctx.currentTime);

    trafficLfo.connect(lfoGain);
    lfoGain.connect(bandpass.frequency);
    trafficLfo.start();

    noiseSource.connect(bandpass);
    bandpass.connect(this.streetNoiseGain);
    noiseSource.start();
    this.nodes.push(noiseSource, bandpass, trafficLfo, lfoGain);
  }

  /**
   * Layer 3: Protesters Outside Gates (Whitehall & Parliament Square)
   * Resonant vowel formant filters (chants), periodic rhythm, megaphone slogans.
   */
  private setupProtestLayer(noiseBuffer: AudioBuffer) {
    if (!this.ctx || !this.masterGain) return;

    this.protestGain = this.ctx.createGain();
    this.protestGain.gain.setValueAtTime(0, this.ctx.currentTime); // Initially silent when calm
    this.protestGain.connect(this.masterGain);

    // Chanting rhythm generator: 1.1 Hz rhythm (chants of crowd)
    const chantLfo = this.ctx.createOscillator();
    chantLfo.type = 'sawtooth';
    chantLfo.frequency.setValueAtTime(1.15, this.ctx.currentTime);

    const chantLfoGain = this.ctx.createGain();
    chantLfoGain.gain.setValueAtTime(0.6, this.ctx.currentTime);

    const chantVca = this.ctx.createGain();
    chantVca.gain.setValueAtTime(0.3, this.ctx.currentTime);

    chantLfo.connect(chantLfoGain);
    chantLfoGain.connect(chantVca.gain);
    chantLfo.start();

    // Noise through vocal formant filter (simulating crowd chanting "Out! Out!")
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const formantFilter1 = this.ctx.createBiquadFilter();
    formantFilter1.type = 'bandpass';
    formantFilter1.frequency.setValueAtTime(750, this.ctx.currentTime); // Human vowel formant F1
    formantFilter1.Q.setValueAtTime(4.0, this.ctx.currentTime);

    const formantFilter2 = this.ctx.createBiquadFilter();
    formantFilter2.type = 'bandpass';
    formantFilter2.frequency.setValueAtTime(1350, this.ctx.currentTime); // Human vowel formant F2
    formantFilter2.Q.setValueAtTime(5.0, this.ctx.currentTime);

    noiseSource.connect(formantFilter1);
    noiseSource.connect(formantFilter2);

    formantFilter1.connect(chantVca);
    formantFilter2.connect(chantVca);
    chantVca.connect(this.protestGain);

    noiseSource.start();
    this.nodes.push(noiseSource, chantLfo, chantLfoGain, chantVca, formantFilter1, formantFilter2);
  }

  /**
   * Layer 4: Parliament Commons Atmosphere & Division Murmur
   * Mid-frequency resonant hum for parliamentary debate chambers.
   */
  private setupParliamentLayer(noiseBuffer: AudioBuffer) {
    if (!this.ctx || !this.masterGain) return;

    this.parliamentGain = this.ctx.createGain();
    this.parliamentGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.parliamentGain.connect(this.masterGain);

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const chamberFilter = this.ctx.createBiquadFilter();
    chamberFilter.type = 'bandpass';
    chamberFilter.frequency.setValueAtTime(600, this.ctx.currentTime);
    chamberFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    // Murmuring modulation
    const murmurLfo = this.ctx.createOscillator();
    murmurLfo.type = 'sine';
    murmurLfo.frequency.setValueAtTime(0.4, this.ctx.currentTime);

    const murmurGain = this.ctx.createGain();
    murmurGain.gain.setValueAtTime(150, this.ctx.currentTime);

    murmurLfo.connect(murmurGain);
    murmurGain.connect(chamberFilter.frequency);
    murmurLfo.start();

    noiseSource.connect(chamberFilter);
    chamberFilter.connect(this.parliamentGain);
    noiseSource.start();
    this.nodes.push(noiseSource, chamberFilter, murmurLfo, murmurGain);
  }

  /**
   * Layer 5: Crisis Tension Drone
   * Detuned low sawtooth oscillators with sweeping cutoff filter.
   */
  private setupTensionDroneLayer() {
    if (!this.ctx || !this.masterGain) return;

    this.tensionDroneGain = this.ctx.createGain();
    this.tensionDroneGain.gain.setValueAtTime(0.02, this.ctx.currentTime);
    this.tensionDroneGain.connect(this.masterGain);

    const droneFilter = this.ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(180, this.ctx.currentTime);
    droneFilter.connect(this.tensionDroneGain);

    const freqs = [55, 55.4, 110, 164.8]; // A1, slight detune, A2, E3
    freqs.forEach(freq => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.connect(droneFilter);
      osc.start();
      this.nodes.push(osc);
    });

    // Slow dark modulation
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.07, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(40, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(droneFilter.frequency);
    lfo.start();

    this.nodes.push(droneFilter, lfo, lfoGain);
  }

  /**
   * Starts subtle organic accents: antique Downing Street clock ticks
   */
  private startAmbientAccents() {
    // Subtle clock tick every 2 seconds
    const scheduleTick = () => {
      if (!this.ctx || !this.isPlaying || this._isMuted) {
        this.clockTickTimer = setTimeout(scheduleTick, 2000);
        return;
      }

      // Only tick audibly if office hum is dominant (quiet room)
      if (this.currentStatus.officeHumLevel > 0.4 && this.currentStatus.protestLevel < 0.3) {
        this.playClockTick();
      }
      this.clockTickTimer = setTimeout(scheduleTick, 2000);
    };

    this.clockTickTimer = setTimeout(scheduleTick, 2000);
  }

  /**
   * Plays a faint, realistic wooden/metallic clock tick (Downing Street mantle clock)
   */
  private playClockTick() {
    if (!this.ctx || !this.masterGain || this._isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.025);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.Q.setValueAtTime(3.0, now);

      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      // Ignore background audio glitch
    }
  }

  /**
   * Plays a resonant Westminster division bell or grandfather clock chime
   */
  playWestminsterChime(type: 'division' | 'quarter' | 'alert' = 'quarter') {
    if (!this.ctx || !this.masterGain || this._isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const baseFreq = type === 'division' ? 440 : type === 'alert' ? 523.25 : 392; // A4, C5, or G4
      
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 2.76, now); // Metallic overtone

      const overtoneGain = this.ctx.createGain();
      overtoneGain.gain.setValueAtTime(0.25, now);
      osc2.connect(overtoneGain);
      overtoneGain.connect(chimeGain);

      osc1.connect(chimeGain);

      chimeGain.gain.setValueAtTime(0.08, now);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

      chimeGain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.6);
      osc2.stop(now + 2.6);
    } catch (e) {
      // AudioContext may be suspended
    }
  }

  /**
   * Analyzes current GameState and updates all ambient soundscape layers dynamically!
   */
  updateFromGameState(state?: GameState | null, isGameOver = false) {
    if (!state || isGameOver) {
      this.currentStatus = {
        mode: isGameOver ? 'emergency_collapse' : 'tranquil_office',
        label: isGameOver ? 'Downing Street Evacuation' : 'Cabinet Room',
        description: isGameOver ? 'Government collapse in progress' : 'Administrative baseline',
        protestLevel: 0,
        streetNoiseLevel: 0.1,
        officeHumLevel: isGameOver ? 0.05 : 0.6,
        parliamentLevel: 0,
        tensionLevel: isGameOver ? 0.9 : 0.05
      };
      this.applySoundscapeGains(this.currentStatus);
      return;
    }

    const gauges = state.gauges || {} as GameState['gauges'];
    const publicApproval = gauges.public_approval ?? 50;
    const parliamentarySupport = gauges.parliamentary_support ?? 60;
    const publicServices = gauges.public_services_health ?? 50;
    const mediaFavour = gauges.media_favorability ?? 50;
    const econStability = gauges.economic_stability ?? 50;
    const partyLoyalty = gauges.party_loyalty ?? 60;
    const consecutiveZero = state.consecutive_weeks_any_gauge_zero || 0;

    // 1. Calculate Protest Level (0 to 1)
    // Protests erupt when public approval drops below 45, or NHS/services collapse, or party in revolt
    let protestScore = 0;
    if (publicApproval < 45) protestScore += (45 - publicApproval) / 45 * 0.6;
    if (publicServices < 40) protestScore += (40 - publicServices) / 40 * 0.3;
    if (partyLoyalty < 30) protestScore += (30 - partyLoyalty) / 30 * 0.2;
    const protestLevel = Math.max(0, Math.min(1, protestScore));

    // 2. Calculate Street & Press Clamour Level (0 to 1)
    // Rises with media hostility and economic turbulence
    let streetScore = 0.15; // baseline London city noise
    if (mediaFavour < 40) streetScore += (40 - mediaFavour) / 40 * 0.45; // Press pack outside No 10
    if (econStability < 35) streetScore += (35 - econStability) / 35 * 0.3;
    const streetNoiseLevel = Math.max(0.1, Math.min(1, streetScore));

    // 3. Calculate Parliamentary Tension (0 to 1)
    let parlScore = 0;
    if (parliamentarySupport < 45) parlScore += (45 - parliamentarySupport) / 45 * 0.7;
    if (partyLoyalty < 35) parlScore += (35 - partyLoyalty) / 35 * 0.3;
    const parliamentLevel = Math.max(0, Math.min(1, parlScore));

    // 4. Calculate Overall Tension / Crisis Level (0 to 1)
    let dangerScore = 0;
    Object.values(gauges).forEach(val => {
      if (typeof val === 'number') {
        if (val <= 0) dangerScore += 0.35;
        else if (val < 20) dangerScore += 0.15;
      }
    });
    dangerScore += consecutiveZero * 0.25;
    const tensionLevel = Math.max(0, Math.min(1, dangerScore));

    // 5. Calculate Office Hum (Quiet room tone)
    // Dominant when outside clamor is low, drowned out when protests or crisis escalate
    const officeHumLevel = Math.max(0.15, 0.8 - (protestLevel * 0.6) - (tensionLevel * 0.3));

    // Determine primary soundscape mode label
    let mode: SoundscapeMode = 'tranquil_office';
    let label = 'Downing Street Study';
    let description = 'Calm administrative atmosphere inside No. 10';

    if (tensionLevel >= 0.75) {
      mode = 'emergency_collapse';
      label = 'Whitehall Red Alert';
      description = 'Emergency COBR assembly & heightened government crisis';
    } else if (protestLevel >= 0.5) {
      mode = 'protest_unrest';
      label = 'Parliament Square Protests';
      description = `Demonstrations outside Downing Street gates (Public Approval ${publicApproval}%)`;
    } else if (parliamentLevel >= 0.55) {
      mode = 'parliament_crisis';
      label = 'Commons Division Tension';
      description = `Westminster whips battle rebellion (MP Support ${parliamentarySupport}%)`;
    } else if (streetNoiseLevel >= 0.5) {
      mode = 'press_hubbub';
      label = 'Whitehall Media Scramble';
      description = `Press pack and camera crews gather at Downing Street`;
    }

    this.currentStatus = {
      mode,
      label,
      description,
      protestLevel,
      streetNoiseLevel,
      officeHumLevel,
      parliamentLevel,
      tensionLevel
    };

    this.applySoundscapeGains(this.currentStatus);
  }

  /**
   * Smoothly crossfades and applies volume levels across all active soundscape layers
   */
  private applySoundscapeGains(status: SoundscapeStatus) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const rampTime = 2.5; // Smooth 2.5s transition to avoid sudden jarring cuts

    // 1. Office Hum (Max ~0.2)
    if (this.officeHumGain) {
      const target = status.officeHumLevel * 0.18;
      this.officeHumGain.gain.linearRampToValueAtTime(target, now + rampTime);
    }

    // 2. Street Noise / Press (Max ~0.15)
    if (this.streetNoiseGain) {
      const target = status.streetNoiseLevel * 0.14;
      this.streetNoiseGain.gain.linearRampToValueAtTime(target, now + rampTime);
    }

    // 3. Protests outside Downing Street (Max ~0.25)
    if (this.protestGain) {
      const target = status.protestLevel * 0.22;
      this.protestGain.gain.linearRampToValueAtTime(target, now + rampTime);
    }

    // 4. Parliament Commons Murmur (Max ~0.16)
    if (this.parliamentGain) {
      const target = status.parliamentLevel * 0.15;
      this.parliamentGain.gain.linearRampToValueAtTime(target, now + rampTime);
    }

    // 5. Tension Drone (Max ~0.18)
    if (this.tensionDroneGain) {
      const target = 0.02 + (status.tensionLevel * 0.16);
      this.tensionDroneGain.gain.linearRampToValueAtTime(target, now + rampTime);
    }
  }

  // Legacy method compatibility
  setTension(level: number) {
    if (this.currentStatus) {
      this.currentStatus.tensionLevel = Math.max(0, Math.min(1, level));
      this.applySoundscapeGains(this.currentStatus);
    }
  }

  playSaveSound() {
    if (!this.ctx || this._isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      
      gain.gain.setValueAtTime(0.08 * this._masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {}
  }

  stop() {
    if (!this.ctx || !this.isPlaying) return;
    clearTimeout(this.chimeTimer);
    clearTimeout(this.clockTickTimer);

    const now = this.ctx.currentTime;
    if (this.masterGain) {
      this.masterGain.gain.linearRampToValueAtTime(0, now + 1);
    }

    setTimeout(() => {
      this.nodes.forEach(node => {
        if ('stop' in node && typeof (node as any).stop === 'function') {
          try {
            (node as any).stop();
          } catch (e) {}
        }
      });
      this.nodes = [];
      this.ctx?.close();
      this.ctx = null;
      this.isPlaying = false;
    }, 1100);
  }
}

export const audioEngine = new AudioEngine();
