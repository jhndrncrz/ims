import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Fix for PDFKit font loading issue in Next.js
  serverExternalPackages: ["pdfkit", "pdf-parse", "tesseract.js"],
};

export default nextConfig;
