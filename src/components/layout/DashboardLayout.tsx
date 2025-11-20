"use client";

import { BarangaySettings } from "@/types/templates";
import { AppShell, Burger, Group, NavLink, ScrollArea, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { logger } from "@/lib/logger";
import {
  IconChartBar,
  IconFileText,
  IconHome,
  IconMessages,
  IconSettings
} from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

type DashboardLayoutProps = {
  children: ReactNode;
};

const navigation = [
  { label: "Dashboard", icon: IconHome, href: "/dashboard" },
  { label: "Reports", icon: IconChartBar, href: "/dashboard/reports" },
  { label: "Conversations", icon: IconMessages, href: "/dashboard/conversations" },
  { label: "Knowledge Base", icon: IconFileText, href: "/dashboard/documents" },
  { label: "Settings", icon: IconSettings, href: "/dashboard/settings" }
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [settings, setSettings] = useState<BarangaySettings | null>(null);
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json() as BarangaySettings;
          setSettings(data);
        }
      } catch (error) {
        logger.error("Failed to fetch settings in dashboard layout", { error });
      }
    }
    void fetchSettings();
  }, []);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: "sm",
        collapsed: { mobile: !opened }
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text 
              size="lg" 
              fw={700} 
              c="red"
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/")}
            >
              Barangay AI SMS Hub
            </Text>
          </Group>
          <Group>
            <Text size="sm" c="dimmed">
              {settings ? `Logged in as: ${settings.barangayName}` : "Loading settings..."}
            </Text>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow component={ScrollArea}>
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              label={item.label}
              leftSection={<item.icon size={20} stroke={1.5} />}
              active={pathname === item.href}
              onClick={() => {
                router.push(item.href);
                if (opened) toggle();
              }}
              mb={4}
            />
          ))}
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
