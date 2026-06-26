import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";
import { cn } from "@/lib/utils";

interface DashboardCardProps
  extends Omit<React.ComponentProps<typeof Card>, "title"> {
  // Support both legacy `title` prop and new `header` prop
  title?: string;
  header?: {
    title: string;
    icon?: React.ElementType;
  };
  addon?: React.ReactNode;
  intent?: "default" | "success";
  children: React.ReactNode;
}

export function DashboardCard({
  title,
  header,
  addon,
  intent = "default",
  children,
  className,
  ...props
}: DashboardCardProps) {
  const displayTitle = header?.title || title || "";
  const IconComponent = header?.icon;

  return (
    <Card className={cn("flex flex-col", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2.5">
          {IconComponent ? (
            <IconComponent className="size-4 text-primary" />
          ) : (
            <Bullet variant={intent} />
          )}
          <span className="text-sm font-semibold uppercase tracking-wide">
            {displayTitle}
          </span>
        </CardTitle>
        {addon && <div>{addon}</div>}
      </CardHeader>

      <CardContent className="flex-1 relative">{children}</CardContent>
    </Card>
  );
}

// Default export for backwards compatibility
export default DashboardCard;
