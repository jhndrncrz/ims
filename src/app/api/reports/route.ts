import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { formatPhone } from "@/lib/formatters";
import { classifyReport } from "@/lib/reporting/classifier";
import { toReportDTO } from "@/lib/mappers";
import { reportService } from "@/server/services/reportService";

export async function GET() {
  const reports = await reportService.list();
  return NextResponse.json({ reports: reports.map(toReportDTO) });
}

const createReportSchema = z.object({
  phoneNumber: z.string().min(8, "Phone number is required"),
  message: z.string().min(10, "Please describe the report"),
  attachmentsUri: z.string().url().optional()
});

export async function POST(request: NextRequest) {
  const data = createReportSchema.parse(await request.json());
  const normalizedPhone = formatPhone(data.phoneNumber);
  const classification = await classifyReport(data.message);

  const report = await reportService.create({
    phoneNumber: normalizedPhone,
    message: data.message,
    category: classification.category,
    priority: classification.priority,
    aiReply: "Report logged via dashboard form.",
    confidence: classification.confidence,
    attachmentsUri: data.attachmentsUri,
    source: "dashboard"
  });

  return NextResponse.json({ report: toReportDTO(report) }, { status: 201 });
}
