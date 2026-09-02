import { geminiAI, generateContentWithRetry } from "./geminiService";

export type AiProviderType = "local_llm" | "ollama" | "gemini";

export interface AiGenerationOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
}

export interface AiProviderStatus {
  activeProvider: AiProviderType;
  localLlmOnline: boolean;
  localModelName: string;
  cloudModelName: string;
}

// Environment Configurations
const AI_PROVIDER: AiProviderType = (process.env.AI_PROVIDER as AiProviderType) || "local_llm";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5-coder:3b";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

/**
 * Check if the local Ollama / OpenAI-compatible endpoint is healthy and online
 */
export const checkLocalLlmHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);

    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    return res.ok;
  } catch {
    return false;
  }
};

/**
 * Get current status of AI Providers (used by dashboard indicators)
 */
export const getAiProviderStatus = async (): Promise<AiProviderStatus> => {
  const localOnline = await checkLocalLlmHealth();
  return {
    activeProvider: AI_PROVIDER === "local_llm" && !localOnline ? "gemini" : AI_PROVIDER,
    localLlmOnline: localOnline,
    localModelName: OLLAMA_MODEL,
    cloudModelName: GEMINI_MODEL,
  };
};

/**
 * Pre-warm the local model in GPU VRAM permanently (keep_alive: -1)
 */
export const warmupLocalModel = async (): Promise<void> => {
  try {
    console.log(`[AI Provider] Pre-warming GPU model (${OLLAMA_MODEL}) into VRAM...`);
    await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: "ready",
        stream: false,
        keep_alive: -1, // Keep resident in GPU VRAM indefinitely
        options: { num_predict: 1, num_ctx: 2048 },
      }),
    });
    console.log(`[AI Provider] GPU Model (${OLLAMA_MODEL}) successfully pre-warmed in VRAM!`);
  } catch (err: any) {
    console.warn(`[AI Provider] Could not pre-warm model: ${err.message}`);
  }
};

/**
 * Query Local Ollama LLM via standard API with JSON format
 */
const queryLocalLlm = async (
  prompt: string,
  options?: AiGenerationOptions
): Promise<string> => {
  const model = options?.model || OLLAMA_MODEL;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 18000); // 18s fast timeout

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        keep_alive: -1, // Never unload from GPU memory
        format: options?.responseMimeType === "application/json" ? "json" : undefined,
        options: {
          temperature: options?.temperature ?? 0.2,
          num_predict: options?.maxOutputTokens ?? 450,
          num_ctx: 2048,
          num_thread: 6,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Local LLM responded with HTTP ${res.status}: ${errorText}`);
    }

    const data = (await res.json()) as { response?: string };
    return data.response || "";
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
};

/**
 * Clean JSON output from potential markdown ticks (```json ... ```)
 */
export const cleanJsonOutput = (raw: string): string => {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "");
    cleaned = cleaned.replace(/\n?```$/, "");
  }
  return cleaned.trim();
};

/**
 * Central Structured JSON Generator
 * Tries the selected provider first, and automatically falls back to secondary provider if needed
 */
export const generateStructuredJson = async <T = any>(
  prompt: string,
  options?: AiGenerationOptions
): Promise<T> => {
  const isLocalPreferred = AI_PROVIDER === "local_llm" || AI_PROVIDER === "ollama";

  // 1. If Local LLM is preferred, try it first
  if (isLocalPreferred) {
    try {
      console.log(`[AI Provider] Querying Local Open-Source Model (${OLLAMA_MODEL})...`);
      const rawText = await queryLocalLlm(prompt, {
        ...options,
        responseMimeType: "application/json",
      });

      if (rawText && rawText.trim()) {
        const cleaned = cleanJsonOutput(rawText);
        const parsed = JSON.parse(cleaned);
        console.log(`[AI Provider] Local Model (${OLLAMA_MODEL}) responded successfully!`);
        return parsed as T;
      }
    } catch (localError: any) {
      console.warn(
        `[AI Provider] Local LLM (${OLLAMA_MODEL}) failed or offline (${localError.message}). Falling back to Gemini Cloud...`
      );
    }
  }

  // 2. Cloud Fallback: Google Gemini
  console.log(`[AI Provider] Querying Gemini Cloud (${GEMINI_MODEL})...`);
  const response = await generateContentWithRetry(geminiAI, {
    model: options?.model || GEMINI_MODEL,
    contents: prompt.trim(),
    config: {
      responseMimeType: "application/json",
      temperature: options?.temperature ?? 0.2,
      maxOutputTokens: options?.maxOutputTokens ?? 1200,
    },
  });

  const rawText = response.text || "";
  if (!rawText.trim()) {
    throw new Error("Gemini Cloud returned empty response");
  }

  const cleaned = cleanJsonOutput(rawText);
  return JSON.parse(cleaned) as T;
};
