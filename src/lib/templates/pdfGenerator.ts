import PDFDocument from "pdfkit";
import { BarangaySettings, IncidentReportData, BlotterEntryData } from "@/types/templates";
import { Report } from "@prisma/client";
import fs from "fs";

export class PDFTemplateService {
  private readonly LOGO_PLACEHOLDER_SIZE = 60;
  private readonly PAGE_MARGIN = 50;
  private readonly HEADER_HEIGHT = 100;

  private createDocument(): PDFKit.PDFDocument {
    const doc = new PDFDocument({ 
      size: "LETTER", 
      margin: this.PAGE_MARGIN,
      bufferPages: true
    });
    
    return doc;
  }

  /**
   * Generate a header with barangay logo and information
   */
  private addHeader(doc: PDFKit.PDFDocument, settings: BarangaySettings): void {
    const centerX = doc.page.width / 2;
    let currentY = this.PAGE_MARGIN;

    // Logo (if exists, otherwise placeholder)
    if (settings.logoPath && fs.existsSync(settings.logoPath)) {
      try {
        doc.image(settings.logoPath, this.PAGE_MARGIN, currentY, {
          width: this.LOGO_PLACEHOLDER_SIZE,
          height: this.LOGO_PLACEHOLDER_SIZE,
        });
      } catch {
        this.addLogoPlaceholder(doc, this.PAGE_MARGIN, currentY);
      }
    } else {
      this.addLogoPlaceholder(doc, this.PAGE_MARGIN, currentY);
    }

    // Header text (centered)
    doc
      .fontSize(10)
      .text("Republic of the Philippines", centerX, currentY, { align: "center", width: doc.page.width - 2 * this.PAGE_MARGIN });
    
    currentY += 15;
    doc
      .fontSize(10)
      .text(`Province of ${settings.province}`, centerX, currentY, { align: "center", width: doc.page.width - 2 * this.PAGE_MARGIN });
    
    currentY += 15;
    doc
      .fontSize(10)
      .text(`Municipality/City of ${settings.municipalityCity}`, centerX, currentY, { align: "center", width: doc.page.width - 2 * this.PAGE_MARGIN });
    
    currentY += 15;
    doc
      .fontSize(14)
      .font("Courier-Bold")
      .text(settings.barangayName.toUpperCase(), centerX, currentY, { align: "center", width: doc.page.width - 2 * this.PAGE_MARGIN });
    
    currentY += 20;
    if (settings.address) {
      doc
        .fontSize(9)
        
        .text(settings.address, centerX, currentY, { align: "center", width: doc.page.width - 2 * this.PAGE_MARGIN });
      currentY += 12;
    }
    if (settings.contactNumber) {
      doc
        .fontSize(9)
        .text(`Tel: ${settings.contactNumber}`, centerX, currentY, { align: "center", width: doc.page.width - 2 * this.PAGE_MARGIN });
    }

    // Horizontal line after header
    doc
      .moveTo(this.PAGE_MARGIN, this.PAGE_MARGIN + this.HEADER_HEIGHT)
      .lineTo(doc.page.width - this.PAGE_MARGIN, this.PAGE_MARGIN + this.HEADER_HEIGHT)
      .stroke();
  }

  /**
   * Add a placeholder logo circle
   */
  private addLogoPlaceholder(doc: PDFKit.PDFDocument, x: number, y: number): void {
    const radius = this.LOGO_PLACEHOLDER_SIZE / 2;
    doc
      .circle(x + radius, y + radius, radius)
      .lineWidth(2)
      .strokeColor("#cccccc")
      .stroke();
    
    doc
      .fontSize(8)
      .fillColor("#999999")
      .text("LOGO", x, y + radius - 4, { width: this.LOGO_PLACEHOLDER_SIZE, align: "center" });
    
    doc.fillColor("#000000"); // Reset color
  }

  /**
   * Generate Incident Report PDF
   */
  async generateIncidentReport(
    data: IncidentReportData,
    settings: BarangaySettings
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = this.createDocument();
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      this.addHeader(doc, settings);

      let y = this.PAGE_MARGIN + this.HEADER_HEIGHT + 30;

      // Title
      doc
        .fontSize(16)
        .font("Courier-Bold")
        .text("INCIDENT REPORT", this.PAGE_MARGIN, y, { align: "center" });
      
      y += 40;

      // Report Details
      doc.fontSize(11);

      this.addField(doc, "Report ID:", data.reportId, y);
      y += 20;
      
      this.addField(doc, "Date Reported:", data.dateReported.toLocaleString("en-PH", { 
        dateStyle: "long", 
        timeStyle: "short" 
      }), y);
      y += 20;

      this.addField(doc, "Reported By:", data.reportedBy, y);
      y += 20;

      this.addField(doc, "Contact Number:", data.contactNumber, y);
      y += 30;

      // Incident Details Section
      doc.fontSize(12).font("Courier-Bold").text("INCIDENT DETAILS", this.PAGE_MARGIN, y);
      y += 25;
      doc.fontSize(11);

      this.addField(doc, "Type:", data.incidentType || "Not specified", y);
      y += 20;

      this.addField(doc, "Severity:", data.severity || "Not specified", y);
      y += 20;

      this.addField(doc, "Location:", data.location || "Not specified", y);
      y += 20;

      this.addField(doc, "Date/Time of Incident:", data.dateTimeOfIncident || "Not specified", y);
      y += 30;

      // Description
      doc.fontSize(10).font("Courier-Bold").text("Description:", this.PAGE_MARGIN, y);
      y += 15;
      doc.fontSize(10).text(data.description, this.PAGE_MARGIN + 20, y, {
        width: doc.page.width - 2 * this.PAGE_MARGIN - 20,
        align: "justify",
      });
      y += doc.heightOfString(data.description, { width: doc.page.width - 2 * this.PAGE_MARGIN - 20 }) + 20;

      // Action Taken
      doc.fontSize(10).font("Courier-Bold").text("Action Taken:", this.PAGE_MARGIN, y);
      y += 15;
      doc.fontSize(10).text(data.actionTaken || "Pending", this.PAGE_MARGIN + 20, y, {
        width: doc.page.width - 2 * this.PAGE_MARGIN - 20,
      });
      y += doc.heightOfString(data.actionTaken || "Pending", { width: doc.page.width - 2 * this.PAGE_MARGIN - 20 }) + 20;

      // Status Section
      doc.fontSize(12).font("Courier-Bold").text("STATUS INFORMATION", this.PAGE_MARGIN, y);
      y += 25;
      doc.fontSize(11);

      this.addField(doc, "Status:", data.status, y);
      y += 20;

      this.addField(doc, "Priority:", data.priority, y);
      y += 20;

      if (data.sentiment) {
        this.addField(doc, "Sentiment:", `${data.sentiment} (${(data.sentimentScore! * 100).toFixed(0)}%)`, y);
      }

      // Footer
      this.addFooter(doc, settings);

      doc.end();
    });
  }

  /**
   * Generate Blotter Entry PDF
   */
  async generateBlotterEntry(
    data: BlotterEntryData,
    settings: BarangaySettings
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = this.createDocument();
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      this.addHeader(doc, settings);

      let y = this.PAGE_MARGIN + this.HEADER_HEIGHT + 30;

      // Title
      doc
        .fontSize(16)
        .font("Courier-Bold")
        .text("BARANGAY BLOTTER ENTRY", this.PAGE_MARGIN, y, { align: "center" });
      
      y += 40;

      doc.fontSize(11);

      this.addField(doc, "Blotter No.:", data.blotterNumber, y);
      y += 20;

      this.addField(doc, "Date Recorded:", data.dateReported.toLocaleString("en-PH", { 
        dateStyle: "long", 
        timeStyle: "short" 
      }), y);
      y += 30;

      // Complainant Section
      doc.fontSize(12).font("Courier-Bold").text("COMPLAINANT INFORMATION", this.PAGE_MARGIN, y);
      y += 25;
      doc.fontSize(11);

      this.addField(doc, "Name:", data.complainant, y);
      y += 20;

      this.addField(doc, "Address:", data.complainantAddress, y);
      y += 20;

      this.addField(doc, "Contact:", data.complainantContact, y);
      y += 30;

      // Respondent Section (if provided)
      if (data.respondent) {
        doc.fontSize(12).font("Courier-Bold").text("RESPONDENT", this.PAGE_MARGIN, y);
        y += 25;
        doc.fontSize(11);
        
        this.addField(doc, "Name:", data.respondent, y);
        y += 30;
      }

      // Incident Section
      doc.fontSize(12).font("Courier-Bold").text("INCIDENT DETAILS", this.PAGE_MARGIN, y);
      y += 25;
      doc.fontSize(11);

      this.addField(doc, "Date of Incident:", data.incidentDate, y);
      y += 20;

      this.addField(doc, "Location:", data.incidentLocation, y);
      y += 20;

      this.addField(doc, "Nature of Incident:", data.incidentNature, y);
      y += 30;

      // Incident Details
      doc.fontSize(10).font("Courier-Bold").text("Details:", this.PAGE_MARGIN, y);
      y += 15;
      doc.fontSize(10).text(data.incidentDetails, this.PAGE_MARGIN + 20, y, {
        width: doc.page.width - 2 * this.PAGE_MARGIN - 20,
        align: "justify",
      });
      y += doc.heightOfString(data.incidentDetails, { width: doc.page.width - 2 * this.PAGE_MARGIN - 20 }) + 20;

      // Action Taken
      doc.fontSize(10).font("Courier-Bold").text("Action Taken:", this.PAGE_MARGIN, y);
      y += 15;
      doc.fontSize(10).text(data.actionTaken, this.PAGE_MARGIN + 20, y, {
        width: doc.page.width - 2 * this.PAGE_MARGIN - 20,
      });
      y += doc.heightOfString(data.actionTaken, { width: doc.page.width - 2 * this.PAGE_MARGIN - 20 }) + 20;

      this.addField(doc, "Status:", data.status, y);
      y += 30;

      // Signatures
      y = doc.page.height - 150;
      doc.fontSize(10);
      
      const leftX = this.PAGE_MARGIN + 50;
      const rightX = doc.page.width - this.PAGE_MARGIN - 150;

      doc.text("_____________________", leftX, y);
      doc.text("_____________________", rightX, y);
      y += 15;
      doc.text("Recorded By", leftX, y);
      doc.text("Barangay Captain", rightX, y);

      // Footer
      this.addFooter(doc, settings);

      doc.end();
    });
  }

  /**
   * Helper to add a field with label and value
   */
  private addField(doc: PDFKit.PDFDocument, label: string, value: string, y: number): void {
    doc
      .font("Courier-Bold")
      .text(label, this.PAGE_MARGIN, y, { continued: true, width: 150 })
      
      .text(value, { width: doc.page.width - this.PAGE_MARGIN - 150 });
  }

  /**
   * Add footer with timestamp
   */
  private addFooter(doc: PDFKit.PDFDocument, settings: BarangaySettings): void {
    const footerY = doc.page.height - 40;
    doc
      .fontSize(8)
      .fillColor("#666666")
      .text(
        `Generated by ${settings.barangayName} SMS Hub on ${new Date().toLocaleString("en-PH")}`,
        this.PAGE_MARGIN,
        footerY,
        { align: "center", width: doc.page.width - 2 * this.PAGE_MARGIN }
      );
    doc.fillColor("#000000");
  }

  /**
   * Convert Report to IncidentReportData
   */
  mapReportToIncidentData(report: Report): IncidentReportData {
    return {
      reportId: report.id,
      dateReported: report.createdAt,
      reportedBy: report.phoneNumber,
      contactNumber: report.phoneNumber,
      incidentType: report.incidentType || report.category,
      severity: report.severity || report.priority,
      location: report.extractedLocation || "Not specified",
      dateTimeOfIncident: report.extractedTime || "Not specified",
      description: report.message,
      actionTaken: report.resolution || "Pending investigation",
      status: report.status,
      priority: report.priority,
      sentiment: report.sentiment || undefined,
      sentimentScore: report.sentimentScore || undefined,
    };
  }

  /**
   * Convert Report to BlotterEntryData
   */
  mapReportToBlotterData(report: Report, blotterNumber: string): BlotterEntryData {
    return {
      blotterNumber,
      dateReported: report.createdAt,
      complainant: report.phoneNumber,
      complainantAddress: report.extractedLocation || "Not specified",
      complainantContact: report.phoneNumber,
      incidentDate: report.extractedTime || new Date().toLocaleDateString("en-PH"),
      incidentLocation: report.extractedLocation || "Not specified",
      incidentNature: report.incidentType || report.category,
      incidentDetails: report.message,
      actionTaken: report.resolution || "Under investigation",
      status: report.status,
      recordedBy: "Barangay Officer",
    };
  }
}

export const pdfTemplateService = new PDFTemplateService();
