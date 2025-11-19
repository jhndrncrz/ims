import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { recommendationService } from "@/lib/ai/recommendationService";
import { logger } from "@/lib/logger";

/**
 * GET /api/reports/[id]/recommendations
 * Generate AI-powered action recommendations for a report
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid report ID" },
        { status: 400 }
      );
    }

    // Fetch the report with all data
    const report = await prisma.report.findUnique({
      where: { id }
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Generate recommendations
    logger.info("📊 Generating recommendations for report", {
      reportId: id,
      category: report.category,
      severity: report.severity
    });

    const recommendations = await recommendationService.generateRecommendations(report);

    logger.info("✅ Recommendations generated successfully", {
      reportId: id,
      urgencyLevel: recommendations.urgencyLevel,
      recommendationCount: recommendations.recommendations.length,
      actionCount: recommendations.suggestedActions.length
    });

    return NextResponse.json(recommendations);
  } catch (error) {
    logger.error("❌ Error generating recommendations", {
      error: error instanceof Error ? error.message : String(error),
      errorDetails: error
    });

    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
