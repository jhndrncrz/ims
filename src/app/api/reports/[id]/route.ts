import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { toReportDTO } from "@/lib/mappers";
import { reportService } from "@/server/services/reportService";
import { vectorStore } from "@/lib/rag/vector-store";
import { logger } from "@/lib/logger";

const updateSchema = z.object({
  status: z.enum(["OPEN", "ACKNOWLEDGED", "CLOSED"]).optional(),
  resolution: z.string().optional(),
  addToKnowledge: z.boolean().optional(),
  category: z.enum(["INFRASTRUCTURE", "DISASTER", "ADMIN", "OTHER"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    // Fetch the current report
    const currentReport = await reportService.findById(id);
    if (!currentReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Update report with new data
    const updateData: {
      status?: typeof data.status;
      category?: typeof data.category;
      priority?: typeof data.priority;
      resolution?: string;
      resolvedAt?: Date;
      resolvedBy?: string;
      addedToKnowledge?: boolean;
    } = {
      status: data.status,
      category: data.category,
      priority: data.priority,
      resolution: data.resolution
    };

    if (data.status === "CLOSED") {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = "Dashboard User"; // In production, get from auth
    }

    // Add to knowledge base if requested
    if (data.addToKnowledge && data.resolution) {
      updateData.addedToKnowledge = true;
      
      await vectorStore.upsertChunk({
        title: `Report Resolution: ${currentReport.category}`,
        source: `report-${currentReport.id}`,
        content: `Issue: ${currentReport.message}\n\nResolution: ${data.resolution}`,
        tags: [currentReport.category.toLowerCase(), "resolved", "citizen-report"]
      });
    }

    const updatedReport = await reportService.update(id, updateData);

    return NextResponse.json({ report: toReportDTO(updatedReport) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", issues: error.issues }, { status: 400 });
    }
    logger.error("Failed to update report", { error });
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
