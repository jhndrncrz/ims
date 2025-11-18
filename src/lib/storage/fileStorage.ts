import fs from "fs/promises";
import path from "path";
import { logger } from "@/lib/logger";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Ensure upload directory exists
export const ensureUploadDir = async () => {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    logger.info("Created uploads directory", { path: UPLOAD_DIR });
  }
};

// Save file to disk and return the file path
export const saveFile = async (
  fileData: Buffer | string,
  filename: string
): Promise<{ filePath: string; fullPath: string; size: number }> => {
  await ensureUploadDir();

  // Sanitize filename
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();
  const uniqueFilename = `${timestamp}_${sanitized}`;
  const fullPath = path.join(UPLOAD_DIR, uniqueFilename);
  const relativePath = path.join("uploads", uniqueFilename);

  // Convert base64 string to buffer if needed
  const buffer = typeof fileData === "string" 
    ? Buffer.from(fileData, "base64") 
    : fileData;

  await fs.writeFile(fullPath, buffer);
  logger.info("File saved successfully", { path: relativePath, size: buffer.length });

  return {
    filePath: relativePath,
    fullPath,
    size: buffer.length
  };
};

// Read file from disk
export const readFile = async (filePath: string): Promise<Buffer> => {
  const fullPath = path.join(process.cwd(), filePath);
  return await fs.readFile(fullPath);
};

// Delete file from disk
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    await fs.unlink(fullPath);
    logger.info("File deleted", { path: filePath });
  } catch (error) {
    logger.error("Failed to delete file", { path: filePath, error });
  }
};

// Check if file exists
export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
};
