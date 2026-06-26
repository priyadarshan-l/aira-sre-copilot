"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Bullet } from "@/components/ui/bullet";
import { AnimatePresence, motion, PanInfo } from "motion/react";
import NotificationItem from "./notification-item";
import type { AIRANotification } from "@/types/aira";
import { SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsV0 } from "@/lib/v0-context";

interface MobileNotificationsProps {
  initialNotifications: AIRANotification[];
}

interface SwipeableWrapperProps {
  children: React.ReactNode;
  onDelete: () => void;
}

function SwipeableWrapper({ children, onDelete }: SwipeableWrapperProps) {
  const handleDragEnd = (event: Event, info: PanInfo) => {
    const shouldDelete =
      info.offset.x < -120 || (info.offset.x < -50 && info.velocity.x < -500);

    if (shouldDelete) {
      onDelete();
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: -200, right: 0 }}
      dragSnapToOrigin
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      whileDrag={{
        scale: 0.98,
        boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
      }}
      className="relative cursor-grab active:cursor-grabbing"
      style={{ touchAction: "pan-y" }}
    >
      {children}
    </motion.div>
  );
}

export default function MobileNotifications({
  initialNotifications,
}: MobileNotificationsProps) {
  const [notifications, setNotifications] =
    useState<AIRANotification[]>(initialNotifications);

  const isV0 = useIsV0();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const incidentCount = notifications.filter(
    (n) => n.type === "incident" && !n.read
  ).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Accessibility Title */}
      <SheetHeader className="sr-only">
        <SheetTitle>AIRA Alerts</SheetTitle>
      </SheetHeader>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          {unreadCount > 0 ? (
            <Badge
              variant={incidentCount > 0 ? "destructive" : "default"}
              className={incidentCount > 0 ? "animate-pulse" : ""}
            >
              {unreadCount}
            </Badge>
          ) : (
            <Bullet variant="success" />
          )}
          <h2 className="text-sm font-medium uppercase">Alerts</h2>
        </div>
        <SheetClose>
          <Badge
            variant="secondary"
            className="uppercase text-muted-foreground"
          >
            Close
          </Badge>
        </SheetClose>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto overflow-x-clip p-2 space-y-2 bg-muted">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <Bullet variant="success" className="size-3" />
            <p className="text-sm text-muted-foreground">
              No alerts - All systems nominal
            </p>
          </div>
        ) : (
          <AnimatePresence mode={isV0 ? "wait" : "popLayout"}>
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, x: -300 }}
                transition={{
                  layout: { duration: 0.3, ease: "easeOut" },
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 },
                  x: { duration: 0.2 },
                }}
              >
                <SwipeableWrapper
                  onDelete={() => deleteNotification(notification.id)}
                >
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                </SwipeableWrapper>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Swipe Hint */}
      {notifications.length > 0 && (
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Swipe left to dismiss alerts
          </p>
        </div>
      )}
    </div>
  );
}
