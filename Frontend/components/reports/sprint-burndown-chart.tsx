"use client"

import { useState } from "react"
import Link from "next/link"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { BurndownData } from "@/services/report-service"

interface SprintBurndownChartProps {
  data: BurndownData | undefined;
  isLoading: boolean;
  isError: boolean;
  projectId: number | null;
}

export function SprintBurndownChart({
  data,
  isLoading,
  isError,
  projectId,
}: SprintBurndownChartProps) {
  const [showLastSprint, setShowLastSprint] = useState(false);

  const hasData = data && data.series && data.series.length > 0;
  const hasSprintButNoData = data && data.sprint_id && (!data.series || data.series.length === 0);
  const noSprintAtAll = !data || (!data.sprint_id && (!data.series || data.series.length === 0));

  const renderContent = () => {
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

    if (hasData || (hasSprintButNoData && showLastSprint)) {
      // Show the actual chart (data exists, or user clicked "Son Sprinti Göster")
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
      // Has a sprint but no active data — show blurred overlay pattern
      return (
        <div className="relative h-64">
          {/* Blurred placeholder behind */}
          <div className="absolute inset-0 blur-sm opacity-40 flex items-center justify-center bg-muted/20">
            <BarChart3 className="h-20 w-20 text-muted-foreground" />
          </div>
          {/* Overlay */}
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

    // No sprint at all
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-4">
        <BarChart3 className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">Aktif sprint bulunmuyor.</p>
      </div>
    );
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Sprint Burndown
        </CardTitle>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
