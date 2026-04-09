"use client"

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { PieChart as PieChartIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DistributionData } from "@/services/report-service"

// Semantic colors for known status/priority labels (indigo-based palette)
const STATUS_COLORS: Record<string, string> = {
  "Done":        "#22c55e",  // green
  "In Progress": "#6366f1",  // indigo
  "To Do":       "#94a3b8",  // slate
  "Backlog":     "#cbd5e1",  // light slate
  "Code Review": "#f59e0b",  // amber
  "Review":      "#f97316",  // orange
};
const PRIORITY_COLORS: Record<string, string> = {
  "CRITICAL": "#ef4444",  // red
  "HIGH":     "#f97316",  // orange
  "MEDIUM":   "#f59e0b",  // amber
  "LOW":      "#6366f1",  // indigo
};
const FALLBACK_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#a855f7", "#06b6d4", "#ec4899"];

function resolveColor(label: string, index: number): string {
  return STATUS_COLORS[label] ?? PRIORITY_COLORS[label] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

interface TaskDistributionChartProps {
  statusData: DistributionData | undefined;
  priorityData: DistributionData | undefined;
  isLoading: boolean;
  isError: boolean;
}

function DistributionPieChart({ data, isLoading, isError }: {
  data: DistributionData | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return <Skeleton className="w-full h-64" />;
  }

  if (isError) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Veriler yüklenemedi. Sayfayı yenileyin.</p>
      </div>
    );
  }

  if (!data || !data.items || data.items.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Bu dönem için veri bulunamadı.</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data.items}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            dataKey="count"
            nameKey="label"
          >
            {data.items.map((item, i) => (
              <Cell
                key={`cell-${i}`}
                fill={resolveColor(item.label, i)}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TaskDistributionChart({
  statusData,
  priorityData,
  isLoading,
  isError,
}: TaskDistributionChartProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-primary" />
          Görev Dağılımı
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status">
          <TabsList className="mb-3">
            <TabsTrigger value="status">Durum</TabsTrigger>
            <TabsTrigger value="priority">Öncelik</TabsTrigger>
          </TabsList>
          <TabsContent value="status">
            <DistributionPieChart data={statusData} isLoading={isLoading} isError={isError} />
          </TabsContent>
          <TabsContent value="priority">
            <DistributionPieChart data={priorityData} isLoading={isLoading} isError={isError} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
