import { Button, Group, Modal, Stack, TagsInput, Text, Textarea, TextInput } from "@mantine/core";
import { Dropzone, MIME_TYPES } from "@mantine/dropzone";
import { useForm, zodResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconUpload, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  source: z.string().min(3, "Source must be at least 3 characters").or(z.string().min(0)).optional().nullable(),
  content: z.string().min(20, "Content must be at least 20 characters").or(z.string().min(0)).optional().nullable(),
  tags: z.array(z.string()).optional()
});

type DocumentUploadModalProps = {
  opened: boolean;
  onClose: () => void;
  uploadDocument: (data: {
    title: string;
    source: string;
    content?: string;
    tags?: string[];
    file?: string;
    fileType?: string;
  }) => Promise<void>;
};

export function DocumentUploadModal({ opened, onClose, uploadDocument }: DocumentUploadModalProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const form = useForm({
    initialValues: {
      title: "",
      source: "",
      content: "",
      tags: [] as string[]
    },
    validate: zodResolver(schema)
  });

  const handleSubmit = async (values: typeof form.values) => {
    setUploading(true);
    try {
      let fileData: { file?: string; fileType?: string } = {};

      if (uploadFile) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(uploadFile);
        });

        const ext = uploadFile.name.split(".").pop()?.toLowerCase();
        let fileType: "pdf" | "docx" | "txt" | "image" = "txt";
        
        if (ext === "pdf") fileType = "pdf";
        else if (ext === "docx" || ext === "doc") fileType = "docx";
        else if (["jpg", "jpeg", "png", "gif", "bmp"].includes(ext || "")) fileType = "image";

        fileData = { file: base64, fileType };
      }

      await uploadDocument({
        title: values.title,
        source: values.source,
        content: values.content || undefined,
        tags: values.tags || [],
        ...fileData
      });
      
      notifications.show({
        title: "Success",
        message: "Document uploaded successfully",
        color: "teal"
      });
      form.reset();
      setUploadFile(null);
      onClose();
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: "Failed to upload document",
        color: "red"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Add Knowledge Document" size="lg">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput label="Title" placeholder="Ordinances 2024" withAsterisk {...form.getInputProps("title")} />
          <TextInput label="Source" placeholder="ordinances-2024.md" {...form.getInputProps("source")} />
          
          <Dropzone
            onDrop={(files) => setUploadFile(files[0])}
            onReject={() => notifications.show({ title: "Error", message: "Invalid file", color: "red" })}
            maxSize={10 * 1024 ** 2}
            accept={[MIME_TYPES.pdf, MIME_TYPES.docx, MIME_TYPES.png, MIME_TYPES.jpeg, "text/plain"]}
          >
            <Group justify="center" gap="xl" mih={100} style={{ pointerEvents: "none" }}>
              <Dropzone.Accept>
                <IconUpload size={52} stroke={1.5} />
              </Dropzone.Accept>
              <Dropzone.Reject>
                <IconX size={52} stroke={1.5} />
              </Dropzone.Reject>
              <Dropzone.Idle>
                <IconUpload size={52} stroke={1.5} />
              </Dropzone.Idle>

              <div>
                <Text size="xl" inline>
                  {uploadFile ? uploadFile.name : "Drag file here or click to select"}
                </Text>
                <Text size="sm" c="dimmed" inline mt={7}>
                  Supports PDF, DOCX, TXT, and images (PNG, JPG)
                </Text>
              </div>
            </Group>
          </Dropzone>
          
          <Textarea
            label="Content (optional if uploading file)"
            placeholder="Full text content..."
            minRows={6}
            {...form.getInputProps("content")}
          />
          <TagsInput 
            label="Tags" 
            placeholder="Press Enter to add tags" 
            {...form.getInputProps("tags")} 
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={uploading}>
              Upload
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
