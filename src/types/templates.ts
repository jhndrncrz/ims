export enum TemplateType {
  INCIDENT_REPORT = "INCIDENT_REPORT",
  BLOTTER_ENTRY = "BLOTTER_ENTRY",
  CERTIFICATE_OF_INDIGENCY = "CERTIFICATE_OF_INDIGENCY",
  BARANGAY_CLEARANCE = "BARANGAY_CLEARANCE",
}

export interface BarangaySettings {
  id: string;
  barangayName: string;
  municipalityCity: string;
  province: string;
  captainName: string | null;
  logoPath: string | null;
  contactNumber: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentReportData {
  reportId: string;
  dateReported: Date;
  reportedBy: string;
  contactNumber: string;
  incidentType: string;
  severity: string;
  location: string;
  dateTimeOfIncident: string;
  description: string;
  actionTaken: string;
  status: string;
  priority: string;
  sentiment?: string;
  sentimentScore?: number;
}

export interface BlotterEntryData {
  blotterNumber: string;
  dateReported: Date;
  complainant: string;
  complainantAddress: string;
  complainantContact: string;
  respondent?: string;
  incidentDate: string;
  incidentLocation: string;
  incidentNature: string;
  incidentDetails: string;
  actionTaken: string;
  status: string;
  recordedBy: string;
}

export interface ExportOptions {
  format?: "pdf" | "json";
  templateType?: TemplateType;
  includeEnhancedFields?: boolean;
}
