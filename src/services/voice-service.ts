/**
 * Advanced Voice Service with Speech Recognition and Synthesis
 * Bleeding-edge voice interaction capabilities
 */

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface VoiceSettings {
  language: string;
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
}

export class VoiceService {
  private recognition: any | null = null;
  private synthesis: SpeechSynthesis;
  private isListening = false;
  private settings: VoiceSettings = {
    language: 'en-US',
    voice: '',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  };

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = this.settings.language;
    }
  }

  async startListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      this.isListening = true;
      let finalTranscript = '';

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        // Emit interim results for live feedback
        this.dispatchEvent('interim', interimTranscript);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        resolve(finalTranscript);
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.start();
    });
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  async speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!text.trim()) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.settings.language;
      utterance.rate = this.settings.rate;
      utterance.pitch = this.settings.pitch;
      utterance.volume = this.settings.volume;

      if (this.settings.voice) {
        const voices = this.synthesis.getVoices();
        const selectedVoice = voices.find(v => v.name === this.settings.voice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));

      this.synthesis.speak(utterance);
    });
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  updateSettings(settings: Partial<VoiceSettings>) {
    this.settings = { ...this.settings, ...settings };
    if (this.recognition) {
      this.recognition.lang = this.settings.language;
    }
  }

  get isSupported(): boolean {
    return !!(this.recognition && this.synthesis);
  }

  get currentlyListening(): boolean {
    return this.isListening;
  }

  private dispatchEvent(type: string, data: any) {
    window.dispatchEvent(new CustomEvent(`voice-${type}`, { detail: data }));
  }
}

export const voiceService = new VoiceService();
