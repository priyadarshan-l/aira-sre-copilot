import React from "react";
import NumberFlow from "@number-flow/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bullet } from "@/components/ui/bullet";
import { cn } from "@/lib/utils";

interface AIRAStatProps {
  label: string;
  value: string;
  description?: string;
  tag?: string;
  icon: React.ElementType;
  intent?: "positive" | "negative" | "neutral" | "info";
  trend?: {
    direction: "up" | "down";
    value: string;
    isGood: boolean;
  };
}

export default function AIRAStat({
  label,
  value,
  description,
  icon,
  tag,
  intent = "neutral",
  trend,
}: AIRAStatProps) {
  const Icon = icon;

  // Extract prefix, numeric value, and suffix from the value string
  const parseValue = (val: string) => {
    const match = val.match(/^([^\d.-]*)([+-]?\d*\.?\d+)([^\d]*)$/);

    if (match) {
      const [, prefix, numStr, suffix] = match;
      let parsedNum = parseFloat(numStr);
      // Safety net: limit long decimal numbers to max 2 decimal places to prevent layout outflow/overflow
      if (numStr.includes(".") && numStr.split(".")[1].length > 2) {
        parsedNum = parseFloat(parsedNum.toFixed(2));
      }
      return {
        prefix: prefix || "",
        numericValue: parsedNum,
        suffix: suffix || "",
        isNumeric: !isNaN(parsedNum),
      };
    }

    return {
      prefix: "",
      numericValue: 0,
      suffix: val,
      isNumeric: false,
    };
  };

  const getIntentClassName = () => {
    if (intent === "positive") return "text-success";
    if (intent === "negative") return "text-destructive";
    if (intent === "info") return "text-primary";
    return "text-muted-foreground";
  };

  const { prefix, numericValue, suffix, isNumeric } = parseValue(value);

  return (
    <Card className="relative overflow-hidden group">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2.5">
          <Bullet
            className={cn(
              intent === "positive" && "bg-success",
              intent === "negative" && "bg-destructive",
              intent === "info" && "bg-primary"
            )}
          />
          {label}
        </CardTitle>
        <Icon className={cn("size-4", getIntentClassName())} />
      </CardHeader>

      <CardContent className="bg-accent flex-1 pt-2 md:pt-6 overflow-clip relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className={cn("text-4xl md:text-5xl font-display font-semibold tracking-tight", getIntentClassName())}>
              {isNumeric ? (
                <NumberFlow
                  value={numericValue}
                  prefix={prefix}
                  suffix={suffix}
                />
              ) : (
                value
              )}
            </span>
            {tag && (
              <Badge variant="default" className="uppercase ml-3 text-[10px] py-0.5 px-2 bg-primary/15 text-primary border border-primary/20">
                {tag}
              </Badge>
            )}
          </div>

          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border font-mono",
              trend.isGood
                ? "bg-success/10 text-success border-success/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
            )}>
              <span>{trend.direction === "up" ? "↑" : "↓"}</span>
              <span>{trend.value}</span>
            </div>
          )}
        </div>

        {description && (
          <div className="justify-between mt-1">
            <p className="text-xs md:text-sm font-medium text-muted-foreground tracking-wide">
              {description}
            </p>
          </div>
        )}

        {/* Subtle hover background highlight */}
        <div
          className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
            intent === "positive" && "bg-success/5",
            intent === "negative" && "bg-destructive/5",
            intent === "info" && "bg-primary/5"
          )}
        />
      </CardContent>
    </Card>
  );
}
