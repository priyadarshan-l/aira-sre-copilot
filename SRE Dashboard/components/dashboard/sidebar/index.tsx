"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import AiraIcon from "@/components/icons/aira";
import {
  IncidentIcon,
  MemoryIcon,
  DatabaseIcon,
  NetworkIcon,
} from "@/components/icons/agents";
import BracketsIcon from "@/components/icons/brackets";
import ProcessorIcon from "@/components/icons/proccesor";
import CuteRobotIcon from "@/components/icons/cute-robot";
import GearIcon from "@/components/icons/gear";
import DotsVerticalIcon from "@/components/icons/dots-vertical";
import { Bullet } from "@/components/ui/bullet";
import Image from "next/image";

// AIRA Navigation Data
const data = {
  navMain: [
    {
      title: "Operations",
      items: [
        {
          title: "Command Center",
          url: "/",
          icon: BracketsIcon,
        },
        {
          title: "Incidents",
          url: "/incidents",
          icon: IncidentIcon,
          badge: "3",
        },
        {
          title: "Agents",
          url: "/agents",
          icon: CuteRobotIcon,
        },
        {
          title: "Systems",
          url: "/systems",
          icon: ProcessorIcon,
        },
      ],
    },
    {
      title: "Intelligence",
      items: [
        {
          title: "RAG Memory Vault",
          url: "/memory/semantic",
          icon: MemoryIcon,
        },
        {
          title: "RL Policy Table",
          url: "/memory/prescriptive",
          icon: DatabaseIcon,
        },
        {
          title: "Live Agent Terminal",
          url: "/console",
          icon: NetworkIcon,
        },
      ],
    },
    {
      title: "Configuration",
      items: [
        {
          title: "Settings",
          url: "/settings",
          icon: GearIcon,
        },
      ],
    },
    {
      title: "Laboratory",
      items: [
        {
          title: "Model Training Workspace",
          url: "/simulation",
          icon: ProcessorIcon,
          badge: "NEW",
        },
      ],
    },
  ],
  user: {
    name: "SRE ADMIN",
    email: "sre@company.io",
    avatar: "/avatars/user_krimson.png",
    role: "Platform Engineer",
  },
};

export function DashboardSidebar({
  className,
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  // Helper to check if a nav item is active
  const isActive = (url: string) => {
    if (url === "/") return pathname === "/";
    return pathname.startsWith(url);
  };

  return (
    <Sidebar {...props} className={cn("py-sides", className)}>
      <SidebarHeader className="rounded-t-lg flex gap-3 flex-row rounded-b-none">
        <div className="flex overflow-clip size-12 shrink-0 items-center justify-center rounded bg-primary/20 text-primary">
          <AiraIcon className="size-8" />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="text-2xl font-display text-primary">A.I.R.A.</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Autonomous Incident Remediation
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        {data.navMain.map((group, i) => (
          <SidebarGroup
            className={cn(i === 0 && "rounded-t-none")}
            key={group.title}
          >
            <SidebarGroupLabel>
              <Bullet className="mr-2" />
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link href={item.url}>
                        <item.icon className="size-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.badge && (
                      <SidebarMenuBadge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 rounded-full">
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-0">
        {/* System Online Status - Pulsing Indicator */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="relative mr-2">
              <Bullet className="bg-success" />
              <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
            </div>
            System Online
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-3 rounded-lg bg-accent/50 border border-success/20 relative overflow-hidden">
              {/* Cyber grid background */}
              <div className="absolute inset-0 opacity-5 cyber-grid" />

              {/* Status rows */}
              <div className="relative space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Environment</span>
                  <span className="font-bold text-success">PRODUCTION</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Region</span>
                  <span className="font-medium">US-EAST-1</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="font-medium text-primary">99.97%</span>
                </div>

                {/* Divider */}
                <div className="h-px bg-border/50 my-2" />

                {/* Agent Status Grid */}
                <div className="grid grid-cols-4 gap-1">
                  {["PLAN", "RCA", "FIX", "VAL"].map((agent, i) => (
                    <div key={agent} className="flex flex-col items-center">
                      <div className={cn(
                        "size-2 rounded-full mb-1",
                        i === 1 ? "bg-primary animate-pulse" : "bg-success"
                      )} />
                      <span className="text-[9px] text-muted-foreground">{agent}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-muted-foreground">Agents</span>
                  <span className="font-bold text-success">4/4 ONLINE</span>
                </div>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Section */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <Bullet className="mr-2" />
            Operator
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Popover>
                  <PopoverTrigger className="flex gap-0.5 w-full group cursor-pointer">
                    <div className="shrink-0 flex size-14 items-center justify-center rounded-lg bg-primary/20 text-primary overflow-clip">
                      <Image
                        src={data.user.avatar || "/placeholder.svg"}
                        alt={data.user.name}
                        width={120}
                        height={120}
                      />
                    </div>
                    <div className="group/item pl-3 pr-1.5 pt-2 pb-1.5 flex-1 flex bg-sidebar-accent hover:bg-sidebar-accent-active/75 items-center rounded group-data-[state=open]:bg-sidebar-accent-active group-data-[state=open]:hover:bg-sidebar-accent-active group-data-[state=open]:text-sidebar-accent-foreground">
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate text-xl font-display">
                          {data.user.name}
                        </span>
                        <span className="truncate text-xs uppercase opacity-50 group-hover/item:opacity-100">
                          {data.user.role}
                        </span>
                      </div>
                      <DotsVerticalIcon className="ml-auto size-4" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-56 p-0"
                    side="bottom"
                    align="end"
                    sideOffset={4}
                  >
                    <div className="flex flex-col">
                      <button className="flex items-center px-4 py-2 text-sm hover:bg-accent">
                        <AiraIcon className="mr-2 h-4 w-4" />
                        Profile
                      </button>
                      <button className="flex items-center px-4 py-2 text-sm hover:bg-accent">
                        <GearIcon className="mr-2 h-4 w-4" />
                        Preferences
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
