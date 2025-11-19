import { NextRequest, NextResponse } from "next/server";
import { settingsService } from "@/server/services/settingsService";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const settings = await settingsService.getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    logger.error("Failed to get settings", { error });
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const settings = await settingsService.updateSettings(body);
    return NextResponse.json(settings);
  } catch (error) {
    logger.error("Failed to update settings", { error });
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
