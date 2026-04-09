"use client"

import { useState } from "react"
import Link from "next/link"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { BarChart3, Layers } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { BurndownData, DistributionData } from "@/services/report-service"

interface SprintBurndownChartProps {
  data: BurndownData | undefined;
  isLoading: boolean;
  isError: boolean;
  projectId: number | null;
  methodology?: string;
  wipData?: DistributionData;
}

const STATUS_COLORS: Record<string, string> = {
  "Done":        "#22c55e",
  "In Progress": "#6366f1",
  "To Do":       "#94a3b8",
  "Backlog":     "#cbd5e1",
  "Code Review": "#f59e0b",
  "Review":      "#f97316",
};
const FALLBACK_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#a855f7", "#06b6d4"];

export function SprintBurndownChart({
  data,
  isLoading,
  isError,
  projectId,
  methodology,
  wipData,
}: SprintBurndownChartProps) {
  const [showLastSprint, setShowLastSprint] = useState(false);
  const isScrum = !methodology || methodology === "SCRUM";

  const title = isScrum
    ? "Sprint Burndown"
    : methodology === "KANBAN"
    ? "WIP Dağılımı"
    : "Görev Durumu";

  const Icon = isScrum ? BarChart3 : Layers;

  const renderWip = () => {
    if (!wipData || wipData.items.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Görev verisi bulunamadı.</p>
        </div>
      );
    }
    return (
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={wipData.items} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis dataKey="label" type="category" tick={{ fontSize: 11 }} width={90} />
            <Tooltip formatter={(v: number) => [v, "Görev"]} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
              {wipData.items.map((item, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={STATUS_COLORS[item.label] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderBurndown = () => {
    const hasData = data && data.series && data.series.length > 0;
    const hasSprintButNoData = data && data.sprint_id && (!data.series || data.series.length === 0);

    if (hasData || (hasSprintButNoData && showLastSprint)) {
      const chartData = data?.series || [];
      return (
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="remaining"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.15}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (hasSprintButNoData && !showLastSprint) {
      return (
        <div className="relative h-64">
          <div className="absolute inset-0 blur-sm opacity-40 flex items-center justify-center bg-muted/20">
            <BarChart3 className="h-20 w-20 text-muted-foreground" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-card/80 rounded-md">
            <BarChart3 className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">Aktif sprint bulunmuyor.</p>
            {projectId && (
              <Button variant="default" asChild>
                <Link href={`/projects/${projectId}/sprints`}>Yeni Sprint Başlat</Link>
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowLastSprint(true)}>
              Son Sprinti Göster
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="h-64 flex flex-col items-center justify-center gap-4">
        <BarChart3 className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">Aktif sprint bulunmuyor.</p>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading) return <Skeleton className="w-full h-64" />;
    if (isError) {
      return (
        <div className="h-64 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Veriler yüklenemedi. Sayfayı yenileyin.</p>
        </div>
      );
    }
    return isScrum ? renderBurndown() : renderWip();
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
