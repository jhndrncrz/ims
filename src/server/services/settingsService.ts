import { prisma } from "@/server/db/client";
import { BarangaySettings } from "@prisma/client";
import * as fileStorage from "@/lib/storage/fileStorage";

export class SettingsService {
  /**
   * Get barangay settings (or create default if none exist)
   */
  async getSettings(): Promise<BarangaySettings> {
    let settings = await prisma.barangaySettings.findFirst();
    
    if (!settings) {
      settings = await prisma.barangaySettings.create({
        data: {
          barangayName: "Barangay Sample",
          municipalityCity: "Municipality/City",
          province: "Province",
        },
      });
    }

    return settings;
  }

  /**
   * Update barangay settings
   */
  async updateSettings(data: Partial<Omit<BarangaySettings, "id" | "createdAt" | "updatedAt">>): Promise<BarangaySettings> {
    const existingSettings = await this.getSettings();

    return await prisma.barangaySettings.update({
      where: { id: existingSettings.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Upload and set logo
   */
  async uploadLogo(file: Buffer, filename: string): Promise<BarangaySettings> {
    const { filePath: logoPath } = await fileStorage.saveFile(file, `logos/${filename}`);
    
    return await this.updateSettings({ logoPath });
  }

  /**
   * Remove logo
   */
  async removeLogo(): Promise<BarangaySettings> {
    const settings = await this.getSettings();
    
    if (settings.logoPath) {
      await fileStorage.deleteFile(settings.logoPath);
    }

    return await this.updateSettings({ logoPath: null });
  }
}

export const settingsService = new SettingsService();
