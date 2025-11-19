import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/client";
import { pdfTemplateService } from "@/lib/templates/pdfGenerator";
import { htmlTemplateService } from "@/lib/templates/htmlTemplates";
import { jsonExportService } from "@/lib/templates/jsonExporter";
import { settingsService } from "@/server/services/settingsService";
import { TemplateType } from "@/types/templates";
import { logger } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(_request.url);
    const format = url.searchParams.get("format") || "json";
    const templateType = url.searchParams.get("template") as TemplateType || TemplateType.INCIDENT_REPORT;
    const includeEnhanced = url.searchParams.get("includeEnhanced") === "true";

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // JSON Export
    if (format === "json") {
      const jsonData = jsonExportService.exportReport(report, {
        includeEnhancedFields: includeEnhanced,
      });

      return new NextResponse(jsonData, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="report-${id}.json"`,
        },
      });
    }

    // HTML Export (for browser print-to-PDF)
    if (format === "html" || format === "pdf") {
      const settings = await settingsService.getSettings();
      let html: string;

      if (templateType === TemplateType.BLOTTER_ENTRY) {
        const blotterData = pdfTemplateService.mapReportToBlotterData(
          report,
          `BLTR-${new Date().getFullYear()}-${id.slice(-6)}`
        );
        html = htmlTemplateService.generateBlotterEntryHTML(blotterData, settings);
      } else {
        // Default to Incident Report
        const incidentData = pdfTemplateService.mapReportToIncidentData(report);
        html = htmlTemplateService.generateIncidentReportHTML(incidentData, settings);
      }

      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid format. Use 'json' or 'pdf'" },
      { status: 400 }
    );
  } catch (error) {
    logger.error("Failed to export report", { error });
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 }
    );
  }
}
