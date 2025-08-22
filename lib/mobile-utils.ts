// Sound effects for mobile interactions
export class SoundEffects {
  private static context: AudioContext | null = null;
  private static enabled: boolean = true;

  static setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  static isEnabled(): boolean {
    return this.enabled;
  }

  private static getContext(): AudioContext | null {
    if (!this.context && 'AudioContext' in window) {
      try {
        this.context = new AudioContext();
      } catch (err) {
        console.warn('AudioContext not available:', err);
        return null;
      }
    }
    return this.context;
  }

  static playTone(frequency: number, duration: number, volume: number = 0.2): void {
    if (!this.enabled) return;

    const context = this.getContext();
    if (!context) return;

    try {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, context.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, context.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration / 1000);

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + duration / 1000);
    } catch (err) {
      console.warn('Failed to play tone:', err);
    }
  }

  static playSuccessSound(): void {
    this.playTone(800, 100);
    setTimeout(() => this.playTone(1000, 150), 100);
  }

  static playErrorSound(): void {
    this.playTone(400, 200);
    setTimeout(() => this.playTone(300, 200), 200);
  }

  static playClickSound(): void {
    this.playTone(600, 50, 0.1);
  }

  static playStartSound(): void {
    this.playTone(523, 150); // C5
    setTimeout(() => this.playTone(659, 150), 150); // E5
    setTimeout(() => this.playTone(784, 200), 300); // G5
  }

  static playStopSound(): void {
    this.playTone(784, 150); // G5
    setTimeout(() => this.playTone(659, 150), 150); // E5
    setTimeout(() => this.playTone(523, 200), 300); // C5
  }

  static playScanSound(): void {
    this.playTone(1000, 80);
    setTimeout(() => this.playTone(1200, 80), 80);
  }

  // Play a notification sound using Web Audio API
  static async playNotificationSound(): Promise<void> {
    if (!this.enabled) return;

    const context = this.getContext();
    if (!context) return;

    try {
      // Create a pleasant notification melody
      const notes = [
        { freq: 523.25, duration: 200 }, // C5
        { freq: 659.25, duration: 200 }, // E5
        { freq: 783.99, duration: 400 }, // G5
      ];

      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        setTimeout(() => {
          this.playTone(note.freq, note.duration, 0.15);
        }, i * 150);
      }
    } catch (err) {
      console.warn('Failed to play notification sound:', err);
    }
  }

  // Cleanup resources
  static cleanup(): void {
    if (this.context && this.context.state !== 'closed') {
      try {
        this.context.close();
        this.context = null;
      } catch (err) {
        console.warn('Failed to close AudioContext:', err);
      }
    }
  }
}

// Haptic feedback utilities
export class HapticFeedback {
  private static enabled: boolean = true;

  static setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  static isEnabled(): boolean {
    return this.enabled;
  }

  static isAvailable(): boolean {
    return 'vibrate' in navigator;
  }

  static vibrate(pattern: number | number[]): void {
    if (!this.enabled || !this.isAvailable()) return;

    try {
      navigator.vibrate(pattern);
    } catch (err) {
      console.warn('Vibration failed:', err);
    }
  }

  // Predefined haptic patterns
  static success(): void {
    this.vibrate([50, 50, 100]);
  }

  static error(): void {
    this.vibrate([100, 50, 100, 50, 100]);
  }

  static warning(): void {
    this.vibrate([200, 100, 200]);
  }

  static click(): void {
    this.vibrate(25);
  }

  static longPress(): void {
    this.vibrate([50, 100, 200]);
  }

  static selection(): void {
    this.vibrate(30);
  }

  static notification(): void {
    this.vibrate([100, 50, 100]);
  }

  static scan(): void {
    this.vibrate([50, 50, 50]);
  }

  // Custom patterns for different interactions
  static swipe(): void {
    this.vibrate([40, 20, 40]);
  }

  static gesture(): void {
    this.vibrate([20, 30, 40, 30, 20]);
  }

  static heavy(): void {
    this.vibrate(200);
  }

  static light(): void {
    this.vibrate(20);
  }

  static double(): void {
    this.vibrate([50, 50, 50]);
  }

  static triple(): void {
    this.vibrate([30, 30, 30, 30, 30]);
  }
}

// Device capability detection
export class DeviceCapabilities {
  static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  static isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  static isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
  }

  static isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  static hasCamera(): Promise<boolean> {
    return new Promise(async (resolve) => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideoInput = devices.some(device => device.kind === 'videoinput');
        resolve(hasVideoInput);
      } catch {
        resolve(false);
      }
    });
  }

  static hasMicrophone(): Promise<boolean> {
    return new Promise(async (resolve) => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasAudioInput = devices.some(device => device.kind === 'audioinput');
        resolve(hasAudioInput);
      } catch {
        resolve(false);
      }
    });
  }

  static hasGeolocation(): boolean {
    return 'geolocation' in navigator;
  }

  static hasVibration(): boolean {
    return 'vibrate' in navigator;
  }

  static hasWebAudio(): boolean {
    return 'AudioContext' in window || 'webkitAudioContext' in window;
  }

  static hasSpeechRecognition(): boolean {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  static hasBarcodeDetector(): boolean {
    return 'BarcodeDetector' in window;
  }

  static hasWakeLock(): boolean {
    return 'wakeLock' in navigator;
  }

  static hasWebShare(): boolean {
    return 'share' in navigator;
  }

  static getDeviceMemory(): number {
    return (navigator as any).deviceMemory || 4; // Default to 4GB if not available
  }

  static getConnectionSpeed(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      return connection.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  static isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  static getScreenSize(): { width: number; height: number } {
    return {
      width: window.screen.width,
      height: window.screen.height,
    };
  }

  static getViewportSize(): { width: number; height: number } {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  static getDevicePixelRatio(): number {
    return window.devicePixelRatio || 1;
  }

  static getBatteryLevel(): Promise<number> {
    return new Promise(async (resolve) => {
      try {
        const battery = await (navigator as any).getBattery();
        resolve(battery.level);
      } catch {
        resolve(1); // Default to full battery if not available
      }
    });
  }

  static isOnline(): boolean {
    return navigator.onLine;
  }

  static getPreferredColorScheme(): 'light' | 'dark' {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  static getPreferredReducedMotion(): boolean {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  static getSafeAreaInsets(): { top: number; right: number; bottom: number; left: number } {
    const computedStyle = getComputedStyle(document.documentElement);
    return {
      top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
      right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
      bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
      left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'),
    };
  }

  // Comprehensive capability report
  static async getCapabilityReport(): Promise<{
    device: {
      type: string;
      os: string;
      isTouchDevice: boolean;
      isStandalone: boolean;
      screenSize: { width: number; height: number };
      viewportSize: { width: number; height: number };
      pixelRatio: number;
      memory: number;
      connection: string;
      colorScheme: string;
      reducedMotion: boolean;
      batteryLevel: number;
      isOnline: boolean;
    };
    features: {
      camera: boolean;
      microphone: boolean;
      geolocation: boolean;
      vibration: boolean;
      webAudio: boolean;
      speechRecognition: boolean;
      barcodeDetector: boolean;
      wakeLock: boolean;
      webShare: boolean;
    };
  }> {
    const [hasCamera, hasMicrophone, batteryLevel] = await Promise.all([
      this.hasCamera(),
      this.hasMicrophone(),
      this.getBatteryLevel(),
    ]);

    return {
      device: {
        type: this.isMobile() ? 'mobile' : 'desktop',
        os: this.isIOS() ? 'ios' : this.isAndroid() ? 'android' : 'other',
        isTouchDevice: this.isTouchDevice(),
        isStandalone: this.isStandalone(),
        screenSize: this.getScreenSize(),
        viewportSize: this.getViewportSize(),
        pixelRatio: this.getDevicePixelRatio(),
        memory: this.getDeviceMemory(),
        connection: this.getConnectionSpeed(),
        colorScheme: this.getPreferredColorScheme(),
        reducedMotion: this.getPreferredReducedMotion(),
        batteryLevel,
        isOnline: this.isOnline(),
      },
      features: {
        camera: hasCamera,
        microphone: hasMicrophone,
        geolocation: this.hasGeolocation(),
        vibration: this.hasVibration(),
        webAudio: this.hasWebAudio(),
        speechRecognition: this.hasSpeechRecognition(),
        barcodeDetector: this.hasBarcodeDetector(),
        wakeLock: this.hasWakeLock(),
        webShare: this.hasWebShare(),
      },
    };
  }
}
