"use client";

import { ActionIcon, Box, Button, Group, Paper, ScrollArea, Stack, Text, Textarea, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconSend, IconSignal2g, IconWifi, IconBattery3 } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  text: string;
  sender: "user" | "barangay";
  timestamp: Date;
  type?: string;
  confidence?: number;
};

const BARANGAY_NUMBER = "+63 917 123 4567";

export default function SmsSimulatorPage() {
  const [phoneNumber, setPhoneNumber] = useState("09171234567");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [phoneType, setPhoneType] = useState<"smartphone" | "keypad">("smartphone");

  const form = useForm({
    initialValues: {
      message: ""
    }
  });

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    const message = form.values.message.trim();
    if (!message || sending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    form.reset();
    setSending(true);

    try {
      const res = await fetch("/api/sms-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phoneNumber,
          message: message,
          skipSmsReply: true
        })
      });

      if (!res.ok) throw new Error("Failed to send");

      const data = await res.json() as { result: { type: string; reply: string; confidence: number } };
      
      // Simulate realistic response delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const barangayMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.result.reply,
        sender: "barangay",
        timestamp: new Date(),
        type: data.result.type,
        confidence: data.result.confidence
      };

      setMessages(prev => [...prev, barangayMessage]);
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: "Failed to send message",
        color: "red"
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    form.reset();
  };

  return (
    <Group align="flex-start" gap="xl" wrap="nowrap" style={{ height: 'calc(100vh - 140px)' }}>
      {/* Info Panel */}
      <Stack gap="md" style={{ minWidth: 280 }}>
        <div>
          <Title order={2}>SMS Simulator</Title>
          <Text c="dimmed" size="sm">
            Test the Barangay AI SMS Hub
          </Text>
        </div>

        <Paper withBorder p="md">
          <Stack gap="sm">
            <Text size="sm" fw={600}>Barangay Number</Text>
            <Paper p="xs" withBorder style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
              <Text size="sm" ff="monospace" fw={600} c="blue">
                {BARANGAY_NUMBER}
              </Text>
            </Paper>
            <Text size="xs" c="dimmed">
              This is the number citizens would send SMS messages to
            </Text>
          </Stack>
        </Paper>

        <Paper withBorder p="md">
          <Stack gap="sm">
            <Text size="sm" fw={600}>Your Test Phone</Text>
            <TextInput
              placeholder="09171234567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.currentTarget.value)}
            />
            <Text size="xs" c="dimmed">
              Simulates sending from this number
            </Text>
          </Stack>
        </Paper>

        <Button 
          variant="light" 
          fullWidth
          onClick={handleNewConversation}
        >
          New Conversation
        </Button>

        <Paper withBorder p="md">
          <Stack gap="sm">
            <Text size="sm" fw={600}>Phone Type</Text>
            <Button.Group>
              <Button
                variant={phoneType === "smartphone" ? "filled" : "default"}
                onClick={() => setPhoneType("smartphone")}
                style={{ flex: 1 }}
              >
                Smartphone
              </Button>
              <Button
                variant={phoneType === "keypad" ? "filled" : "default"}
                onClick={() => setPhoneType("keypad")}
                style={{ flex: 1 }}
              >
                Keypad
              </Button>
            </Button.Group>
            <Text size="xs" c="dimmed">
              Switch between modern and basic phone UI
            </Text>
          </Stack>
        </Paper>

        <Paper withBorder p="md">
          <Stack gap="xs">
            <Text size="xs" fw={600}>Try asking:</Text>
            <Text size="xs" c="dimmed">• What is the curfew for minors?</Text>
            <Text size="xs" c="dimmed">• How do I get a barangay clearance?</Text>
            <Text size="xs" c="dimmed">• I want to report a broken streetlight</Text>
          </Stack>
        </Paper>
      </Stack>

      {/* Mobile Phone UI */}
      <Box style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        {phoneType === "smartphone" ? (
          <Paper
            shadow="xl"
            radius="xl"
            style={{
              width: 380,
              height: 720,
              border: '14px solid #1a1a1a',
              borderRadius: 40,
              backgroundColor: '#fff',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
          {/* Phone Notch */}
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 140,
              height: 28,
              backgroundColor: '#1a1a1a',
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              zIndex: 1000
            }}
          />

          {/* SMS App Header */}
          <Paper
            p="md"
            style={{
              backgroundColor: 'var(--mantine-color-blue-6)',
              color: 'white',
              borderRadius: 0,
              paddingTop: 40
            }}
          >
            <Group justify="space-between" mb="xs">
              <Group gap={4}>
                <IconSignal2g size={14} />
                <IconWifi size={14} />
              </Group>

              <Group gap={4}>
<Text size="xs" fw={600}>
                12:34 PM
              </Text>
              <IconBattery3 size={16} />
              </Group>
              
            </Group>
            <Group gap="sm">
              <ActionIcon variant="subtle" color="white" size="sm">
                <IconArrowLeft size={18} />
              </ActionIcon>
              <div style={{ flex: 1 }}>
                <Text fw={600} size="sm">Barangay AI</Text>
                <Text size="xs" opacity={0.9}>{BARANGAY_NUMBER}</Text>
              </div>
            </Group>
          </Paper>

          {/* Messages Area */}
          <ScrollArea
            ref={scrollAreaRef}
            style={{
              height: 'calc(100% - 170px)',
              backgroundColor: '#f5f5f5'
            }}
            p="md"
          >
            <Stack gap="sm">
              {messages.length === 0 ? (
                <Paper p="xl" withBorder style={{ backgroundColor: 'white', textAlign: 'center' }}>
                  <Text size="sm" c="dimmed">
                    No messages yet. Send a message to start!
                  </Text>
                </Paper>
              ) : (
                messages.map((msg) => (
                  <Group
                    key={msg.id}
                    justify={msg.sender === "user" ? "flex-end" : "flex-start"}
                    align="flex-end"
                    gap="xs"
                  >
                    <Paper
                      p="sm"
                      style={{
                        maxWidth: '75%',
                        backgroundColor: msg.sender === "user" 
                          ? 'var(--mantine-color-blue-6)' 
                          : 'white',
                        color: msg.sender === "user" ? 'white' : 'inherit',
                        borderRadius: 12,
                        borderTopRightRadius: msg.sender === "user" ? 4 : 12,
                        borderTopLeftRadius: msg.sender === "barangay" ? 4 : 12
                      }}
                    >
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                        {msg.text}
                      </Text>
                      <Group justify="space-between" mt="xs" gap="xs">
                        <Text 
                          size="xs" 
                          opacity={0.7}
                          style={{ 
                            color: msg.sender === "user" ? 'white' : 'inherit' 
                          }}
                        >
                          {msg.timestamp.toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </Text>
                      </Group>
                    </Paper>
                  </Group>
                ))
              )}
            </Stack>
          </ScrollArea>

          {/* Message Input */}
          <Paper
            p="md"
            style={{
              borderTop: '1px solid var(--mantine-color-gray-3)',
              backgroundColor: 'white',
              borderRadius: 0
            }}
          >
            <form onSubmit={(e) => {
              e.preventDefault();
              void handleSendMessage();
            }}>
              <Group gap="sm" wrap="nowrap">
                <Textarea
                  placeholder="Type a message..."
                  {...form.getInputProps('message')}
                  onKeyDown={handleKeyPress}
                  minRows={1}
                  maxRows={3}
                  autosize
                  style={{ flex: 1 }}
                  disabled={sending}
                />
                <ActionIcon
                  type="submit"
                  size="lg"
                  variant="filled"
                  color="blue"
                  loading={sending}
                  disabled={!form.values.message.trim()}
                >
                  <IconSend size={18} />
                </ActionIcon>
              </Group>
            </form>
          </Paper>
        </Paper>
        ) : (
          /* Nokia Keypad Phone UI - Classic Design */
          <Box
            style={{
              width: 240,
              height: 520,
              background: '#232526',
              borderRadius: 30,
              boxShadow: '2px 2px 2px #444, inset 0 60px 0 -36px rgb(142, 5, 99)',
              padding: 10,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Box
              style={{
                position: 'relative',
                width: 230,
                height: 510,
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderRadius: 30
              }}
            >
              {/* Screen */}
              <Box
                style={{
                  width: 210,
                  height: 250,
                  margin: '10px auto 0 auto',
                  background: 'linear-gradient(to right, #434343, #000000)',
                  borderTopLeftRadius: 30,
                  borderTopRightRadius: 30,
                  borderBottomLeftRadius: 10,
                  borderBottomRightRadius: 10
                }}
              >
                {/* Top speaker line */}
                <Box
                  style={{
                    position: 'relative',
                    width: 80,
                    height: 5,
                    margin: '0 auto',
                    top: 10,
                    backgroundColor: '#000',
                    borderRadius: 30
                  }}
                />
                <Text ta="center" c="#777" size="sm" mt="xs">
                  NOKIA
                </Text>

                {/* Message Display Area */}
                <Box
                  style={{
                    width: 190,
                    height: 180,
                    margin: '0 auto',
                    backgroundColor: '#444',
                    padding: 8,
                    overflow: 'hidden'
                  }}
                >
                  <ScrollArea style={{ height: '100%' }}>
                    <Stack gap={6}>
                      {messages.length === 0 ? (
                        <Text size="xs" c="#ccc" ta="center" mt="md">
                          No messages
                        </Text>
                      ) : (
                        messages.map((msg) => (
                          <Box key={msg.id}>
                            <Text size="9px" fw={600} c="#aaa">
                              {msg.sender === "user" ? "You" : "Barangay"} {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            <Text
                              size="xs"
                              c="#fff"
                              style={{
                                wordWrap: 'break-word',
                                lineHeight: 1.2
                              }}
                            >
                              {msg.text}
                            </Text>
                          </Box>
                        ))
                      )}
                    </Stack>
                  </ScrollArea>
                </Box>
              </Box>

              {/* Navigation Buttons Row */}
              <Box style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', marginTop: 10 }}>
                <Box
                  style={{
                    width: 65,
                    height: 28,
                    userSelect: 'none',
                    color: '#666',
                    boxShadow: '-1px 1px #111, -1px 1px #111, -2px 2px #111, -2px 2px #111, -2px 1px #111',
                    borderRadius: 30,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <Box style={{ width: 25, height: 1, backgroundColor: '#777' }} />
                </Box>
                <Box
                  style={{
                    width: 65,
                    height: 60,
                    userSelect: 'none',
                    color: '#666',
                    boxShadow: '-1px 1px #111, -1px 1px #111, -2px 2px #111, -2px 2px #111, -2px 1px #111',
                    borderRadius: 20,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <Box
                    style={{
                      width: 50,
                      height: 44,
                      boxShadow: 'inset 0 0 5px #111',
                      borderRadius: 20
                    }}
                  />
                </Box>
                <Box
                  style={{
                    width: 65,
                    height: 28,
                    userSelect: 'none',
                    color: '#666',
                    boxShadow: '-1px 1px #111, -1px 1px #111, -2px 2px #111, -2px 2px #111, -2px 1px #111',
                    borderRadius: 30,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <Box style={{ width: 25, height: 1, backgroundColor: '#777' }} />
                </Box>
              </Box>

              {/* Side buttons (call/end) */}
              <Box
                style={{
                  position: 'absolute',
                  top: '59.9%',
                  left: '4%',
                  width: 65,
                  height: 28,
                  color: '#666',
                  boxShadow: '-1px 1px #111, -1px 1px #111, -2px 2px #111, -2px 2px #111, -2px 1px #111',
                  borderRadius: 30
                }}
              >
                <Box
                  style={{
                    width: 25,
                    height: 8,
                    margin: '9px 0 0 18px',
                    borderLeft: '2px solid #777',
                    borderRight: '2px solid #777',
                    borderTop: '2px solid #777',
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20
                  }}
                />
              </Box>
              <Box
                style={{
                  position: 'absolute',
                  top: '59.9%',
                  right: '4%',
                  width: 65,
                  height: 28,
                  color: '#666',
                  boxShadow: '-1px 1px #111, -1px 1px #111, -2px 2px #111, -2px 2px #111, -2px 1px #111',
                  borderRadius: 30
                }}
              >
                <Box
                  style={{
                    width: 25,
                    height: 8,
                    margin: '9px 0 0 18px',
                    borderLeft: '2px solid #777',
                    borderRight: '2px solid #777',
                    borderTop: '2px solid #777',
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20
                  }}
                />
              </Box>

              {/* Number Keypad - Row 1 */}
              <Box style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', marginTop: 10 }}>
                <Box style={{ width: 65, height: 28, userSelect: 'none', color: '#666', boxShadow: '-1px 1px #111, -1px 1px #111, -2px 2px #111, -2px 2px #111, -2px 1px #111', borderRadius: 30 }}>
                  <Box style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 10px' }}>
                    <Text size="lg" fw={600} c="#777" lh={1} style={{ fontSize: 18 }}>1</Text>
                    <Text size="xs" c="#666" style={{ fontSize: 10, marginTop: 6, marginLeft: 15 }}>⚫</Text>
                  </Box>
                </Box>
                <Box style={{ width: 65, height: 28, userSelect: 'none', color: '#666', boxShadow: '-1px 1px #111, -1px 1px #111, -2px 2px #111, -2px 2px #111, -2px 1px #111', borderRadius: 30 }}>
                  <Box style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 10px' }}>
                    <Text size="lg" fw={600} c="#777" lh={1} style={{ fontSize: 18 }}>2</Text>
                    <Text size="xs" c="#666" style={{ fontSize: 10, marginTop: 6, marginLeft: 15 }}>abc</Text>
                  </Box>
                </Box>
                <Box style={{ width: 65, height: 28, userSelect: 'none', color: '#666', boxShadow: '-1px 1px #111, -1px 1px #111, -2px 2px #111, -2px 2px #111, -2px 1px #111', borderRadius: 30 }}>
                  <Box style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 10px' }}>
                    <Text size="lg" fw={600} c="#777" lh={1} style={{ fontSize: 18 }}>3</Text>
                    <Text size="xs" c="#666" style={{ fontSize: 10, marginTop: 6, marginLeft: 15 }}>def</Text>
                  </Box>
                </Box>
              </Box>

              {/* Number Keypad - Row 2 */}
              <Box style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', marginTop: 7 }}>
                <Box style={{ width: 65, height: 28, userSelect: 'none', color: '#666', boxShadow: '-1px 1px #111, -1px 1px #111, -2px 2px #111, -2px 2px #111, -2px 1px #111', borderRadius: 30 }}>
                  <Box style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 10px' }}>
                    <Text size="lg" fw={600} c="#777" lh={1} style={{ fontSize: 18 }}>4</Text>
                    <Text size="xs" c="#666" style={{ fontSize: 10, marginTop: 6, marginLeft: 15 }}>ghi</Text>
                  </Box>
                </Box>
                <Box style={{ width: 65, height: 28, userSelect: 'none', color: '#666', boxShadow: '-1px 1px #111, -1px 1px #111, -2px 2px #111, -2px 2px #111, -2px 1px #111', borderRadius: 30 }}>
                  <Box style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 10px' }}>
                    <Text size="lg" fw={600} c="#777" lh={1} style={{ fontSize: 18 }}>5</Text>
                    <Text size="xs" c="#666" style={{ fontSize: 10, marginTop: 6, marginLeft: 15 }}>jkl</Text>
                  </Box>
                </Box>
                <Box style={{ width: 65, height: 28, userSelect: 'none', color: '#666', boxShadow: '-1px 1px #111, -1px 1px #111, -2px 2px #111, -2px 2px #111, -2px 1px #111', borderRadius: 30 }}>
                  <Box style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 10px' }}>
                    <Text size="lg" fw={600} c="#777" lh={1} style={{ fontSize: 18 }}>6</Text>
                    <Text size="xs" c="#666" style={{ fontSize: 10, marginTop: 6, marginLeft: 15 }}>mno</Text>
                  </Box>
                </Box>
              </Box>

              {/* Number Keypad - Row 3 */}
              <Box style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', marginTop: 7 }}>
                <Box style={{ width: 65, height: 28, userSelect: 'none', color: '#666', boxShadow: '-1px 1px #111, -1px 1px #111, -2px 2px #111, -2px 2px #111, -2px 1px #111', borderRadius: 30 }}>
                  <Box style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 10px' }}>
                    <Text size="lg" fw={600} c="#777" lh={1} style={{ fontSize: 18 }}>7</Text>
                    <Text size="xs" c="#666" style={{ fontSize: 10, marginTop: 6, marginLeft: 15 }}>pqrs</Text>
                  </Box>
                </Box>
                <Box style={{ width: 65, height: 28, userSelect: 'none', color: '#666', boxShadow: '-1px 1px #111, -1px 1px #111, -2px 2px #111, -2px 2px #111, -2px 1px #111', borderRadius: 30 }}>
                  <Box style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 10px' }}>
                    <Text size="lg" fw={600} c="#777" lh={1} style={{ fontSize: 18 }}>8</Text>
                    <Text size="xs" c="#666" style={{ fontSize: 10, marginTop: 6, marginLeft: 15 }}>tuv</Text>
                  </Box>
                </Box>
                <Box style={{ width: 65, height: 28, userSelect: 'none', color: '#666', boxShadow: '-1px 1px #111, -1px 1px #111, -2px 2px #111, -2px 2px #111, -2px 1px #111', borderRadius: 30 }}>
                  <Box style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 10px' }}>
                    <Text size="lg" fw={600} c="#777" lh={1} style={{ fontSize: 18 }}>9</Text>
                    <Text size="xs" c="#666" style={{ fontSize: 10, marginTop: 6, marginLeft: 15 }}>wxyz</Text>
                  </Box>
                </Box>
              </Box>

              {/* Number Keypad - Row 4 */}
              <Box style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', marginTop: 7 }}>
                <Box style={{ width: 65, height: 28, userSelect: 'none', color: '#666', boxShadow: '-1px 1px #111, -1px 1px #111, -2px 2px #111, -2px 2px #111, -2px 1px #111', borderRadius: 30 }}>
                  <Box style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 10px' }}>
                    <Text size="lg" fw={600} c="#777" lh={1} style={{ fontSize: 18 }}>*</Text>
                    <Text size="xs" c="#666" style={{ fontSize: 10, marginTop: 6, marginLeft: 15 }}>⚫</Text>
                  </Box>
                </Box>
                <Box style={{ width: 65, height: 28, userSelect: 'none', color: '#666', boxShadow: '-1px 1px #111, -1px 1px #111, -2px 2px #111, -2px 2px #111, -2px 1px #111', borderRadius: 30 }}>
                  <Box style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 10px' }}>
                    <Text size="lg" fw={600} c="#777" lh={1} style={{ fontSize: 18 }}>0</Text>
                    <Text size="xs" c="#666" style={{ fontSize: 10, marginTop: 6, marginLeft: 15 }}>⚫</Text>
                  </Box>
                </Box>
                <Box style={{ width: 65, height: 28, userSelect: 'none', color: '#666', boxShadow: '-1px 1px #111, -1px 1px #111, -2px 2px #111, -2px 2px #111, -2px 1px #111', borderRadius: 30 }}>
                  <Box style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 10px' }}>
                    <Text size="lg" fw={600} c="#777" lh={1} style={{ fontSize: 18 }}>#</Text>
                    <Text size="xs" c="#666" style={{ fontSize: 10, marginTop: 6, marginLeft: 15 }}>⇧</Text>
                  </Box>
                </Box>
              </Box>

              {/* Input and Send Area */}
              <Box px={10} mt={-280}>
                <Textarea
                  placeholder="Type message..."
                  {...form.getInputProps('message')}
                  onKeyDown={handleKeyPress}
                  minRows={1}
                  maxRows={2}
                  autosize
                  disabled={sending}
                  styles={{
                    input: {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: '1px solid #444',
                      borderRadius: 8,
                      fontSize: '11px',
                      padding: '4px 8px',
                      color: '#ccc'
                    }
                  }}
                />
                <Group justify="center" mt={8}>
                  <ActionIcon
                    size={32}
                    radius="xl"
                    variant="filled"
                    color="teal"
                    onClick={() => void handleSendMessage()}
                    loading={sending}
                    disabled={!form.values.message.trim()}
                  >
                    <IconSend size={14} />
                  </ActionIcon>
                </Group>
              </Box>

              {/* Bottom dot */}
              <Box
                style={{
                  width: 6,
                  height: 2,
                  margin: '20px auto 0 auto',
                  backgroundColor: '#000'
                }}
              />
            </Box>
          </Box>
        )}
      </Box>
    </Group>
  );
}
