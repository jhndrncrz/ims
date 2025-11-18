import Core from "@alicloud/pop-core";

import { env } from "@/env";
import { logger } from "@/lib/logger";

const client =
  env.ALIBABA_SMS_ACCESS_KEY_ID && env.ALIBABA_SMS_ACCESS_KEY_SECRET
    ? new Core({
        accessKeyId: env.ALIBABA_SMS_ACCESS_KEY_ID,
        accessKeySecret: env.ALIBABA_SMS_ACCESS_KEY_SECRET,
        endpoint: "https://dysmsapi.aliyuncs.com",
        apiVersion: "2017-05-25"
      })
    : null;

export type SMSPayload = {
  phoneNumber: string;
  message: string;
  templateParams?: Record<string, string>;
};

export const smsClient = {
  async send({ phoneNumber, message, templateParams }: SMSPayload) {
    if (!client) {
      logger.warn("SMS client not configured; skipping SMS send", { phoneNumber, message });
      throw new Error("SMS client not configured. Please set ALIBABA_SMS_ACCESS_KEY_ID and ALIBABA_SMS_ACCESS_KEY_SECRET");
    }

    if (!env.ALIBABA_SMS_SIGN_NAME || !env.ALIBABA_SMS_TEMPLATE_CODE) {
      logger.warn("SMS sign name or template code not configured", { phoneNumber, message });
      throw new Error("SMS sign name or template code not configured");
    }

    const params = {
      RegionId: "ap-southeast-1",
      PhoneNumbers: phoneNumber,
      SignName: env.ALIBABA_SMS_SIGN_NAME,
      TemplateCode: env.ALIBABA_SMS_TEMPLATE_CODE,
      TemplateParam: JSON.stringify({ message, ...(templateParams ?? {}) })
    };

    try {
      logger.info("Sending SMS via Alibaba Cloud", { phoneNumber, signName: params.SignName, templateCode: params.TemplateCode });
      const result = await client.request("SendSms", params, { method: "POST" }) as { RequestId: string; Message: string };
      logger.info("SMS sent successfully", { phoneNumber, requestId: result.RequestId });
      return result;
    } catch (error) {
      logger.error("Failed to send SMS via Alibaba Cloud", { error, phoneNumber });
      throw error;
    }
  }
};
