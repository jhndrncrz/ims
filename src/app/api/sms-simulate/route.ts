import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import https from "https";

const requestSchema = z.object({
  message: z.string().min(1, "Message is required"),
  phoneNumber: z.string().optional()
});

// Helper function to make HTTPS request with custom timeout
function httpsPost(url: string, data: any, timeoutMs: number): Promise<any> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
        "User-Agent": "BarangayAI-SMS-Simulator"
      },
      timeout: timeoutMs
    };

    const req = https.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    });

    req.write(postData);
    req.end();
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, phoneNumber } = requestSchema.parse(body);

    console.log("Sending to n8n webhook:", { message, phoneNumber });

    const startTime = Date.now();
    
    try {
      // Use custom HTTPS function with 60 second timeout
      const result = await httpsPost(
        "https://n8n.humain.ph/webhook-test/c8b87bcf-e39d-4d83-9b5e-bb989c70233b",
        { message, phoneNumber },
        60000 // 60 second timeout
      );

      const elapsed = Date.now() - startTime;
      console.log(`n8n response status: ${result.status} (took ${elapsed}ms)`);

      if (result.status !== 200) {
        console.error("n8n error response:", result.data);
        throw new Error(`n8n webhook failed (${result.status}): ${JSON.stringify(result.data)}`);
      }

      console.log("n8n response data:", result.data);

      return NextResponse.json({
        success: true,
        data: result.data,
        responseTime: elapsed
      });
    } catch (fetchError) {
      const elapsed = Date.now() - startTime;
      console.error(`Request failed after ${elapsed}ms:`, fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error("Error in SMS simulate:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isNetworkError = errorMessage.includes("fetch failed") || 
                          errorMessage.includes("ECONNREFUSED") ||
                          errorMessage.includes("timeout") ||
                          errorMessage.includes("ETIMEDOUT") ||
                          errorMessage.includes("ENOTFOUND");

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        isNetworkError,
        hint: isNetworkError ? "Please check your internet connection or VPN settings" : undefined
      },
      { status: isNetworkError ? 503 : 500 }
    );
  }
}
