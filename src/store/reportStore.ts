"use client";

import { create } from "zustand";

import type { ReportDTO } from "@/types/report";
import { logger } from "@/lib/logger";

type ReportInput = {
  phoneNumber: string;
  message: string;
  attachmentsUri?: string;
};

type ReportsState = {
  reports: ReportDTO[];
  loading: boolean;
  error?: string;
  fetchReports: () => Promise<void>;
  createReport: (input: ReportInput) => Promise<void>;
  updateReport: (id: string, updates: {
    status?: ReportDTO["status"];
    category?: ReportDTO["category"];
    priority?: ReportDTO["priority"];
    resolution?: string;
    addToKnowledge?: boolean;
  }) => Promise<void>;
};

export const useReportStore = create<ReportsState>((set, get) => ({
  reports: [],
  loading: false,
  error: undefined,
  fetchReports: async () => {
    set({ loading: true, error: undefined });
    try {
      const response = await fetch("/api/reports", { cache: "no-store" });
      const data = (await response.json()) as { reports: ReportDTO[] };
      set({ reports: data.reports, loading: false });
    } catch (error) {
      logger.error("Failed to fetch reports", { error });
      set({ error: "Failed to load reports", loading: false });
    }
  },
  createReport: async (input: ReportInput) => {
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      });
      if (!response.ok) {
        throw new Error("Unable to create report");
      }
      const data = (await response.json()) as { report: ReportDTO };
      set({ reports: [data.report, ...get().reports] });
    } catch (error) {
      logger.error("Failed to create report", { error });
      set({ error: "Unable to create report" });
      throw error;
    }
  },
  updateReport: async (id: string, updates) => {
    try {
      const response = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (!response.ok) {
        throw new Error("Unable to update report");
      }
      const data = (await response.json()) as { report: ReportDTO };
      set({ reports: get().reports.map((r) => (r.id === id ? data.report : r)) });
    } catch (error) {
      logger.error("Failed to update report", { reportId: id, error });
      set({ error: "Unable to update report" });
      throw error;
    }
  }
}));
