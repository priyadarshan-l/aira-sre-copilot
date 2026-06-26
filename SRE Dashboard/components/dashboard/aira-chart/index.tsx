"use client";

import * as React from "react";
import { XAxis, YAxis, CartesianGrid, Area, AreaChart, Bar, BarChart, Line, LineChart, ComposedChart } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bullet } from "@/components/ui/bullet";
import type { AIRAChartData, TimePeriod, ChartDataPoint } from "@/types/aira";

const chartConfig = {
  incidents: {
    label: "Incidents",
    color: "var(--chart-4)",
  },
  resolved: {
    label: "Resolved",
    color: "var(--chart-2)",
  },
  mttr: {
    label: "MTTR (min)",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface AIRAChartProps {
  chartData: AIRAChartData;
}

const AIRAChart = React.memo(function AIRAChart({ chartData }: AIRAChartProps) {
  const [activeTab, setActiveTab] = React.useState<TimePeriod>("week");

  const handleTabChange = (value: string) => {
    if (value === "week" || value === "month" || value === "year") {
      setActiveTab(value as TimePeriod);
    }
  };

  const formatYAxisValue = (value: number) => {
    if (value === 0) return "";
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const renderChart = (data: ChartDataPoint[]) => {
    return (
      <div className="bg-accent rounded-lg p-3">
        <ChartContainer className="md:aspect-[3/1] w-full" config={chartConfig}>
          <ComposedChart
            accessibilityLayer
            data={data}
            margin={{
              left: -12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <defs>
              <linearGradient id="fillIncidents" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-incidents)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-incidents)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillResolved" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-resolved)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-resolved)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              horizontal={false}
              strokeDasharray="8 8"
              strokeWidth={2}
              stroke="var(--muted-foreground)"
              opacity={0.3}
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={12}
              strokeWidth={1.5}
              className="uppercase text-sm fill-muted-foreground"
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tickMargin={0}
              tickCount={6}
              className="text-sm fill-muted-foreground"
              tickFormatter={formatYAxisValue}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={0}
              tickCount={6}
              className="text-sm fill-muted-foreground"
              tickFormatter={(v) => `${v}m`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  className="min-w-[200px] px-4 py-3"
                />
              }
            />
            <Area
              yAxisId="left"
              dataKey="incidents"
              type="monotone"
              fill="url(#fillIncidents)"
              fillOpacity={0.4}
              stroke="var(--color-incidents)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Area
              yAxisId="left"
              dataKey="resolved"
              type="monotone"
              fill="url(#fillResolved)"
              fillOpacity={0.4}
              stroke="var(--color-resolved)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="right"
              dataKey="mttr"
              type="monotone"
              stroke="var(--color-mttr)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--color-mttr)" }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ChartContainer>
      </div>
    );
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="max-md:gap-4"
    >
      <div className="flex items-center justify-between mb-4 max-md:contents">
        <TabsList className="max-md:w-full">
          <TabsTrigger value="week">WEEK</TabsTrigger>
          <TabsTrigger value="month">MONTH</TabsTrigger>
          <TabsTrigger value="year">YEAR</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-6 max-md:order-1">
          {Object.entries(chartConfig).map(([key, value]) => (
            <ChartLegend key={key} label={value.label} color={value.color} />
          ))}
        </div>
      </div>
      <TabsContent value="week" className="space-y-4">
        {renderChart(chartData.week)}
      </TabsContent>
      <TabsContent value="month" className="space-y-4">
        {renderChart(chartData.month)}
      </TabsContent>
      <TabsContent value="year" className="space-y-4">
        {renderChart(chartData.year)}
      </TabsContent>
    </Tabs>
  );
});

export default AIRAChart;

export const ChartLegend = ({
  label,
  color,
}: {
  label: string;
  color: string;
}) => {
  return (
    <div className="flex items-center gap-2 uppercase">
      <Bullet style={{ backgroundColor: color }} className="rotate-45" />
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
};
