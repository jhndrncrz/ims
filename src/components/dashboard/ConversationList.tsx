import { Badge, Card, Group, Paper, ScrollArea, Stack, Text } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";

type Conversation = {
  phoneNumber: string;
  messageCount: number;
  lastMessage: {
    body: string;
    direction: "INBOUND" | "OUTBOUND";
    createdAt: string;
  };
  messages?: unknown[]; // Optional for compatibility
};

type ConversationListProps = {
  conversations: Conversation[];
  selectedPhoneNumber: string | null;
  onSelect: (conversation: Conversation) => void;
  parseIdentifier: (phoneNumber: string) => { channel: string; display: string; color: string };
};

export function ConversationList({ conversations, selectedPhoneNumber, onSelect, parseIdentifier }: ConversationListProps) {
  return (
    <Card withBorder shadow="sm" style={{ flex: "0 0 320px" }}>
      <Card.Section inheritPadding py="sm" withBorder>
        <Text fw={600}>All Conversations ({conversations.length})</Text>
      </Card.Section>
      <ScrollArea h={600}>
        <Stack gap="xs" p="xs">
          {conversations.map((conv) => {
            const { channel, display, color } = parseIdentifier(conv.phoneNumber);
            return (
              <Paper
                key={conv.phoneNumber}
                p="md"
                withBorder
                style={{
                  cursor: "pointer",
                  backgroundColor: selectedPhoneNumber === conv.phoneNumber ? "var(--mantine-color-gray-1)" : undefined
                }}
                onClick={() => onSelect(conv)}
              >
                <Group justify="space-between" wrap="nowrap">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Group gap="xs" mb={4}>
                      <Badge size="xs" color={color}>
                        {channel}
                      </Badge>
                    </Group>
                    <Text fw={600} size="sm">
                      {display}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {conv.lastMessage.body}
                    </Text>
                  </div>
                  <div>
                    <Badge size="sm" color="gray">
                      {conv.messageCount}
                    </Badge>
                    <IconChevronRight size={16} />
                  </div>
                </Group>
              </Paper>
            );
          })}
        </Stack>
      </ScrollArea>
    </Card>
  );
}
