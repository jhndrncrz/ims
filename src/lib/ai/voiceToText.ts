import { env } from "@/env";
import { logger } from "@/lib/logger";

const ALIBABA_ASR_URL = "https://nls-gateway.cn-shanghai.aliyuncs.com/stream/v1/asr";

export type VoiceToTextOptions = {
  audioBuffer: Buffer;
  format?: "pcm" | "wav" | "mp3" | "opus";
  sampleRate?: number;
  language?: "zh-CN" | "en-US";
};

export const voiceToText = {
  async transcribe(options: VoiceToTextOptions): Promise<string> {
    if (!env.ALIBABA_DASHSCOPE_API_KEY) {
      logger.warn("DashScope API key missing, voice transcription unavailable");
      throw new Error("Voice transcription not configured");
    }

    try {
      const { audioBuffer, format = "wav", sampleRate = 16000, language = "zh-CN" } = options;

      // Using Alibaba Cloud Speech Recognition
      const response = await fetch(ALIBABA_ASR_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.ALIBABA_DASHSCOPE_API_KEY}`
        },
        body: JSON.stringify({
          model: "paraformer-v1",
          input: {
            audio: audioBuffer.toString("base64"),
            format,
            sample_rate: sampleRate,
            language
          },
          parameters: {
            enable_punctuation_prediction: true,
            enable_inverse_text_normalization: true
          }
        })
      });

      if (!response.ok) {
        logger.error("Voice transcription failed", { status: response.status });
        throw new Error("Transcription request failed");
      }

      const result = (await response.json()) as {
        output?: { text?: string };
        code?: string;
        message?: string;
      };

      if (result.code && result.code !== "200") {
        logger.error("Voice transcription error", { code: result.code, message: result.message });
        throw new Error(`Transcription failed: ${result.message}`);
      }

      const transcript = result.output?.text || "";

      if (!transcript) {
        logger.warn("Empty transcription result");
        throw new Error("No transcription text returned");
      }

      logger.info("Voice transcription successful", { textLength: transcript.length });
      return transcript;
    } catch (error) {
      logger.error("Voice transcription error", { error });
      throw error;
    }
  }
};
