import { env } from "@/env";
import { logger } from "@/lib/logger";

const WANXIANG_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";

export type ImageGenerationOptions = {
  prompt: string;
  negativePrompt?: string;
  size?: "1024*1024" | "720*1280" | "1280*720";
  n?: number;
  style?: string;
};

export type GeneratedImage = {
  url: string;
  b64Image?: string;
};

export const imageGeneration = {
  async generate(options: ImageGenerationOptions): Promise<GeneratedImage[]> {
    if (!env.ALIBABA_DASHSCOPE_API_KEY) {
      logger.warn("DashScope API key missing, image generation unavailable");
      throw new Error("Image generation not configured");
    }

    const { prompt, negativePrompt, size = "1024*1024", n = 1, style = "auto" } = options;

    try {
      logger.info("Generating image", { prompt, size, count: n });

      const response = await fetch(WANXIANG_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.ALIBABA_DASHSCOPE_API_KEY}`,
          "X-DashScope-Async": "enable"
        },
        body: JSON.stringify({
          model: "wanx-v1",
          input: {
            prompt,
            negative_prompt: negativePrompt || "low quality, blurry, distorted",
            style
          },
          parameters: {
            size,
            n
          }
        })
      });

      if (!response.ok) {
        logger.error("Image generation request failed", { status: response.status });
        throw new Error("Image generation failed");
      }

      const result = (await response.json()) as {
        output?: {
          task_id?: string;
          task_status?: string;
          results?: Array<{ url: string; b64_image?: string }>;
        };
        request_id?: string;
      };

      // Handle async response
      if (result.output?.task_id) {
        logger.info("Image generation task created", { taskId: result.output.task_id });
        
        // Poll for results (simplified - in production, use webhooks)
        const taskId = result.output.task_id;
        const images = await this.pollTaskResult(taskId);
        return images;
      }

      // Handle sync response
      if (result.output?.results) {
        const images = result.output.results.map((img) => ({
          url: img.url,
          b64Image: img.b64_image
        }));
        logger.info("Images generated successfully", { count: images.length });
        return images;
      }

      throw new Error("No images returned from generation");
    } catch (error) {
      logger.error("Image generation error", { error });
      throw error;
    }
  },

  async pollTaskResult(taskId: string, maxAttempts = 10): Promise<GeneratedImage[]> {
    const pollUrl = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds

      try {
        const response = await fetch(pollUrl, {
          headers: {
            Authorization: `Bearer ${env.ALIBABA_DASHSCOPE_API_KEY}`
          }
        });

        if (!response.ok) {
          logger.warn("Failed to poll task status", { taskId, attempt });
          continue;
        }

        const result = (await response.json()) as {
          output?: {
            task_status?: string;
            results?: Array<{ url: string; b64_image?: string }>;
          };
        };

        if (result.output?.task_status === "SUCCEEDED" && result.output.results) {
          const images = result.output.results.map((img) => ({
            url: img.url,
            b64Image: img.b64_image
          }));
          logger.info("Task completed successfully", { taskId, count: images.length });
          return images;
        }

        if (result.output?.task_status === "FAILED") {
          throw new Error("Image generation task failed");
        }

        logger.info("Task still running", { taskId, status: result.output?.task_status, attempt });
      } catch (error) {
        logger.error("Error polling task", { taskId, attempt, error });
      }
    }

    throw new Error("Image generation timeout");
  },

  /**
   * Generate infographic for barangay announcements
   */
  async generateInfographic(text: string, theme = "professional"): Promise<GeneratedImage[]> {
    const prompt = `Create a clean, professional infographic poster for a barangay announcement. 
    Include the following text: "${text}"
    Style: ${theme}, modern, Filipino community aesthetic, clear typography, vibrant colors, organized layout`;

    return this.generate({
      prompt,
      size: "720*1280", // Portrait for announcements
      n: 1,
      style: "auto"
    });
  }
};
