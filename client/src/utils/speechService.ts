/**
 * Web Speech API Service for Text-to-Speech (TTS) and Speech-to-Text (STT)
 */

export const isSpeechSynthesisSupported = (): boolean => {
  return typeof window !== "undefined" && "speechSynthesis" in window;
};

export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );
};

let currentUtterance: SpeechSynthesisUtterance | null = null;

export const speakText = (
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): void => {
  if (!isSpeechSynthesisSupported()) {
    console.warn("SpeechSynthesis is not supported in this browser.");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Strip markdown formatting for cleaner audio reading
  const sanitizedText = text
    .replace(/```[\s\S]*?```/g, " code block omitted ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_~>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!sanitizedText) return;

  const utterance = new SpeechSynthesisUtterance(sanitizedText);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.lang = "en-US";

  // Pick natural voice if available
  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.includes("Natural") ||
        v.name.includes("Google") ||
        v.name.includes("Samantha") ||
        v.name.includes("Alex"))
  );
  if (naturalVoice) {
    utterance.voice = naturalVoice;
  }

  utterance.onstart = () => {
    currentUtterance = utterance;
    if (onStart) onStart();
  };

  utterance.onend = () => {
    currentUtterance = null;
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    currentUtterance = null;
    if (onError) onError(e);
  };

  window.speechSynthesis.speak(utterance);
};

export const isCurrentlySpeaking = (): boolean => {
  return Boolean(currentUtterance);
};

export const stopSpeaking = (): void => {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
};

/**
 * Speech Recognition Wrapper with Multi-Language and Real-time Interim Support
 */
export class SpeechRecognizer {
  private recognition: any = null;
  private isRunning: boolean = false;
  private onTranscriptCallback: (finalText: string, interimText: string) => void;
  private onErrorCallback?: (errMsg: string) => void;
  private onStateChangeCallback?: (listening: boolean) => void;
  private lang: string = "az-AZ"; // Default to Azerbaijani or English

  constructor(
    onTranscript: (finalText: string, interimText: string) => void,
    onError?: (errMsg: string) => void,
    onStateChange?: (listening: boolean) => void,
    lang: string = "az-AZ"
  ) {
    this.onTranscriptCallback = onTranscript;
    this.onErrorCallback = onError;
    this.onStateChangeCallback = onStateChange;
    this.lang = lang;

    if (isSpeechRecognitionSupported()) {
      const SpeechRecognitionConstructor =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      this.recognition = new SpeechRecognitionConstructor();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.lang;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const transcript = item[0]?.transcript || "";
          if (item.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        this.onTranscriptCallback(finalTranscript, interimTranscript);
      };

      this.recognition.onerror = (event: any) => {
        const errType = event.error || "unknown";
        console.warn("Speech Recognition Error:", errType);

        let userMsg = "Nitq tanınmasında xəta baş verdi.";
        if (errType === "not-allowed" || errType === "service-not-allowed") {
          userMsg = "Mikrofona girişə icazə verilməyib. Brauzerin ünvan sətrindəki kamera/mikrofon ikonundan icazə verin.";
        } else if (errType === "no-speech") {
          userMsg = "Səs eşidilmədi. Zəhmət olmasa mikrofona aydın danışın.";
        } else if (errType === "network") {
          userMsg = "Səs tanıma şəbəkə xətası. İnternet bağlantınızı yoxlayın.";
        }

        if (this.onErrorCallback) this.onErrorCallback(userMsg);

        if (errType !== "no-speech") {
          this.stop();
        }
      };

      this.recognition.onend = () => {
        // If still supposed to be running (e.g. Chrome stopped on brief silence), try to restart
        if (this.isRunning) {
          try {
            this.recognition.start();
            return;
          } catch {
            this.isRunning = false;
          }
        }
        this.isRunning = false;
        if (this.onStateChangeCallback) this.onStateChangeCallback(false);
      };
    }
  }

  public setLanguage(lang: string) {
    this.lang = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public async start(): Promise<{ success: boolean; error?: string }> {
    if (!isSpeechRecognitionSupported()) {
      return {
        success: false,
        error: "Brauzeriniz Speech Recognition dəstəkləmir. Chrome və ya Edge istifadə edin.",
      };
    }

    // Explicitly test getUserMedia permission
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (err: any) {
        return {
          success: false,
          error: "Mikrofon icazəsi bloklanıb! Zəhmət olmasa brauzerin ünvan sətrindən mikrofon icazəsini aktiv edin.",
        };
      }
    }

    if (this.isRunning) return { success: true };

    try {
      this.recognition.start();
      this.isRunning = true;
      if (this.onStateChangeCallback) this.onStateChangeCallback(true);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: String(err?.message || "Mikrofonu başladarkən xəta baş verdi."),
      };
    }
  }

  public stop(): void {
    this.isRunning = false;
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch {
      // Ignore
    }
    if (this.onStateChangeCallback) this.onStateChangeCallback(false);
  }

  public get active(): boolean {
    return this.isRunning;
  }
}
