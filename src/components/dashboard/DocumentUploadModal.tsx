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
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [batchMode, setBatchMode] = useState(false);

  const form = useForm({
    initialValues: {
      title: "",
      source: "",
      content: "",
      tags: [] as string[]
    },
    validate: batchMode ? undefined : zodResolver(schema)
  });

  const handleSubmit = async (values: typeof form.values) => {
    setUploading(true);
    try {
      if (batchMode && uploadFiles.length > 0) {
        // Batch upload mode
        let successCount = 0;
        for (const file of uploadFiles) {
          try {
            const reader = new FileReader();
            const base64 = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve((reader.result as string).split(",")[1]);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });

            const ext = file.name.split(".").pop()?.toLowerCase();
            let fileType: "pdf" | "docx" | "txt" | "image" = "txt";
            
            if (ext === "pdf") fileType = "pdf";
            else if (ext === "docx" || ext === "doc") fileType = "docx";
            else if (["jpg", "jpeg", "png", "gif", "bmp"].includes(ext || "")) fileType = "image";

            await uploadDocument({
              title: file.name.replace(/\.[^/.]+$/, ""),
              source: file.name,
              tags: values.tags || [],
              file: base64,
              fileType
            });
            successCount++;
          } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
          }
        }
        
        notifications.show({
          title: "Batch Upload Complete",
          message: `Successfully uploaded ${successCount} of ${uploadFiles.length} files`,
          color: successCount === uploadFiles.length ? "teal" : "orange"
        });
      } else {
        // Single file/manual upload mode
        let fileData: { file?: string; fileType?: string } = {};

        if (uploadFiles.length > 0) {
          const uploadFile = uploadFiles[0];
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
      }
      
      form.reset();
      setUploadFiles([]);
      setBatchMode(false);
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
          {!batchMode && (
            <>
              <TextInput label="Title" placeholder="Ordinances 2024" withAsterisk {...form.getInputProps("title")} />
              <TextInput label="Source" placeholder="ordinances-2024.md" {...form.getInputProps("source")} />
            </>
          )}
          
          <Group justify="space-between" mb="xs">
            <Text size="sm" fw={500}>Upload Mode</Text>
            <Button.Group>
              <Button 
                variant={!batchMode ? "filled" : "default"} 
                size="xs"
                onClick={() => {
                  setBatchMode(false);
                  setUploadFiles([]);
                }}
              >
                Single
              </Button>
              <Button 
                variant={batchMode ? "filled" : "default"} 
                size="xs"
                onClick={() => {
                  setBatchMode(true);
                  form.reset();
                }}
              >
                Batch
              </Button>
            </Button.Group>
          </Group>
          
          <Dropzone
            onDrop={(files) => setUploadFiles(batchMode ? files : [files[0]])}
            onReject={() => notifications.show({ title: "Error", message: "Invalid file", color: "red" })}
            maxSize={10 * 1024 ** 2}
            maxFiles={batchMode ? 20 : 1}
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
                  {uploadFiles.length > 0 
                    ? `${uploadFiles.length} file${uploadFiles.length > 1 ? 's' : ''} selected`
                    : batchMode 
                      ? "Drag multiple files here or click to select"
                      : "Drag file here or click to select"}
                </Text>
                <Text size="sm" c="dimmed" inline mt={7}>
                  {batchMode ? "Up to 20 files: PDF, DOCX, TXT, images" : "Supports PDF, DOCX, TXT, and images (PNG, JPG)"}
                </Text>
              </div>
            </Group>
          </Dropzone>
          
          {uploadFiles.length > 0 && (
            <Paper p="sm" withBorder>
              <Text size="sm" fw={500} mb="xs">Selected Files:</Text>
              <Stack gap="xs">
                {uploadFiles.map((file, idx) => (
                  <Group key={idx} justify="space-between">
                    <Text size="sm">{file.name}</Text>
                    <Text size="xs" c="dimmed">{(file.size / 1024).toFixed(1)} KB</Text>
                  </Group>
                ))}
              </Stack>
            </Paper>
          )}
          
          {!batchMode && (
            <Textarea
              label="Content (optional if uploading file)"
              placeholder="Full text content..."
              minRows={6}
              {...form.getInputProps("content")}
            />
          )}
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
