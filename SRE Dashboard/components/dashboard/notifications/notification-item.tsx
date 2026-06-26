'use client';

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AIRANotification } from "@/types/aira";

interface NotificationItemProps {
  notification: AIRANotification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const formatTimestamp = (timestamp: string) => {
    if (!mounted) return "";
    let date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      // If it is just a time string like "HH:MM:SS", parse it relative to today's date
      const timeRegex = /^(\d{1,2}):(\d{2}):(\d{2})$/;
      const match = String(timestamp).match(timeRegex);
      if (match) {
        date = new Date();
        date.setHours(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
      } else {
        return String(timestamp);
      }
    }
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 0) return "Just now";
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 60) {
      return minutes <= 0 ? "Just now" : `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };


  const getTypeColor = (type: AIRANotification["type"]) => {
    switch (type) {
      case "incident":
        return "bg-destructive";
      case "resolution":
        return "bg-success";
      case "alert":
        return "bg-warning";
      case "system":
        return "bg-primary";
      default:
        return "bg-muted-foreground";
    }
  };

  const getSeverityBadge = (severity?: AIRANotification["severity"]) => {
    if (!severity) return null;
    switch (severity) {
      case "critical":
        return (
          <Badge variant="destructive" className="text-[10px] animate-pulse">
            CRITICAL
          </Badge>
        );
      case "high":
        return (
          <Badge variant="outline-warning" className="text-[10px]">
            HIGH
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="secondary" className="text-[10px]">
            MEDIUM
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleNotificationClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  const handleClearClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  return (
    <div
      className={cn(
        "group p-3 rounded-lg border transition-all duration-200 hover:shadow-sm",
        !notification.read && "cursor-pointer",
        notification.read
          ? "bg-background/50 border-border/30"
          : "bg-background border-border shadow-sm",
        notification.type === "incident" && !notification.read && "border-destructive/30 bg-destructive/5"
      )}
      onClick={handleNotificationClick}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-2 h-2 rounded-full mt-2 flex-shrink-0",
            getTypeColor(notification.type),
            notification.type === "incident" && !notification.read && "animate-pulse"
          )}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <h4
                    className={cn(
                      "text-sm font-medium truncate",
                      !notification.read && "font-semibold",
                      notification.type === "incident" && "text-destructive",
                      (notification.type === "resolution" || notification.title.includes("SUCCESS") || notification.title.includes("RESOLVED")) && "text-success"
                    )}
                  >
                    {notification.title}
                  </h4>
                  {getSeverityBadge(notification.severity)}
                  {(notification.type === "resolution" || notification.title.includes("SUCCESS") || notification.message.includes("resolved") || notification.message.includes("remediated")) && (
                    <Badge variant="outline" className="text-[10px] bg-success/20 text-success border-success/30 font-bold shrink-0 animate-pulse">
                      ✓ SOLVED & REMEDIATED
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearClick}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-6 px-2 text-muted-foreground hover:text-destructive shrink-0"
                >
                  clear
                </Button>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {notification.message}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {formatTimestamp(notification.timestamp)}
                </span>
                <Badge variant="outline" className="text-[9px] uppercase">
                  {notification.type}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
