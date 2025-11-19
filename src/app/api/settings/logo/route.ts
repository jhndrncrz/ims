import { NextRequest, NextResponse } from "next/server";
import { settingsService } from "@/server/services/settingsService";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("logo") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No logo file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PNG and JPEG are allowed" },
        { status: 400 }
      );
    }

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload and update settings
    const settings = await settingsService.uploadLogo(buffer, file.name);

    return NextResponse.json(settings);
  } catch (error) {
    logger.error("Failed to upload logo", { error });
    return NextResponse.json(
      { error: "Failed to upload logo" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const settings = await settingsService.removeLogo();
    return NextResponse.json(settings);
  } catch (error) {
    logger.error("Failed to delete logo", { error });
    return NextResponse.json(
      { error: "Failed to delete logo" },
      { status: 500 }
    );
  }
}
