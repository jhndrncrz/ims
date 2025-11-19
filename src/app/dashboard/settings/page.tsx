"use client";

import {
  Stack,
  Title,
  Text,
  Card,
  TextInput,
  Button,
  Group,
  Tabs,
  PasswordInput,
  Switch,
  NumberInput,
  Select,
  Alert,
  Divider,
  Badge,
  Paper,
  Code,
  FileButton,
  Image,
  Box,
  Textarea
} from "@mantine/core";
import {
  IconSettings,
  IconCloud,
  IconBrandFacebook,
  IconMail,
  IconBrain,
  IconDatabase,
  IconCheck,
  IconAlertTriangle,
  IconInfoCircle,
  IconUpload,
  IconTrash,
  IconPhoto
} from "@tabler/icons-react";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useState, useEffect } from "react";

interface BarangaySettings {
  barangayName: string;
  municipalityCity: string;
  province: string;
  captainName: string;
  contactNumber: string;
  address: string;
  logoPath: string | null;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<string | null>("barangay");
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, boolean>>({});
  const [barangaySettings, setBarangaySettings] = useState<BarangaySettings | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const smsForm = useForm({
    initialValues: {
      accessKeyId: "",
      accessKeySecret: "",
      signName: "",
      templateCode: "",
      enabled: true
    }
  });

  const aiForm = useForm({
    initialValues: {
      dashscopeApiKey: "",
      model: "qwen-plus",
      temperature: 0.7,
      maxTokens: 500,
      ragThreshold: 0.65,
      enabled: true
    }
  });

  const messengerForm = useForm({
    initialValues: {
      pageAccessToken: "",
      verifyToken: "",
      appSecret: "",
      webhookUrl: "",
      enabled: false
    }
  });

  const emailForm = useForm({
    initialValues: {
      host: "",
      port: 993,
      username: "",
      password: "",
      inbox: "INBOX",
      enabled: false
    }
  });

  const barangayForm = useForm({
    initialValues: {
      barangayName: "",
      municipalityCity: "",
      province: "",
      captainName: "",
      contactNumber: "",
      address: ""
    }
  });

  useEffect(() => {
    // Load current env values (mock - in real app would come from API)
    smsForm.setFieldValue("enabled", true);
    aiForm.setFieldValue("enabled", true);
    
    // Load barangay settings
    void fetchBarangaySettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBarangaySettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json() as BarangaySettings;
        setBarangaySettings(data);
        barangayForm.setValues({
          barangayName: data.barangayName,
          municipalityCity: data.municipalityCity,
          province: data.province,
          captainName: data.captainName || "",
          contactNumber: data.contactNumber || "",
          address: data.address || ""
        });
        if (data.logoPath) {
          // Extract filename from path (e.g., "uploads/logos/file.png" -> "logos/file.png")
          const filename = data.logoPath.replace(/^uploads\//, "");
          setLogoPreview(`/api/uploads/${filename}`);
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  const saveBarangaySettings = async (values: typeof barangayForm.values) => {
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        const data = await response.json() as BarangaySettings;
        setBarangaySettings(data);
        notifications.show({
          title: "Saved",
          message: "Barangay settings updated successfully",
          color: "teal"
        });
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to save settings",
        color: "red"
      });
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", logoFile);

      const response = await fetch("/api/settings/logo", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        const data = await response.json() as BarangaySettings;
        setBarangaySettings(data);
        if (data.logoPath) {
          // Extract filename from path (e.g., "uploads/logos/file.png" -> "logos/file.png")
          const filename = data.logoPath.replace(/^uploads\//, "");
          setLogoPreview(`/api/uploads/${filename}`);
        }
        setLogoFile(null);
        notifications.show({
          title: "Success",
          message: "Logo uploaded successfully",
          color: "teal",
        });
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to upload logo",
        color: "red"
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoRemove = async () => {
    try {
      const response = await fetch("/api/settings/logo", {
        method: "DELETE"
      });

      if (response.ok) {
        const data = await response.json() as BarangaySettings;
        setBarangaySettings(data);
        setLogoPreview(null);
        setLogoFile(null);
        notifications.show({
          title: "Success",
          message: "Logo removed successfully",
          color: "teal"
        });
      }
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to remove logo",
        color: "red"
      });
    }
  };

  const handleFileChange = (file: File | null) => {
    setLogoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const testConnection = async (service: string) => {
    setTestingConnection(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock connection test
    const success = Math.random() > 0.3;
    setConnectionStatus(prev => ({ ...prev, [service]: success }));
    
    notifications.show({
      title: success ? "Connection Successful" : "Connection Failed",
      message: success ? `${service.toUpperCase()} is properly configured` : "Please check your credentials",
      color: success ? "teal" : "red",
      icon: success ? <IconCheck size={16} /> : <IconAlertTriangle size={16} />
    });
    setTestingConnection(false);
  };

  const saveSmsSettings = async (values: typeof smsForm.values) => {
    notifications.show({
      title: "Saved",
      message: "SMS settings updated successfully. Restart required.",
      color: "teal"
    });
  };

  const saveAiSettings = async (values: typeof aiForm.values) => {
    notifications.show({
      title: "Saved",
      message: "AI settings updated successfully",
      color: "teal"
    });
  };

  const saveMessengerSettings = async (values: typeof messengerForm.values) => {
    notifications.show({
      title: "Saved",
      message: "Messenger settings updated successfully",
      color: "teal"
    });
  };

  const saveEmailSettings = async (values: typeof emailForm.values) => {
    notifications.show({
      title: "Saved",
      message: "Email settings updated successfully",
      color: "teal"
    });
  };

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Settings</Title>
        <Text c="dimmed" size="sm">
          Configure integrations and system settings
        </Text>
      </div>

      <Alert icon={<IconInfoCircle size={16} />} color="yellow" variant="light">
        <Text size="sm" fw={500}>Configuration UI Preview Only</Text>
        <Text size="xs" mt={4}>
          This interface shows available settings but does not persist changes. 
          Configure environment variables in <Code>.env</Code> file and restart the server.
          Connection tests and save buttons are for demonstration purposes only.
        </Text>
      </Alert>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="barangay" leftSection={<IconSettings size={16} />}>
            Barangay Info
          </Tabs.Tab>
          <Tabs.Tab value="sms" leftSection={<IconCloud size={16} />}>
            Alibaba SMS
          </Tabs.Tab>
          <Tabs.Tab value="ai" leftSection={<IconBrain size={16} />}>
            AI / LLM
          </Tabs.Tab>
          <Tabs.Tab value="messenger" leftSection={<IconBrandFacebook size={16} />}>
            Messenger
          </Tabs.Tab>
          <Tabs.Tab value="email" leftSection={<IconMail size={16} />}>
            Email
          </Tabs.Tab>
          <Tabs.Tab value="system" leftSection={<IconDatabase size={16} />}>
            System
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="barangay" pt="md">
          <Card withBorder shadow="sm">
            <form onSubmit={barangayForm.onSubmit(saveBarangaySettings)}>
              <Stack gap="md">
                <div>
                  <Text fw={600} size="lg">Barangay Information</Text>
                  <Text size="sm" c="dimmed">Configure your barangay details for PDF reports and templates</Text>
                </div>

                <Divider label="Official Logo" labelPosition="left" />

                <Group align="flex-start">
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Text size="sm" fw={500}>Upload Logo</Text>
                    <Text size="xs" c="dimmed">
                      Upload your barangay logo. Recommended: PNG or JPEG, 500x500px or larger.
                      This will appear on PDF reports and templates.
                    </Text>
                    
                    <Group>
                      <FileButton onChange={handleFileChange} accept="image/png,image/jpeg">
                        {(props) => (
                          <Button {...props} leftSection={<IconUpload size={16} />} variant="light">
                            Select Logo
                          </Button>
                        )}
                      </FileButton>
                      
                      {logoFile && (
                        <Button
                          onClick={() => void handleLogoUpload()}
                          loading={uploadingLogo}
                          color="teal"
                        >
                          Upload
                        </Button>
                      )}

                      {logoPreview && !logoFile && (
                        <Button
                          onClick={() => void handleLogoRemove()}
                          leftSection={<IconTrash size={16} />}
                          color="red"
                          variant="light"
                        >
                          Remove Logo
                        </Button>
                      )}
                    </Group>

                    {logoFile && (
                      <Text size="xs" c="dimmed">
                        Selected: {logoFile.name} ({(logoFile.size / 1024).toFixed(1)} KB)
                      </Text>
                    )}
                  </Stack>

                  <Box
                    style={{
                      width: 120,
                      height: 120,
                      border: "2px dashed #dee2e6",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f8f9fa"
                    }}
                  >
                    {logoPreview ? (
                      <Image
                        src={logoPreview}
                        alt="Logo preview"
                        width={100}
                        height={100}
                        fit="contain"
                      />
                    ) : (
                      <IconPhoto size={40} color="#adb5bd" />
                    )}
                  </Box>
                </Group>

                <Divider label="Barangay Details" labelPosition="left" />

                <TextInput
                  label="Barangay Name"
                  placeholder="Barangay Sample"
                  description="Official name of your barangay"
                  required
                  {...barangayForm.getInputProps("barangayName")}
                />

                <TextInput
                  label="Municipality/City"
                  placeholder="Quezon City"
                  description="Municipality or city where barangay is located"
                  required
                  {...barangayForm.getInputProps("municipalityCity")}
                />

                <TextInput
                  label="Province"
                  placeholder="Metro Manila"
                  description="Province or region"
                  required
                  {...barangayForm.getInputProps("province")}
                />

                <TextInput
                  label="Barangay Captain"
                  placeholder="Hon. Juan Dela Cruz"
                  description="Name of current barangay captain (optional)"
                  {...barangayForm.getInputProps("captainName")}
                />

                <TextInput
                  label="Contact Number"
                  placeholder="+63 912 345 6789"
                  description="Official barangay contact number"
                  {...barangayForm.getInputProps("contactNumber")}
                />

                <Textarea
                  label="Address"
                  placeholder="123 Main Street, Barangay Sample"
                  description="Complete barangay hall address"
                  minRows={2}
                  {...barangayForm.getInputProps("address")}
                />

                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                  <Text size="sm">
                    This information will be used to generate professional PDF reports including 
                    Incident Reports and Blotter Entries. Make sure all details are accurate.
                  </Text>
                </Alert>

                <Group justify="flex-end">
                  <Button variant="subtle" onClick={() => barangayForm.reset()}>
                    Reset
                  </Button>
                  <Button type="submit">Save Settings</Button>
                </Group>
              </Stack>
            </form>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="sms" pt="md">
          <Card withBorder shadow="sm">
            <form onSubmit={smsForm.onSubmit(saveSmsSettings)}>
              <Stack gap="md">
                <Group justify="space-between">
                  <div>
                    <Text fw={600} size="lg">Alibaba Cloud SMS Configuration</Text>
                    <Text size="sm" c="dimmed">Configure SMS sending via Alibaba Cloud</Text>
                  </div>
                  <Badge color={connectionStatus.sms ? "teal" : "gray"}>
                    {connectionStatus.sms ? "Connected" : "Not Tested"}
                  </Badge>
                </Group>

                <Switch
                  label="Enable SMS Integration"
                  description="Allow sending and receiving SMS messages"
                  {...smsForm.getInputProps("enabled", { type: "checkbox" })}
                />

                <Divider />

                <TextInput
                  label="Access Key ID"
                  placeholder="LTAI5t6vtmjjU2MK4KxKQLqv"
                  description="From Alibaba Cloud console"
                  {...smsForm.getInputProps("accessKeyId")}
                />

                <PasswordInput
                  label="Access Key Secret"
                  placeholder="Your access key secret"
                  description="Keep this secure"
                  {...smsForm.getInputProps("accessKeySecret")}
                />

                <TextInput
                  label="Sign Name"
                  placeholder="BarangayAI"
                  description="Approved SMS signature"
                  {...smsForm.getInputProps("signName")}
                />

                <TextInput
                  label="Template Code"
                  placeholder="SMS_123456789"
                  description="Approved SMS template code"
                  {...smsForm.getInputProps("templateCode")}
                />

                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                  <Text size="sm">
                    You need to apply for SMS signature and template approval in the Alibaba Cloud console. 
                    See <Code>SMS_SETUP_GUIDE.md</Code> for detailed instructions.
                  </Text>
                </Alert>

                <Group justify="space-between">
                  <Button
                    variant="light"
                    onClick={() => void testConnection("sms")}
                    loading={testingConnection}
                  >
                    Test Connection
                  </Button>
                  <Group>
                    <Button variant="subtle" onClick={() => smsForm.reset()}>
                      Reset
                    </Button>
                    <Button type="submit">Save Settings</Button>
                  </Group>
                </Group>
              </Stack>
            </form>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="ai" pt="md">
          <Card withBorder shadow="sm">
            <form onSubmit={aiForm.onSubmit(saveAiSettings)}>
              <Stack gap="md">
                <Group justify="space-between">
                  <div>
                    <Text fw={600} size="lg">AI & LLM Configuration</Text>
                    <Text size="sm" c="dimmed">Configure DashScope (Qwen) and RAG settings</Text>
                  </div>
                  <Badge color={connectionStatus.ai ? "teal" : "gray"}>
                    {connectionStatus.ai ? "Connected" : "Not Tested"}
                  </Badge>
                </Group>

                <Switch
                  label="Enable AI Processing"
                  description="Use AI for answering queries and classification"
                  {...aiForm.getInputProps("enabled", { type: "checkbox" })}
                />

                <Divider />

                <PasswordInput
                  label="DashScope API Key"
                  placeholder="sk-9cd0d61a519f40298f622b041e242f8a"
                  description="From DashScope console"
                  {...aiForm.getInputProps("dashscopeApiKey")}
                />

                <Select
                  label="Model"
                  description="LLM model to use"
                  data={[
                    { value: "qwen-plus", label: "Qwen Plus (Recommended)" },
                    { value: "qwen-turbo", label: "Qwen Turbo (Faster)" },
                    { value: "qwen-max", label: "Qwen Max (Best Quality)" }
                  ]}
                  {...aiForm.getInputProps("model")}
                />

                <NumberInput
                  label="Temperature"
                  description="Higher = more creative, Lower = more focused"
                  min={0}
                  max={2}
                  step={0.1}
                  {...aiForm.getInputProps("temperature")}
                />

                <NumberInput
                  label="Max Tokens"
                  description="Maximum response length"
                  min={100}
                  max={2000}
                  step={50}
                  {...aiForm.getInputProps("maxTokens")}
                />

                <NumberInput
                  label="RAG Confidence Threshold"
                  description="Minimum confidence score (0-1) to use RAG answer"
                  min={0}
                  max={1}
                  step={0.05}
                  {...aiForm.getInputProps("ragThreshold")}
                />

                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                  <Text size="sm">
                    Get your DashScope API key from{" "}
                    <a href="https://dashscope.console.aliyun.com/" target="_blank" rel="noopener noreferrer">
                      DashScope Console
                    </a>
                  </Text>
                </Alert>

                <Group justify="space-between">
                  <Button
                    variant="light"
                    onClick={() => void testConnection("ai")}
                    loading={testingConnection}
                  >
                    Test Connection
                  </Button>
                  <Group>
                    <Button variant="subtle" onClick={() => aiForm.reset()}>
                      Reset
                    </Button>
                    <Button type="submit">Save Settings</Button>
                  </Group>
                </Group>
              </Stack>
            </form>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="messenger" pt="md">
          <Card withBorder shadow="sm">
            <form onSubmit={messengerForm.onSubmit(saveMessengerSettings)}>
              <Stack gap="md">
                <Group justify="space-between">
                  <div>
                    <Text fw={600} size="lg">Facebook Messenger Integration</Text>
                    <Text size="sm" c="dimmed">Receive and respond to Facebook messages</Text>
                  </div>
                  <Badge color={connectionStatus.messenger ? "teal" : "gray"}>
                    {connectionStatus.messenger ? "Connected" : "Not Configured"}
                  </Badge>
                </Group>

                <Switch
                  label="Enable Messenger Integration"
                  description="Allow receiving messages from Facebook"
                  {...messengerForm.getInputProps("enabled", { type: "checkbox" })}
                />

                <Divider />

                <PasswordInput
                  label="Page Access Token"
                  placeholder="Your Facebook Page access token"
                  description="From Facebook Developer Console"
                  {...messengerForm.getInputProps("pageAccessToken")}
                />

                <TextInput
                  label="Verify Token"
                  placeholder="Custom verification token"
                  description="Use in webhook setup"
                  {...messengerForm.getInputProps("verifyToken")}
                />

                <PasswordInput
                  label="App Secret"
                  placeholder="Your Facebook App secret"
                  description="For validating webhook requests"
                  {...messengerForm.getInputProps("appSecret")}
                />

                <TextInput
                  label="Webhook URL"
                  placeholder="https://your-domain.com/api/messenger-webhook"
                  description="Configure this in Facebook Developer Console"
                  {...messengerForm.getInputProps("webhookUrl")}
                  readOnly
                />

                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                  <Stack gap={4}>
                    <Text size="sm" fw={500}>Setup Instructions:</Text>
                    <Text size="xs" component="ol" style={{ margin: 0, paddingLeft: 20 }}>
                      <li>Create a Facebook App at developers.facebook.com</li>
                      <li>Add Messenger product to your app</li>
                      <li>Generate a Page Access Token for your page</li>
                      <li>Configure webhook with your callback URL and verify token</li>
                      <li>Subscribe to message events</li>
                    </Text>
                  </Stack>
                </Alert>

                <Group justify="space-between">
                  <Button
                    variant="light"
                    onClick={() => void testConnection("messenger")}
                    loading={testingConnection}
                  >
                    Test Connection
                  </Button>
                  <Group>
                    <Button variant="subtle" onClick={() => messengerForm.reset()}>
                      Reset
                    </Button>
                    <Button type="submit">Save Settings</Button>
                  </Group>
                </Group>
              </Stack>
            </form>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="email" pt="md">
          <Card withBorder shadow="sm">
            <form onSubmit={emailForm.onSubmit(saveEmailSettings)}>
              <Stack gap="md">
                <Group justify="space-between">
                  <div>
                    <Text fw={600} size="lg">Email Integration</Text>
                    <Text size="sm" c="dimmed">Receive citizen reports via email</Text>
                  </div>
                  <Badge color={connectionStatus.email ? "teal" : "gray"}>
                    {connectionStatus.email ? "Connected" : "Not Configured"}
                  </Badge>
                </Group>

                <Switch
                  label="Enable Email Integration"
                  description="Monitor email inbox for citizen reports"
                  {...emailForm.getInputProps("enabled", { type: "checkbox" })}
                />

                <Divider />

                <TextInput
                  label="IMAP Host"
                  placeholder="imap.gmail.com"
                  description="Email server hostname"
                  {...emailForm.getInputProps("host")}
                />

                <NumberInput
                  label="Port"
                  placeholder={"993"}
                  description="IMAP port (usually 993 for SSL)"
                  {...emailForm.getInputProps("port")}
                />

                <TextInput
                  label="Username / Email"
                  placeholder="barangay@example.com"
                  description="Email account username"
                  {...emailForm.getInputProps("username")}
                />

                <PasswordInput
                  label="Password"
                  placeholder="Your email password or app password"
                  description="Use app-specific password for Gmail"
                  {...emailForm.getInputProps("password")}
                />

                <TextInput
                  label="Inbox Folder"
                  placeholder="INBOX"
                  description="Mailbox to monitor"
                  {...emailForm.getInputProps("inbox")}
                />

                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                  <Text size="sm">
                    For Gmail, enable IMAP in settings and use an app-specific password. 
                    The system will check for new emails every 5 minutes.
                  </Text>
                </Alert>

                <Group justify="space-between">
                  <Button
                    variant="light"
                    onClick={() => void testConnection("email")}
                    loading={testingConnection}
                  >
                    Test Connection
                  </Button>
                  <Group>
                    <Button variant="subtle" onClick={() => emailForm.reset()}>
                      Reset
                    </Button>
                    <Button type="submit">Save Settings</Button>
                  </Group>
                </Group>
              </Stack>
            </form>
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="system" pt="md">
          <Stack gap="md">
            <Card withBorder shadow="sm">
              <Stack gap="md">
                <div>
                  <Text fw={600} size="lg">System Information</Text>
                  <Text size="sm" c="dimmed">Current system configuration and status</Text>
                </div>

                <Divider />

                <Paper p="md" withBorder>
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>Database</Text>
                    <Badge color="teal">SQLite</Badge>
                  </Group>
                  <Text size="xs" c="dimmed" mt={4}>prisma/dev.db</Text>
                </Paper>

                <Paper p="md" withBorder>
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>Vector Store</Text>
                    <Badge color="blue">TF-IDF</Badge>
                  </Group>
                  <Text size="xs" c="dimmed" mt={4}>In-database embeddings</Text>
                </Paper>

                <Paper p="md" withBorder>
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>SMS Webhook</Text>
                    <Badge color="violet">Active</Badge>
                  </Group>
                  <Text size="xs" c="dimmed" mt={4}>/api/sms-webhook</Text>
                </Paper>

                <Paper p="md" withBorder>
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>Messenger Webhook</Text>
                    <Badge color="gray">Inactive</Badge>
                  </Group>
                  <Text size="xs" c="dimmed" mt={4}>/api/messenger-webhook</Text>
                </Paper>

                <Paper p="md" withBorder>
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>API Version</Text>
                    <Badge color="gray">v1.0.0</Badge>
                  </Group>
                  <Text size="xs" c="dimmed" mt={4}>November 2025</Text>
                </Paper>

                <Divider />

                <Alert icon={<IconSettings size={16} />} color="gray" variant="light">
                  <Text size="sm">
                    For advanced configuration, edit the <Code>.env</Code> file in the project root and restart the development server.
                  </Text>
                </Alert>
              </Stack>
            </Card>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
