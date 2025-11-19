import { BarangaySettings, IncidentReportData, BlotterEntryData } from "@/types/templates";

export class HTMLTemplateService {
  /**
   * Generate HTML for Incident Report
   */
  generateIncidentReportHTML(data: IncidentReportData, settings: BarangaySettings): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Incident Report - ${data.reportId}</title>
  <style>
    @media print {
      /* Force backgrounds and borders to print */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      @page {
        size: letter;
        margin: 0.5in;
      }
      body {
        margin: 0;
        padding: 0;
      }
    }
    
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #333;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header-logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 10px;
      border: 2px solid #ccc;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
    }
    
    .header-text {
      margin: 5px 0;
      line-height: 1.4;
    }
    
    .header-line {
      font-size: 11pt;
      margin: 3px 0;
    }
    
    .barangay-name {
      font-size: 16pt;
      font-weight: bold;
      margin: 10px 0;
    }
    
    .document-title {
      font-size: 18pt;
      font-weight: bold;
      text-align: center;
      margin: 30px 0 20px;
      text-transform: uppercase;
    }
    
    .section {
      margin-bottom: 25px;
    }
    
    .section-title {
      font-size: 13pt;
      font-weight: bold;
      background: #f0f0f0;
      padding: 8px 12px;
      margin-bottom: 15px;
      border-left: 4px solid #333;
    }
    
    .field-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
    }
    
    .field {
      margin-bottom: 12px;
    }
    
    .field-label {
      font-weight: bold;
      font-size: 10pt;
      color: #666;
      margin-bottom: 3px;
    }
    
    .field-value {
      font-size: 11pt;
      padding: 5px;
      background: #fafafa;
      border-radius: 3px;
    }
    
    .field-full {
      grid-column: 1 / -1;
    }
    
    .description-box {
      background: #fafafa;
      padding: 15px;
      border-radius: 5px;
      border: 1px solid #ddd;
      margin-top: 10px;
      white-space: pre-wrap;
      font-size: 11pt;
      line-height: 1.7;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 9pt;
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .badge-critical { background: #fee; color: #c00; }
    .badge-high { background: #fed; color: #c60; }
    .badge-medium { background: #ffd; color: #960; }
    .badge-low { background: #efe; color: #060; }
    
    .badge-negative { background: #fee; color: #c00; }
    .badge-neutral { background: #eef; color: #666; }
    .badge-positive { background: #efe; color: #060; }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 9pt;
      color: #666;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    
    td {
      padding: 8px;
      vertical-align: top;
    }
    
    .no-print {
      text-align: center;
      margin: 20px 0;
    }
    
    .print-button {
      background: #007bff;
      color: white;
      border: none;
      padding: 12px 30px;
      font-size: 14pt;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
    }
    
    .print-button:hover {
      background: #0056b3;
    }
    
    @media print {
      /* Force backgrounds and borders to print */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="print-button" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <div class="header">
    <div class="header-logo">
      ${settings.logoPath 
        ? `<img src="/api/uploads/${settings.logoPath.replace(/^uploads\//, '')}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;" />`
        : `<span style="color: #999; font-size: 10pt;">LOGO</span>`
      }
    </div>
    <div class="header-text">
      <div class="header-line">Republic of the Philippines</div>
      <div class="header-line">Province of ${settings.province}</div>
      <div class="header-line">Municipality/City of ${settings.municipalityCity}</div>
      <div class="barangay-name">${settings.barangayName.toUpperCase()}</div>
      ${settings.address ? `<div class="header-line" style="font-size: 10pt;">${settings.address}</div>` : ''}
      ${settings.contactNumber ? `<div class="header-line" style="font-size: 10pt;">Tel: ${settings.contactNumber}</div>` : ''}
    </div>
  </div>

  <div class="document-title">Incident Report</div>

  <div class="section">
    <div class="field-group">
      <div class="field">
        <div class="field-label">Report ID</div>
        <div class="field-value">${data.reportId}</div>
      </div>
      <div class="field">
        <div class="field-label">Date Reported</div>
        <div class="field-value">${data.dateReported.toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' })}</div>
      </div>
      <div class="field">
        <div class="field-label">Reported By</div>
        <div class="field-value">${data.reportedBy}</div>
      </div>
      <div class="field">
        <div class="field-label">Contact Number</div>
        <div class="field-value">${data.contactNumber}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Incident Details</div>
    <div class="field-group">
      <div class="field">
        <div class="field-label">Type</div>
        <div class="field-value">${data.incidentType || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Severity</div>
        <div class="field-value">
          <span class="badge badge-${(data.severity || 'LOW').toLowerCase()}">${data.severity || 'Not specified'}</span>
        </div>
      </div>
      <div class="field">
        <div class="field-label">Location</div>
        <div class="field-value">${data.location || 'Not specified'}</div>
      </div>
      <div class="field">
        <div class="field-label">Date/Time of Incident</div>
        <div class="field-value">${data.dateTimeOfIncident || 'Not specified'}</div>
      </div>
    </div>
    
    <div class="field field-full">
      <div class="field-label">Description</div>
      <div class="description-box">${data.description}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Action Taken</div>
    <div class="description-box">${data.actionTaken || 'Pending'}</div>
  </div>

  <div class="section">
    <div class="section-title">Status Information</div>
    <div class="field-group">
      <div class="field">
        <div class="field-label">Status</div>
        <div class="field-value">${data.status}</div>
      </div>
      <div class="field">
        <div class="field-label">Priority</div>
        <div class="field-value">${data.priority}</div>
      </div>
      ${data.sentiment ? `
      <div class="field field-full">
        <div class="field-label">Sentiment Analysis</div>
        <div class="field-value">
          <span class="badge badge-${data.sentiment.toLowerCase()}">${data.sentiment}</span>
          <span style="margin-left: 10px;">${(data.sentimentScore! * 100).toFixed(0)}% confidence</span>
        </div>
      </div>
      ` : ''}
    </div>
  </div>

  <div class="footer">
    Generated by ${settings.barangayName} SMS Hub on ${new Date().toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' })}
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate HTML for Blotter Entry
   */
  generateBlotterEntryHTML(data: BlotterEntryData, settings: BarangaySettings): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Barangay Blotter Entry - ${data.blotterNumber}</title>
  <style>
    @media print {
      /* Force backgrounds and borders to print */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      @page {
        size: letter;
        margin: 0.5in;
      }
      body {
        margin: 0;
        padding: 0;
      }
    }
    
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #333;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header-logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 10px;
      border: 2px solid #ccc;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
    }
    
    .header-line {
      font-size: 11pt;
      margin: 3px 0;
    }
    
    .barangay-name {
      font-size: 16pt;
      font-weight: bold;
      margin: 10px 0;
    }
    
    .document-title {
      font-size: 18pt;
      font-weight: bold;
      text-align: center;
      margin: 30px 0 20px;
      text-transform: uppercase;
    }
    
    .section {
      margin-bottom: 25px;
    }
    
    .section-title {
      font-size: 13pt;
      font-weight: bold;
      background: #f0f0f0;
      padding: 8px 12px;
      margin-bottom: 15px;
      border-left: 4px solid #333;
    }
    
    .field-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
    }
    
    .field {
      margin-bottom: 12px;
    }
    
    .field-label {
      font-weight: bold;
      font-size: 10pt;
      color: #666;
      margin-bottom: 3px;
    }
    
    .field-value {
      font-size: 11pt;
      padding: 5px;
      background: #fafafa;
      border-radius: 3px;
    }
    
    .field-full {
      grid-column: 1 / -1;
    }
    
    .description-box {
      background: #fafafa;
      padding: 15px;
      border-radius: 5px;
      border: 1px solid #ddd;
      margin-top: 10px;
      white-space: pre-wrap;
      font-size: 11pt;
      line-height: 1.7;
    }
    
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 60px;
    }
    
    .signature-line {
      text-align: center;
      padding-top: 40px;
      border-top: 2px solid #333;
    }
    
    .signature-label {
      font-size: 11pt;
      font-weight: bold;
      margin-top: 5px;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 9pt;
      color: #666;
    }
    
    .no-print {
      text-align: center;
      margin: 20px 0;
    }
    
    .print-button {
      background: #007bff;
      color: white;
      border: none;
      padding: 12px 30px;
      font-size: 14pt;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
    }
    
    .print-button:hover {
      background: #0056b3;
    }
    
    @media print {
      /* Force backgrounds and borders to print */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="print-button" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>

  <div class="header">
    <div class="header-logo">
      ${settings.logoPath 
        ? `<img src="/api/uploads/${settings.logoPath.replace(/^uploads\//, '')}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;" />`
        : `<span style="color: #999; font-size: 10pt;">LOGO</span>`
      }
    </div>
    <div class="header-text">
      <div class="header-line">Republic of the Philippines</div>
      <div class="header-line">Province of ${settings.province}</div>
      <div class="header-line">Municipality/City of ${settings.municipalityCity}</div>
      <div class="barangay-name">${settings.barangayName.toUpperCase()}</div>
      ${settings.address ? `<div class="header-line" style="font-size: 10pt;">${settings.address}</div>` : ''}
      ${settings.contactNumber ? `<div class="header-line" style="font-size: 10pt;">Tel: ${settings.contactNumber}</div>` : ''}
    </div>
  </div>

  <div class="document-title">Barangay Blotter Entry</div>

  <div class="section">
    <div class="field-group">
      <div class="field">
        <div class="field-label">Blotter No.</div>
        <div class="field-value">${data.blotterNumber}</div>
      </div>
      <div class="field">
        <div class="field-label">Date Recorded</div>
        <div class="field-value">${data.dateReported.toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' })}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Complainant Information</div>
    <div class="field-group">
      <div class="field">
        <div class="field-label">Name</div>
        <div class="field-value">${data.complainant}</div>
      </div>
      <div class="field">
        <div class="field-label">Contact</div>
        <div class="field-value">${data.complainantContact}</div>
      </div>
      <div class="field field-full">
        <div class="field-label">Address</div>
        <div class="field-value">${data.complainantAddress}</div>
      </div>
    </div>
  </div>

  ${data.respondent ? `
  <div class="section">
    <div class="section-title">Respondent</div>
    <div class="field">
      <div class="field-label">Name</div>
      <div class="field-value">${data.respondent}</div>
    </div>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">Incident Details</div>
    <div class="field-group">
      <div class="field">
        <div class="field-label">Date of Incident</div>
        <div class="field-value">${data.incidentDate}</div>
      </div>
      <div class="field">
        <div class="field-label">Location</div>
        <div class="field-value">${data.incidentLocation}</div>
      </div>
      <div class="field field-full">
        <div class="field-label">Nature of Incident</div>
        <div class="field-value">${data.incidentNature}</div>
      </div>
    </div>
    
    <div class="field">
      <div class="field-label">Details</div>
      <div class="description-box">${data.incidentDetails}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Action Taken</div>
    <div class="description-box">${data.actionTaken}</div>
  </div>

  <div class="section">
    <div class="field">
      <div class="field-label">Status</div>
      <div class="field-value">${data.status}</div>
    </div>
  </div>

  <div class="signatures">
    <div>
      <div class="signature-line"></div>
      <div class="signature-label">${data.recordedBy}</div>
      <div style="font-size: 9pt; color: #666;">Recorded By</div>
    </div>
    <div>
      <div class="signature-line"></div>
      <div class="signature-label">${settings.captainName || 'Barangay Captain'}</div>
      <div style="font-size: 9pt; color: #666;">Barangay Captain</div>
    </div>
  </div>

  <div class="footer">
    Generated by ${settings.barangayName} SMS Hub on ${new Date().toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' })}
  </div>
</body>
</html>
    `.trim();
  }
}

export const htmlTemplateService = new HTMLTemplateService();
