"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bullet } from "@/components/ui/bullet";
import NotificationItem from "./notification-item";
import type { AIRANotification } from "@/types/aira";
import { AnimatePresence, motion } from "motion/react";
import { useAIRA } from "@/lib/aira-provider";

interface NotificationsProps {
  initialNotifications: AIRANotification[];
}

export default function Notifications({
  initialNotifications,
}: NotificationsProps) {
  const [notifications, setNotifications] =
    useState<AIRANotification[]>(initialNotifications);
  const [showAll, setShowAll] = useState(false);

  // Get real-time logs from backend
  const { logs, isConnected } = useAIRA();

  // Convert logs to notification format and merge with existing
  useEffect(() => {
    if (isConnected && logs.length > 0) {
      const logNotifications: AIRANotification[] = logs.slice(-5).map((log, i) => ({
        id: `log-${log.timestamp}-${i}`,
        type: log.level === "error" ? "incident" : log.level === "success" ? "resolution" : "agent_update",
        title: `[${log.agent || "AIRA"}] ${log.level.toUpperCase()}`,
        message: log.message,
        timestamp: log.timestamp,
        read: false,
        priority: log.level === "error" ? "high" : "low",
      }));
      // Merge with initial, avoiding duplicates
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const newOnes = logNotifications.filter(n => !existingIds.has(n.id));
        return [...newOnes, ...prev].slice(0, 10);
      });
    }
  }, [logs, isConnected]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayedNotifications = showAll
    ? notifications
    : notifications.slice(0, 3);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex items-center justify-between pl-3 pr-1">
        <CardTitle className="flex items-center gap-2.5 text-sm font-medium uppercase">
          {unreadCount > 0 ? (
            <Badge variant="destructive" className="animate-pulse">{unreadCount}</Badge>
          ) : (
            <Bullet variant="success" />
          )}
          Alerts
        </CardTitle>
        {notifications.length > 0 && (
          <Button
            className="opacity-50 hover:opacity-100 uppercase"
            size="sm"
            variant="ghost"
            onClick={clearAll}
          >
            Clear All
          </Button>
        )}
      </CardHeader>

      <CardContent className="bg-accent p-1.5 overflow-hidden">
        <div className="space-y-2">
          <AnimatePresence initial={false} mode="popLayout">
            {displayedNotifications.map((notification) => (
              <motion.div
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                key={notification.id}
              >
                <NotificationItem
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              </motion.div>
            ))}

            {notifications.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No alerts - All systems nominal
                </p>
              </div>
            )}

            {notifications.length > 3 && (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="w-full"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="w-full"
                >
                  {showAll ? "Show Less" : `Show All (${notifications.length})`}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
