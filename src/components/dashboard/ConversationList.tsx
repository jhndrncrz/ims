import { Badge, Button, Card, Combobox, Group, InputBase, Paper, ScrollArea, Stack, Text, TextInput, useCombobox } from "@mantine/core";
import { IconChevronRight, IconSearch, IconX } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { formatDateTime } from "@/lib/formatters";
import {
  sentimentColors,
  sentimentOptions,
  channelColors,
  channelOptions,
  sortOptions
} from "@/constants/conversationConstants";

type ConversationSentiment = {
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  score: number;
  keywords: string[];
  summary?: string | null;
  lastAnalyzedAt?: string;
};

type Conversation = {
  phoneNumber: string;
  messageCount: number;
  lastMessage: {
    body: string;
    direction: "INBOUND" | "OUTBOUND";
    createdAt: string;
  };
  messages?: unknown[];
  conversationSentiment?: ConversationSentiment | null;
};

type ConversationListProps = {
  conversations: Conversation[];
  selectedPhoneNumber: string | null;
  onSelect: (conversation: Conversation) => void;
  parseIdentifier: (phoneNumber: string) => { channel: string; display: string; color: string };
};

export function ConversationList({ conversations, selectedPhoneNumber, onSelect, parseIdentifier }: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<string[]>([]);
  const [channelFilter, setChannelFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("date-desc");

  const sentimentCombobox = useCombobox({ onDropdownClose: () => sentimentCombobox.resetSelectedOption() });
  const channelCombobox = useCombobox({ onDropdownClose: () => channelCombobox.resetSelectedOption() });
  const sortCombobox = useCombobox({ onDropdownClose: () => sortCombobox.resetSelectedOption() });

  const filteredAndSorted = useMemo(() => {
    let filtered = [...conversations];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conv => {
        const { display } = parseIdentifier(conv.phoneNumber);
        return (
          display.toLowerCase().includes(query) ||
          conv.lastMessage.body.toLowerCase().includes(query) ||
          conv.conversationSentiment?.summary?.toLowerCase().includes(query)
        );
      });
    }

    // Sentiment filter
    if (sentimentFilter.length > 0) {
      filtered = filtered.filter(conv => 
        conv.conversationSentiment && sentimentFilter.includes(conv.conversationSentiment.sentiment)
      );
    }

    // Channel filter
    if (channelFilter.length > 0) {
      filtered = filtered.filter(conv => {
        const { channel } = parseIdentifier(conv.phoneNumber);
        return channelFilter.includes(channel);
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
        case "date-asc":
          return new Date(a.lastMessage.createdAt).getTime() - new Date(b.lastMessage.createdAt).getTime();
        case "messages-desc":
          return b.messageCount - a.messageCount;
        case "messages-asc":
          return a.messageCount - b.messageCount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [conversations, searchQuery, sentimentFilter, channelFilter, sortBy, parseIdentifier]);

  const hasActiveFilters = searchQuery || sentimentFilter.length > 0 || channelFilter.length > 0;

  const clearAllFilters = () => {
    setSearchQuery("");
    setSentimentFilter([]);
    setChannelFilter([]);
    setSortBy("date-desc");
  };

  return (
    <Card withBorder shadow="sm" style={{ flex: "0 0 380px" }}>
      <Card.Section inheritPadding py="sm" withBorder>
        <Text fw={600} mb="md">All Conversations ({filteredAndSorted.length})</Text>
        
        <Stack gap="xs">
          <TextInput
            placeholder="Search by phone, message, or summary..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            size="xs"
          />

          <Group gap="xs" grow>
            <Combobox
              store={sentimentCombobox}
              onOptionSubmit={(val) => {
                setSentimentFilter(prev =>
                  prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]
                );
              }}
            >
              <Combobox.Target>
                <InputBase
                  component="button"
                  type="button"
                  pointer
                  rightSection={<Combobox.Chevron />}
                  onClick={() => sentimentCombobox.toggleDropdown()}
                  size="xs"
                >
                  {sentimentFilter.length > 0 ? (
                    <Group gap={4}>
                      {sentimentFilter.map(s => (
                        <Badge key={s} size="xs" color={sentimentColors[s as keyof typeof sentimentColors]}>
                          {s}
                        </Badge>
                      ))}
                    </Group>
                  ) : (
                    <Text size="xs" c="dimmed">Sentiment</Text>
                  )}
                </InputBase>
              </Combobox.Target>
              <Combobox.Dropdown>
                <Combobox.Options>
                  {sentimentOptions.map(sent => (
                    <Combobox.Option key={sent} value={sent}>
                      <Badge size="xs" color={sentimentColors[sent]} variant={sentimentFilter.includes(sent) ? "filled" : "light"}>
                        {sent}
                      </Badge>
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              </Combobox.Dropdown>
            </Combobox>

            <Combobox
              store={channelCombobox}
              onOptionSubmit={(val) => {
                setChannelFilter(prev =>
                  prev.includes(val) ? prev.filter(c => c !== val) : [...prev, val]
                );
              }}
            >
              <Combobox.Target>
                <InputBase
                  component="button"
                  type="button"
                  pointer
                  rightSection={<Combobox.Chevron />}
                  onClick={() => channelCombobox.toggleDropdown()}
                  size="xs"
                >
                  {channelFilter.length > 0 ? (
                    <Group gap={4}>
                      {channelFilter.map(c => (
                        <Badge key={c} size="xs" color={channelColors[c as keyof typeof channelColors]}>
                          {c}
                        </Badge>
                      ))}
                    </Group>
                  ) : (
                    <Text size="xs" c="dimmed">Channel</Text>
                  )}
                </InputBase>
              </Combobox.Target>
              <Combobox.Dropdown>
                <Combobox.Options>
                  {channelOptions.map(chan => (
                    <Combobox.Option key={chan} value={chan}>
                      <Badge size="xs" color={channelColors[chan]} variant={channelFilter.includes(chan) ? "filled" : "light"}>
                        {chan}
                      </Badge>
                    </Combobox.Option>
                  ))}
                </Combobox.Options>
              </Combobox.Dropdown>
            </Combobox>
          </Group>

          <Combobox
            store={sortCombobox}
            onOptionSubmit={(val) => {
              setSortBy(val);
              sortCombobox.closeDropdown();
            }}
          >
            <Combobox.Target>
              <InputBase
                component="button"
                type="button"
                pointer
                rightSection={<Combobox.Chevron />}
                onClick={() => sortCombobox.toggleDropdown()}
                size="xs"
              >
                <Text size="xs">
                  {sortOptions.find(opt => opt.value === sortBy)?.label || "Sort by"}
                </Text>
              </InputBase>
            </Combobox.Target>
            <Combobox.Dropdown>
              <Combobox.Options>
                {sortOptions.map(opt => (
                  <Combobox.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </Combobox.Dropdown>
          </Combobox>

          {hasActiveFilters && (
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              leftSection={<IconX size={14} />}
              onClick={clearAllFilters}
              fullWidth
            >
              Clear All Filters
            </Button>
          )}
        </Stack>
      </Card.Section>

      <ScrollArea h={500}>
        <Stack gap="xs" p="xs" pr="xl">
          {filteredAndSorted.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="xl">
              No conversations match your filters
            </Text>
          ) : (
            filteredAndSorted.map((conv) => {
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
                  <Group justify="space-between" wrap="nowrap" align="flex-start">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Group gap="xs" mb={4}>
                        <Badge size="xs" color={color}>
                          {channel}
                        </Badge>
                        {conv.conversationSentiment && (
                          <Badge 
                            size="xs" 
                            color={sentimentColors[conv.conversationSentiment.sentiment]}
                            variant="dot"
                          >
                            {conv.conversationSentiment.sentiment}
                          </Badge>
                        )}
                      </Group>
                      <Text fw={600} size="sm" mb={2}>
                        {display}
                      </Text>
                      <Text size="xs" c="dimmed" lineClamp={1} mb={4}>
                        {conv.conversationSentiment?.summary || conv.lastMessage.body}
                      </Text>
                      <Text size="xs" c="dimmed" fs="italic">
                        {formatDateTime(conv.lastMessage.createdAt)}
                      </Text>
                    </div>
                    <Group gap="xs" align="center">
                      <Badge size="sm" color="gray">
                        {conv.messageCount}
                      </Badge>
                      <IconChevronRight size={16} />
                    </Group>
                  </Group>
                </Paper>
              );
            })
          )}
        </Stack>
      </ScrollArea>
    </Card>
  );
}
