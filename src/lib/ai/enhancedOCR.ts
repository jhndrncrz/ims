import { env } from "@/env";
import { logger } from "@/lib/logger";
import Tesseract from "tesseract.js";

const ALIBABA_OCR_URL = "https://ocr-api.cn-shanghai.aliyuncs.com";

export type OCROptions = {
  imageBuffer: Buffer;
  language?: "en" | "zh" | "multi";
  enhanced?: boolean;
};

export const enhancedOCR = {
  /**
   * Use Alibaba Cloud OCR for better accuracy
   */
  async alibabaOCR(options: OCROptions): Promise<string> {
    if (!env.ALIBABA_DASHSCOPE_API_KEY) {
      logger.warn("Alibaba OCR not configured, falling back to Tesseract");
      return this.tesseractOCR(options);
    }

    try {
      const { imageBuffer, language = "multi" } = options;

      const response = await fetch(`${ALIBABA_OCR_URL}/general/recognize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.ALIBABA_DASHSCOPE_API_KEY}`
        },
        body: JSON.stringify({
          image: imageBuffer.toString("base64"),
          language,
          configure: {
            output_char_info: false,
            output_table: false
          }
        })
      });

      if (!response.ok) {
        logger.warn("Alibaba OCR failed, falling back to Tesseract", { status: response.status });
        return this.tesseractOCR(options);
      }

      const result = (await response.json()) as {
        data?: {
          content?: string;
          prism_wnum?: Array<{ word: string }>;
        };
      };

      const text = result.data?.content || result.data?.prism_wnum?.map((w) => w.word).join(" ") || "";

      if (!text) {
        logger.warn("Empty OCR result from Alibaba, falling back to Tesseract");
        return this.tesseractOCR(options);
      }

      logger.info("Alibaba OCR successful", { textLength: text.length });
      return text;
    } catch (error) {
      logger.error("Alibaba OCR error, falling back to Tesseract", { error });
      return this.tesseractOCR(options);
    }
  },

  /**
   * Fallback to Tesseract.js for offline OCR
   */
  async tesseractOCR(options: OCROptions): Promise<string> {
    const { imageBuffer, language = "en" } = options;

    try {
      logger.info("Using Tesseract OCR");

      const languageMap: Record<string, string> = {
        en: "eng",
        zh: "chi_sim",
        multi: "eng+chi_sim"
      };

      const {
        data: { text }
      } = await Tesseract.recognize(imageBuffer, languageMap[language] || "eng");

      logger.info("Tesseract OCR successful", { textLength: text.length });
      return text;
    } catch (error) {
      logger.error("Tesseract OCR error", { error });
      throw new Error("OCR processing failed");
    }
  },

  /**
   * Smart OCR with automatic fallback
   */
  async extract(options: OCROptions): Promise<string> {
    const { enhanced = true } = options;

    if (enhanced && env.ALIBABA_DASHSCOPE_API_KEY) {
      return this.alibabaOCR(options);
    }

    return this.tesseractOCR(options);
  }
};
