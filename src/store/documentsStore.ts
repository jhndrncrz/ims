"use client";

import { create } from "zustand";
import { logger } from "@/lib/logger";

export type DocumentChunk = {
  id: string;
  title: string;
  source: string;
  content: string;
  tags: string[];
  createdAt: string;
};

type DocumentsState = {
  documents: DocumentChunk[];
  loading: boolean;
  error?: string;
  fetchDocuments: () => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  uploadDocument: (input: { 
    title: string; 
    source: string; 
    content?: string; 
    tags?: string[];
    file?: string;
    fileType?: string;
  }) => Promise<void>;
};

export const useDocumentsStore = create<DocumentsState>((set, get) => ({
  documents: [],
  loading: false,
  error: undefined,
  fetchDocuments: async () => {
    set({ loading: true, error: undefined });
    try {
      const response = await fetch("/api/documents");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = (await response.json()) as { documents: DocumentChunk[] };
      set({ documents: data.documents || [], loading: false });
    } catch (error) {
      logger.error("Failed to fetch documents", { error });
      set({ error: "Failed to load documents", loading: false, documents: [] });
    }
  },
  deleteDocument: async (id: string) => {
    try {
      const response = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      set({ documents: get().documents.filter((doc) => doc.id !== id) });
    } catch (error) {
      logger.error("Failed to delete document", { documentId: id, error });
      set({ error: "Failed to delete document" });
      throw error;
    }
  },
  uploadDocument: async (input) => {
    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      });
      if (!response.ok) throw new Error("Upload failed");
      await get().fetchDocuments();
    } catch (error) {
      logger.error("Failed to upload document", { error });
      set({ error: "Failed to upload document" });
      throw error;
    }
  }
}));
